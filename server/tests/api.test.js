import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { queueService } from '../src/services/queueService.js';

describe('ClinicFlow Automated API Test Suite', { timeout: 30000 }, () => {
  let doctorId;
  let staffToken;
  let testDateStr;
  let testTodayStr;

  beforeAll(async () => {
    // 1. Get an active doctor from database
    const doctor = await prisma.doctor.findFirst({ where: { isActive: true } });
    if (!doctor) {
      throw new Error('No doctor found. Please ensure database is seeded.');
    }
    doctorId = doctor.id;

    // 2. Authenticate staff to obtain JWT token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: process.env.STAFF_EMAIL || 'staff@clinicflow.local',
        password: process.env.STAFF_PASSWORD || 'ClinicStaff123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    staffToken = loginRes.body.data.token;

    // 3. Setup test dates
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    testTodayStr = `${year}-${month}-${day}`;

    // A future date for booking collision tests
    testDateStr = '2027-05-20';

    // Cleanup any prior test bookings on testDateStr or test phones
    const testPhones = [
      '9876543210', '9876543211', '9876543212', '9876543213',
      '9876543214', '9876543215', '9876543216', '9876543217',
    ];
    await prisma.queueEvent.deleteMany({
      where: { appointment: { patientPhone: { in: testPhones } } },
    });
    await prisma.queueEntry.deleteMany({
      where: { appointment: { patientPhone: { in: testPhones } } },
    });
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctorId, appointmentDate: new Date(`${testDateStr}T00:00:00.000Z`) },
          { patientPhone: { in: testPhones } },
        ],
      },
    });
  });

  afterAll(async () => {
    const testPhones = [
      '9876543210', '9876543211', '9876543212', '9876543213',
      '9876543214', '9876543215', '9876543216', '9876543217',
    ];
    await prisma.queueEvent.deleteMany({
      where: { appointment: { patientPhone: { in: testPhones } } },
    });
    await prisma.queueEntry.deleteMany({
      where: { appointment: { patientPhone: { in: testPhones } } },
    });
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { doctorId, appointmentDate: new Date(`${testDateStr}T00:00:00.000Z`) },
          { patientPhone: { in: testPhones } },
        ],
      },
    });

    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // 1. Booking Success
  // -------------------------------------------------------------------------
  it('1. Booking Success: creates a valid appointment with 201 Created', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .send({
        doctorId,
        patientName: 'Test Patient Success',
        patientPhone: '9876543210',
        appointmentDate: testDateStr,
        slotStart: '10:00',
        reason: 'Automated test booking',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('BOOKED');
    expect(res.body.data.slotStart).toBe('10:00');
  });

  // -------------------------------------------------------------------------
  // 2. Booking Conflict (Double-Booking Prevention)
  // -------------------------------------------------------------------------
  it('2. Booking Conflict: rejects duplicate booking for the same slot with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .send({
        doctorId,
        patientName: 'Test Patient Duplicate',
        patientPhone: '9876543211',
        appointmentDate: testDateStr,
        slotStart: '10:00',
        reason: 'Duplicate slot booking attempt',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SLOT_ALREADY_BOOKED');
  });

  // -------------------------------------------------------------------------
  // 3. Past-Date Rejection
  // -------------------------------------------------------------------------
  it('3. Past-Date Rejection: rejects booking dates in the past with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .send({
        doctorId,
        patientName: 'Test Patient Past',
        patientPhone: '9876543212',
        appointmentDate: '2020-01-01',
        slotStart: '10:00',
        reason: 'Past booking attempt',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PAST_DATE');
  });

  // -------------------------------------------------------------------------
  // 4. Invalid Status Transitions
  // -------------------------------------------------------------------------
  it('4. Invalid Status Transition: rejects invalid transitions with 409 Conflict', async () => {
    // Create an appointment already in COMPLETED status
    const apt = await prisma.appointment.create({
      data: {
        doctorId,
        patientName: 'Transition Test Patient',
        patientPhone: '9876543213',
        appointmentDate: new Date(`${testDateStr}T00:00:00.000Z`),
        slotStart: '11:00',
        status: 'COMPLETED',
      },
    });

    // Attempting to cancel a COMPLETED appointment (terminal state)
    const res = await request(app)
      .patch(`/api/v1/appointments/${apt.id}/cancel`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');

    // Clean up
    await prisma.appointment.delete({ where: { id: apt.id } });
  });

  // -------------------------------------------------------------------------
  // 5. Check-In Token Sequence & Duplicate Check-In Prevention
  // -------------------------------------------------------------------------
  it('5. Check-In Token Sequence: issues sequential tokens and rejects duplicate check-ins', async () => {
    // Create two test appointments for today
    const apt1 = await prisma.appointment.create({
      data: {
        doctorId,
        patientName: 'Sequence Patient 1',
        patientPhone: '9876543214',
        appointmentDate: new Date(`${testTodayStr}T00:00:00.000Z`),
        slotStart: '05:00',
        status: 'BOOKED',
      },
    });

    const apt2 = await prisma.appointment.create({
      data: {
        doctorId,
        patientName: 'Sequence Patient 2',
        patientPhone: '9876543215',
        appointmentDate: new Date(`${testTodayStr}T00:00:00.000Z`),
        slotStart: '05:15',
        status: 'BOOKED',
      },
    });

    // Check in first patient
    const res1 = await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ appointmentId: apt1.id });

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    const token1 = res1.body.data.queueEntry.tokenNumber;

    // Check in second patient
    const res2 = await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ appointmentId: apt2.id });

    expect(res2.status).toBe(201);
    expect(res2.body.success).toBe(true);
    const token2 = res2.body.data.queueEntry.tokenNumber;

    // Must be sequential
    expect(token2).toBe(token1 + 1);

    // Duplicate check-in rejection
    const duplicateRes = await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ appointmentId: apt1.id });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error.code).toBe('ALREADY_CHECKED_IN');

    // Clean up
    await prisma.queueEvent.deleteMany({
      where: { appointmentId: { in: [apt1.id, apt2.id] } },
    });
    await prisma.queueEntry.deleteMany({
      where: { appointmentId: { in: [apt1.id, apt2.id] } },
    });
    await prisma.appointment.deleteMany({
      where: { id: { in: [apt1.id, apt2.id] } },
    });
  });

  // -------------------------------------------------------------------------
  // 6. Call-Next and Complete Flow
  // -------------------------------------------------------------------------
  it('6. Call-Next and Complete: transitions WAITING -> IN_CONSULTATION -> COMPLETED', async () => {
    // 1. Ensure doctor has no active consultation currently
    const active = await prisma.queueEntry.findFirst({
      where: {
        doctorId,
        queueDate: new Date(`${testTodayStr}T00:00:00.000Z`),
        status: 'IN_CONSULTATION',
      },
    });
    if (active) {
      await prisma.queueEntry.update({
        where: { id: active.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    // 2. Create and check-in a test appointment
    const apt = await prisma.appointment.create({
      data: {
        doctorId,
        patientName: 'CallNext Patient',
        patientPhone: '9876543216',
        appointmentDate: new Date(`${testTodayStr}T00:00:00.000Z`),
        slotStart: '05:30',
        status: 'BOOKED',
      },
    });

    const checkInRes = await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ appointmentId: apt.id });

    expect(checkInRes.status).toBe(201);
    const entryId = checkInRes.body.data.queueEntry.id;

    // 3. Call Next
    const callRes = await request(app)
      .post(`/api/v1/queue/doctor/${doctorId}/call-next`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(callRes.status).toBe(200);
    expect(callRes.body.success).toBe(true);
    expect(callRes.body.data.queueEntry.status).toBe('IN_CONSULTATION');
    expect(callRes.body.data.queueEntry.calledAt).toBeDefined();

    // 4. Complete
    const completeRes = await request(app)
      .post(`/api/v1/queue/${entryId}/complete`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.data.queueEntry.status).toBe('COMPLETED');
    expect(completeRes.body.data.queueEntry.completedAt).toBeDefined();

    // Verify QueueEvent was recorded atomically in database
    const event = await prisma.queueEvent.findFirst({
      where: {
        appointmentId: apt.id,
        type: 'COMPLETED',
      },
    });
    expect(event).toBeDefined();
    expect(event.type).toBe('COMPLETED');

    // Clean up
    await prisma.queueEvent.deleteMany({ where: { appointmentId: apt.id } });
    await prisma.queueEntry.deleteMany({ where: { appointmentId: apt.id } });
    await prisma.appointment.delete({ where: { id: apt.id } });
  });

  // -------------------------------------------------------------------------
  // 7. Wait Estimate Calculation
  // -------------------------------------------------------------------------
  it('7. Wait Estimate Calculation: returns numeric estimate and disclaimer', async () => {
    // Create an appointment for today and check it in
    const apt = await prisma.appointment.create({
      data: {
        doctorId,
        patientName: 'Wait Estimate Patient',
        patientPhone: '9876543217',
        appointmentDate: new Date(`${testTodayStr}T00:00:00.000Z`),
        slotStart: '05:45',
        status: 'BOOKED',
      },
    });

    await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ appointmentId: apt.id });

    // Public appointment queue view endpoint
    const res = await request(app).get(`/api/v1/queue/appointment/${apt.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('estimatedWaitMinutes');
    expect(typeof res.body.data.estimatedWaitMinutes).toBe('number');
    expect(res.body.data.isEstimate).toBe(true);
    expect(res.body.data).toHaveProperty('disclaimer');

    // Test queueService.getAverageConsultMinutes directly
    const avgMinutes = await queueService.getAverageConsultMinutes(doctorId);
    expect(typeof avgMinutes).toBe('number');
    expect(avgMinutes).toBeGreaterThan(0);

    // Clean up
    await prisma.queueEvent.deleteMany({ where: { appointmentId: apt.id } });
    await prisma.queueEntry.deleteMany({ where: { appointmentId: apt.id } });
    await prisma.appointment.delete({ where: { id: apt.id } });
  });
});
