import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import {
  getKolkataDateTime,
  getTodayDateString,
  getCurrentTimeString,
  getCurrentMinutesInKolkata,
  isPastDate,
  isSlotInPast,
  timeToMinutes,
  CLINIC_TIMEZONE,
} from '../src/utils/dateTime.js';

describe('ClinicFlow Timezone & Past Slot Prevention Test Suite', { timeout: 30000 }, () => {
  let doctorId;
  let testDateStr;
  const testPhone = '9888877771';

  beforeAll(async () => {
    // Pick an active doctor
    const doctor = await prisma.doctor.findFirst({ where: { isActive: true } });
    if (!doctor) throw new Error('No active doctor found');
    doctorId = doctor.id;

    // Use tomorrow or next week for future tests
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const kolkataFuture = getKolkataDateTime(futureDate);
    testDateStr = kolkataFuture.dateString;

    // Cleanup any prior test bookings
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { patientPhone: testPhone },
          { doctorId, appointmentDate: new Date(`${testDateStr}T00:00:00.000Z`) },
        ],
      },
    });
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { patientPhone: testPhone },
          { doctorId, appointmentDate: new Date(`${testDateStr}T00:00:00.000Z`) },
        ],
      },
    });
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // 1. Timezone Dynamic Calculation (Asia/Kolkata)
  // -------------------------------------------------------------------------
  it('1. Verifies Asia/Kolkata timezone calculations', () => {
    expect(CLINIC_TIMEZONE).toBe('Asia/Kolkata');
    const kolkata = getKolkataDateTime();
    expect(kolkata).toHaveProperty('dateString');
    expect(kolkata).toHaveProperty('timeString');
    expect(kolkata.dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(kolkata.timeString).toMatch(/^\d{2}:\d{2}$/);
    expect(kolkata.totalMinutes).toBeGreaterThanOrEqual(0);
    expect(kolkata.totalMinutes).toBeLessThan(1440);
  });

  // -------------------------------------------------------------------------
  // 2. Simulated 2:03 PM IST (14:03): 09:00, 13:00, 14:00 are past, 14:20 is future
  // -------------------------------------------------------------------------
  it('2. Evaluates slots at 2:03 PM (14:03 IST): 09:00, 13:00, 14:00 are past; 14:20 is future', () => {
    // Create a Date object corresponding to 14:03:00 IST (08:33:00 UTC) on 2026-10-23
    const simDate = new Date('2026-10-23T08:33:00.000Z');
    const simKolkata = getKolkataDateTime(simDate);

    expect(simKolkata.dateString).toBe('2026-10-23');
    expect(simKolkata.timeString).toBe('14:03');
    expect(simKolkata.totalMinutes).toBe(14 * 60 + 3); // 843 minutes

    const today = '2026-10-23';
    const tomorrow = '2026-10-24';

    // Past slots today
    expect(isSlotInPast(today, '09:00', simDate)).toBe(true);
    expect(isSlotInPast(today, '09:20', simDate)).toBe(true);
    expect(isSlotInPast(today, '13:00', simDate)).toBe(true);
    expect(isSlotInPast(today, '14:00', simDate)).toBe(true);

    // Future slot today
    expect(isSlotInPast(today, '14:20', simDate)).toBe(false);
    expect(isSlotInPast(today, '15:00', simDate)).toBe(false);

    // Tomorrow's morning slots must remain available
    expect(isSlotInPast(tomorrow, '09:00', simDate)).toBe(false);
    expect(isSlotInPast(tomorrow, '10:00', simDate)).toBe(false);

    // Past date must be recognized as past
    expect(isPastDate('2020-01-01', simDate)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 3. GET /doctors/:id/slots returns empty array for past dates
  // -------------------------------------------------------------------------
  it('3. GET /doctors/:id/slots returns [] for past dates', async () => {
    const res = await request(app).get(`/api/v1/doctors/${doctorId}/slots?date=2020-01-01`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 4. GET /doctors/:id/slots for today disables passed slots
  // -------------------------------------------------------------------------
  it('4. GET /doctors/:id/slots for today marks elapsed slots as isPast: true and isAvailable: false', async () => {
    const today = getTodayDateString();
    const currentMinutes = getCurrentMinutesInKolkata();

    const res = await request(app).get(`/api/v1/doctors/${doctorId}/slots?date=${today}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    if (res.body.data.length > 0) {
      for (const slot of res.body.data) {
        const slotMin = timeToMinutes(slot.slotStart);
        if (slotMin <= currentMinutes) {
          expect(slot.isPast).toBe(true);
          expect(slot.isAvailable).toBe(false);
        }
      }
    }
  });

  // -------------------------------------------------------------------------
  // 5. Direct API rejection: Reject past slot today with 400 PAST_TIME
  // -------------------------------------------------------------------------
  it('5. Direct API: Rejects booking for an already-passed slot today with 400 PAST_TIME', async () => {
    const today = getTodayDateString();
    // 09:00 has already passed at 2:00 PM (14:00) IST
    const res = await request(app)
      .post('/api/v1/appointments')
      .send({
        doctorId,
        patientName: 'Past Slot Test Patient',
        patientPhone: testPhone,
        appointmentDate: today,
        slotStart: '09:00',
        reason: 'Attempting to book a past morning slot',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PAST_TIME');
    expect(res.body.error.message).toContain('Cannot book an appointment for past time slot');
  });

  // -------------------------------------------------------------------------
  // 6. Direct API rejection: Reject booking for past date with 400 PAST_DATE
  // -------------------------------------------------------------------------
  it('6. Direct API: Rejects booking for past date with 400 PAST_DATE', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .send({
        doctorId,
        patientName: 'Past Date Test Patient',
        patientPhone: testPhone,
        appointmentDate: '2022-01-15',
        slotStart: '10:00',
        reason: 'Attempting past date booking',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PAST_DATE');
  });

  // -------------------------------------------------------------------------
  // 7. Booking Future Slot succeeds and prevents double-booking
  // -------------------------------------------------------------------------
  it('7. Future slot booking succeeds and prevents duplicate bookings (SLOT_ALREADY_BOOKED)', async () => {
    // Book a valid slot on future testDateStr
    const bookRes = await request(app)
      .post('/api/v1/appointments')
      .send({
        doctorId,
        patientName: 'Future Slot Patient',
        patientPhone: testPhone,
        appointmentDate: testDateStr,
        slotStart: '10:00',
        reason: 'Valid future booking',
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.success).toBe(true);

    // Second booking attempt for same slot must be rejected with 409
    const dupRes = await request(app)
      .post('/api/v1/appointments')
      .send({
        doctorId,
        patientName: 'Duplicate Slot Patient',
        patientPhone: '9888877772',
        appointmentDate: testDateStr,
        slotStart: '10:00',
        reason: 'Duplicate slot booking',
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.error.code).toBe('SLOT_ALREADY_BOOKED');
  });
});
