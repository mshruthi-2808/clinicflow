import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

import prisma from '../server/src/config/prisma.js';
import crypto from 'crypto';

const BATCH_SIZE = 5000;
const TOTAL_FAKE_RECORDS = 20000;

async function main() {
  console.log('='.repeat(70));
  console.log('ClinicFlow PostgreSQL Performance Benchmark (EXPLAIN ANALYZE)');
  console.log('='.repeat(70));

  // 1. Fetch available doctors
  const doctors = await prisma.doctor.findMany({ select: { id: true, name: true } });
  if (doctors.length === 0) {
    console.error('No doctors found. Please run seed script first.');
    process.exit(1);
  }
  console.log(`Found ${doctors.length} doctors. Target fake appointments: ${TOTAL_FAKE_RECORDS}`);

  // 2. Count existing appointments
  const beforeCount = await prisma.appointment.count();
  console.log(`Current appointments in database: ${beforeCount}`);

  // Check if we need to seed
  if (beforeCount < 20000) {
    const needed = 20000 - beforeCount;
    console.log(`Seeding ${needed} synthetic appointments in batches of ${BATCH_SIZE}...`);

    const statuses = ['BOOKED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'];
    const startTime = Date.now();

    let created = 0;
    while (created < needed) {
      const currentBatchSize = Math.min(BATCH_SIZE, needed - created);
      const batchData = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const docIndex = (created + i) % doctors.length;
        const doctorId = doctors[docIndex].id;

        // Distribute dates across 2,000 days to avoid any slot collision
        const dayOffset = Math.floor((created + i) / 20) + 1;
        const aptDate = new Date(Date.UTC(2027, 0, dayOffset));

        const slotIdx = (created + i) % 20;
        const hour = 8 + Math.floor(slotIdx / 2);
        const min = (slotIdx % 2) * 30;
        const slotStart = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

        const status = statuses[(created + i) % statuses.length];

        batchData.push({
          id: crypto.randomUUID(),
          doctorId,
          patientName: `Benchmark Patient ${beforeCount + created + i + 1}`,
          patientPhone: `98${String(10000000 + ((created + i) % 90000000)).slice(0, 8)}`,
          reason: 'Routine checkup benchmarking data',
          appointmentDate: aptDate,
          slotStart,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await prisma.appointment.createMany({
        data: batchData,
        skipDuplicates: true,
      });

      created += currentBatchSize;
      console.log(`  Seeded ${created} / ${needed} appointments...`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Seeding completed in ${duration}s.`);
  } else {
    console.log(`Database already contains >= ${TOTAL_FAKE_RECORDS} appointments. Skipping seed.`);
  }

  const totalCount = await prisma.appointment.count();
  console.log(`Total appointments in database: ${totalCount}`);

  // Query parameters for the main filter query: doctor + date + status
  const targetDoctorId = doctors[0].id;
  const targetDoctorName = doctors[0].name;
  const targetDate = new Date(Date.UTC(2026, 0, 15));
  const targetStatus = 'BOOKED';

  console.log('\nBenchmarking Filter Query:');
  console.log(`  Doctor: ${targetDoctorName} (${targetDoctorId})`);
  console.log(`  Date: 2026-01-15`);
  console.log(`  Status: ${targetStatus}`);

  // 3. Drop composite index for BEFORE comparison and recreate for AFTER comparison
  try {
    console.log('\n--- Step 1: Dropping composite index idx_appointment_doctor_date_status for BEFORE comparison ---');
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_appointment_doctor_date_status;`);

    // Run VACUUM ANALYZE to update PostgreSQL optimizer statistics
    console.log('Running ANALYZE "Appointment" to update planner statistics...');
    await prisma.$executeRawUnsafe(`ANALYZE "Appointment";`);

    // Run EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) BEFORE index
    console.log('\n--- Step 2: Running EXPLAIN (ANALYZE, BUFFERS) BEFORE adding composite index ---');
    const planBefore = await prisma.$queryRaw`
      EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
      SELECT *
      FROM "Appointment"
      WHERE "doctorId" = ${targetDoctorId}
        AND "appointmentDate" = ${targetDate}::date
        AND "status" = ${targetStatus}::"AppointmentStatus";
    `;

    const planBeforeText = planBefore.map((row) => row['QUERY PLAN']).join('\n');
    console.log('\n' + planBeforeText);

    // 4. Recreate composite index on (doctorId, appointmentDate, status)
    console.log('\n--- Step 3: Recreating composite index: idx_appointment_doctor_date_status ---');
    const createIndexStart = Date.now();
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_appointment_doctor_date_status 
      ON "Appointment" ("doctorId", "appointmentDate", "status");
    `);
    const createIndexTime = Date.now() - createIndexStart;
    console.log(`Composite index created in ${createIndexTime}ms.`);

    // Update statistics
    await prisma.$executeRawUnsafe(`ANALYZE "Appointment";`);

    // Run EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) AFTER index
    console.log('\n--- Step 4: Running EXPLAIN (ANALYZE, BUFFERS) AFTER adding composite index ---');
    const planAfter = await prisma.$queryRaw`
      EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
      SELECT *
      FROM "Appointment"
      WHERE "doctorId" = ${targetDoctorId}
        AND "appointmentDate" = ${targetDate}::date
        AND "status" = ${targetStatus}::"AppointmentStatus";
    `;

    const planAfterText = planAfter.map((row) => row['QUERY PLAN']).join('\n');
    console.log('\n' + planAfterText);

    // Helper to extract Execution time
    function extractMetric(text, regex) {
      const match = text.match(regex);
      return match ? match[1] : 'N/A';
    }

    const execBefore = extractMetric(planBeforeText, /Execution Time: ([0-9.]+ ms)/);
    const execAfter = extractMetric(planAfterText, /Execution Time: ([0-9.]+ ms)/);
    const planTimeBefore = extractMetric(planBeforeText, /Planning Time: ([0-9.]+ ms)/);
    const planTimeAfter = extractMetric(planAfterText, /Planning Time: ([0-9.]+ ms)/);

    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY RESULTS:');
    console.log('='.repeat(70));
    console.log(`Total Dataset Size: ${totalCount} appointments`);
    console.log(`Execution Time BEFORE index: ${execBefore} (Planning: ${planTimeBefore})`);
    console.log(`Execution Time AFTER index:  ${execAfter} (Planning: ${planTimeAfter})`);
    console.log('='.repeat(70));

    return {
      totalCount,
      planBeforeText,
      planAfterText,
      execBefore,
      execAfter,
      planTimeBefore,
      planTimeAfter,
    };
  } finally {
    // Always ensure index is left in place when benchmark finishes, even if an error occurred
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_appointment_doctor_date_status 
      ON "Appointment" ("doctorId", "appointmentDate", "status");
    `);
    console.log('\n[Index Guard] Verified idx_appointment_doctor_date_status is active in database.');
  }
}

main()
  .catch((e) => {
    console.error('Benchmark error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
