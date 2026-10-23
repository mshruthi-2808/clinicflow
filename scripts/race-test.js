import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

import prisma from '../server/src/config/prisma.js';

const API_BASE = process.env.API_BASE || 'http://localhost:5001/api/v1';

function printHeader(title) {
  console.log('\n' + '='.repeat(75));
  console.log(`  ${title}`);
  console.log('='.repeat(75));
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runRaceTests() {
  console.log('='.repeat(75));
  console.log('  CLINICFLOW CONCURRENCY & RACE CONDITION VERIFICATION TEST');
  console.log('='.repeat(75));

  // 0. Verify backend server is running and reachable
  try {
    const health = await fetch(`${API_BASE}/specialisations`, { signal: AbortSignal.timeout(3000) });
    if (!health.ok && health.status !== 304) {
      throw new Error(`Server returned HTTP ${health.status}`);
    }
  } catch (err) {
    console.error(`\n❌ ERROR: ClinicFlow backend API server is NOT reachable on ${API_BASE}.`);
    console.error(`Please ensure the server is running before executing this test:`);
    console.error(`  cd server && npm run dev\n`);
    process.exit(1);
  }

  // 1. Get an active doctor
  const doctor = await prisma.doctor.findFirst({
    where: { isActive: true },
    include: { specialisation: true },
  });

  if (!doctor) {
    console.error('No active doctor found in database. Run seed first.');
    process.exit(1);
  }

  console.log(`Target Doctor: ${doctor.name} (${doctor.specialisation.name})`);
  console.log(`Doctor ID: ${doctor.id}`);

  // =========================================================================
  // TEST 1: 10 CONCURRENT APPOINTMENT BOOKINGS FOR THE EXACT SAME SLOT
  // =========================================================================
  printHeader('TEST 1: 10 Concurrent Bookings for the SAME Time Slot');
  console.log('Goal: Expect exactly ONE success (201) and NINE conflict rejections (409).');

  // Use a unique future test date to ensure a clean slate
  const raceDate = '2026-12-15';
  const raceSlot = '10:00';

  // Clean up any pre-existing test bookings for that slot
  await prisma.appointment.deleteMany({
    where: {
      doctorId: doctor.id,
      appointmentDate: new Date(raceDate + 'T00:00:00.000Z'),
      slotStart: raceSlot,
    },
  });

  console.log(`Target Slot: Date = ${raceDate}, Slot = ${raceSlot}`);
  console.log('Firing 10 concurrent HTTP POST /appointments requests simultaneously...\n');

  const bookingPromises = Array.from({ length: 10 }, async (_, index) => {
    const workerId = index + 1;
    const patientName = `Race Candidate ${workerId}`;
    const patientPhone = `98765432${String(workerId).padStart(2, '0')}`;
    const startMs = Date.now();

    try {
      const response = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientName,
          patientPhone,
          appointmentDate: raceDate,
          slotStart: raceSlot,
          reason: `Concurrency race test attempt #${workerId}`,
        }),
      });

      const data = await response.json();
      const elapsed = Date.now() - startMs;

      return {
        workerId,
        status: response.status,
        success: data.success,
        errorCode: data.error?.code || null,
        errorMessage: data.error?.message || null,
        appointmentId: data.data?.id || null,
        elapsedMs: elapsed,
      };
    } catch (err) {
      return {
        workerId,
        status: 500,
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: err.message,
        appointmentId: null,
        elapsedMs: Date.now() - startMs,
      };
    }
  });

  const bookingResults = await Promise.all(bookingPromises);

  // Print results table
  console.table(
    bookingResults.map((r) => ({
      'Request #': r.workerId,
      'HTTP Status': r.status,
      'Result': r.success ? '✓ SUCCESS (Booked)' : '✗ BLOCKED (409)',
      'Error Code': r.errorCode || '—',
      'Time (ms)': `${r.elapsedMs}ms`,
    }))
  );

  const successfulBookings = bookingResults.filter((r) => r.status === 201 && r.success);
  const conflictBookings = bookingResults.filter((r) => r.status === 409);

  console.log(`\nResults Analysis:`);
  console.log(`  Successful Bookings (201 Created): ${successfulBookings.length}`);
  console.log(`  Conflict Rejections (409 Conflict): ${conflictBookings.length}`);

  // Database verification
  const dbAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
      appointmentDate: new Date(raceDate + 'T00:00:00.000Z'),
      slotStart: raceSlot,
      status: { not: 'CANCELLED' },
    },
  });

  console.log(`  Database Row Count for Slot: ${dbAppointments.length}`);

  if (successfulBookings.length === 1 && conflictBookings.length === 9 && dbAppointments.length === 1) {
    console.log('\n[PASS] TEST 1 PASSED: Partial unique index "uniq_active_slot" completely prevented double-booking.');
  } else {
    console.error('\n[FAIL] TEST 1 FAILED: Expected exactly 1 success and 9 conflicts.');
    process.exit(1);
  }

  // =========================================================================
  // TEST 2: 10 CONCURRENT CHECK-INS ACROSS DIFFERENT APPOINTMENTS (SAME DOCTOR)
  // =========================================================================
  printHeader('TEST 2: 10 Concurrent Check-Ins Across Different Appointments');
  console.log('Goal: Expect all 10 check-ins to succeed with UNIQUE, GAP-FREE token numbers.');

  // 1. Authenticate staff user to get JWT token
  const staffEmail = process.env.STAFF_EMAIL || 'staff@clinicflow.local';
  const staffPassword = process.env.STAFF_PASSWORD || 'ClinicStaff123!';

  console.log(`Logging in as staff (${staffEmail})...`);
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staffEmail, password: staffPassword }),
  });

  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.data?.token) {
    console.error('Staff login failed:', loginData);
    process.exit(1);
  }

  const staffToken = loginData.data.token;
  console.log('Staff JWT token acquired successfully.');

  // 2. Prepare 10 distinct BOOKED appointments for today
  const todayStr = getTodayDateString();
  const todayDate = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

  console.log(`Creating 10 test BOOKED appointments for today (${todayStr})...`);

  // Slots outside normal clinic hours to avoid conflicts with demo data
  const testSlots = [
    '06:00', '06:15', '06:30', '06:45', '07:00',
    '07:15', '07:30', '07:45', '08:00', '08:15',
  ];

  // Clean up any prior test appointments for these test slots
  await prisma.appointment.deleteMany({
    where: {
      doctorId: doctor.id,
      appointmentDate: todayDate,
      slotStart: { in: testSlots },
    },
  });

  const createdAppointments = [];
  for (let i = 0; i < 10; i++) {
    const apt = await prisma.appointment.create({
      data: {
        doctorId: doctor.id,
        patientName: `CheckIn Race Patient ${i + 1}`,
        patientPhone: `99000000${String(i + 1).padStart(2, '0')}`,
        appointmentDate: todayDate,
        slotStart: testSlots[i],
        reason: 'Concurrent check-in race test',
        status: 'BOOKED',
      },
    });
    createdAppointments.push(apt);
  }

  console.log(`10 test appointments created in status BOOKED.`);

  // Find baseline max token prior to test
  const baselineAgg = await prisma.queueEntry.aggregate({
    where: { doctorId: doctor.id, queueDate: todayDate },
    _max: { tokenNumber: true },
  });
  const baselineToken = baselineAgg._max.tokenNumber || 0;
  console.log(`Doctor's baseline token number prior to check-in race: ${baselineToken}`);

  console.log('\nFiring 10 concurrent POST /queue/check-in requests simultaneously...\n');

  const checkInPromises = createdAppointments.map(async (apt, index) => {
    const workerId = index + 1;
    const startMs = Date.now();

    try {
      const response = await fetch(`${API_BASE}/queue/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ appointmentId: apt.id }),
      });

      const data = await response.json();
      const elapsed = Date.now() - startMs;

      return {
        workerId,
        appointmentId: apt.id,
        status: response.status,
        success: data.success,
        tokenNumber: data.data?.queueEntry?.tokenNumber ?? null,
        error: data.error?.message || null,
        elapsedMs: elapsed,
      };
    } catch (err) {
      return {
        workerId,
        appointmentId: apt.id,
        status: 500,
        success: false,
        tokenNumber: null,
        error: err.message,
        elapsedMs: Date.now() - startMs,
      };
    }
  });

  const checkInResults = await Promise.all(checkInPromises);

  // Print results table
  console.table(
    checkInResults.map((r) => ({
      'Check-in #': r.workerId,
      'HTTP Status': r.status,
      'Result': r.success ? '✓ CHECKED_IN' : '✗ FAILED',
      'Assigned Token': r.tokenNumber ? `#${r.tokenNumber}` : '—',
      'Time (ms)': `${r.elapsedMs}ms`,
    }))
  );

  const successfulCheckIns = checkInResults.filter((r) => r.status === 201 && r.success);
  const issuedTokens = checkInResults.map((r) => r.tokenNumber).filter(Boolean);
  const sortedTokens = [...issuedTokens].sort((a, b) => a - b);

  console.log('\nIssued Token Numbers:', sortedTokens);

  // Check 1: Exactly 10 successful check-ins
  const allSucceeded = successfulCheckIns.length === 10;

  // Check 2: Unique tokens (no duplicates)
  const uniqueTokenSet = new Set(issuedTokens);
  const isUnique = uniqueTokenSet.size === 10;

  // Check 3: Gap-free consecutive sequence
  let isGapFree = true;
  for (let i = 0; i < sortedTokens.length; i++) {
    const expectedToken = baselineToken + i + 1;
    if (sortedTokens[i] !== expectedToken) {
      isGapFree = false;
      break;
    }
  }

  console.log('\nConcurrency Assertions:');
  console.log(`  1. All 10 check-in requests succeeded (201 Created): ${allSucceeded ? '✓ YES' : '✗ NO'}`);
  console.log(`  2. All 10 issued tokens are unique (no duplicates): ${isUnique ? '✓ YES' : '✗ NO'}`);
  console.log(`  3. Tokens are strictly consecutive & gap-free (${baselineToken + 1} to ${baselineToken + 10}): ${isGapFree ? '✓ YES' : '✗ NO'}`);

  // Check 4: QueueEvent audit trail check
  const eventCount = await prisma.queueEvent.count({
    where: {
      doctorId: doctor.id,
      appointmentId: { in: createdAppointments.map((a) => a.id) },
      type: 'CHECKED_IN',
    },
  });
  console.log(`  4. QueueEvent audit records created in same transactions: ${eventCount} / 10`);

  if (allSucceeded && isUnique && isGapFree && eventCount === 10) {
    console.log('\n[PASS] TEST 2 PASSED: Transaction retry and unique constraints guaranteed gap-free token generation.');
  } else {
    console.error('\n[FAIL] TEST 2 FAILED: Concurrency assertions violated.');
    process.exit(1);
  }

  // Cleanup test appointments
  console.log('\nCleaning up test race appointments...');
  await prisma.queueEvent.deleteMany({
    where: { appointmentId: { in: createdAppointments.map((a) => a.id) } },
  });
  await prisma.queueEntry.deleteMany({
    where: { appointmentId: { in: createdAppointments.map((a) => a.id) } },
  });
  await prisma.appointment.deleteMany({
    where: { id: { in: createdAppointments.map((a) => a.id) } },
  });
  console.log('Cleanup completed.');

  console.log('\n' + '='.repeat(75));
  console.log('  ALL CONCURRENCY & RACE CONDITION TESTS PASSED (100%)');
  console.log('='.repeat(75) + '\n');
}

runRaceTests()
  .catch((e) => {
    console.error('Race test fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
