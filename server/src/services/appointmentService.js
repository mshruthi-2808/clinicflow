import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { doctorRepository } from '../repositories/doctorRepository.js';
import { assertTransition } from './appointmentStateMachine.js';
import { AppError } from '../utils/appError.js';
import {
  parseDateOnly,
  getDayKey,
  generateSlotIntervals,
  getTodayDateString,
  getCurrentTimeString,
  timeToMinutes,
} from '../utils/dateTime.js';

export const appointmentService = {
  bookAppointment: async ({ doctorId, patientName, patientPhone, reason, appointmentDate: dateStr, slotStart }) => {
    // 1. Validate doctor exists and is active
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new AppError(404, 'NOT_FOUND', 'Doctor not found');
    }
    if (!doctor.isActive) {
      throw new AppError(400, 'DOCTOR_INACTIVE', 'Cannot book appointment with an inactive doctor');
    }

    // 2. Reject past dates
    const todayStr = getTodayDateString();
    if (dateStr < todayStr) {
      throw new AppError(400, 'PAST_DATE', 'Cannot book an appointment for a past date');
    }

    // 3. Reject past times for today
    if (dateStr === todayStr) {
      const currentMinutes = timeToMinutes(getCurrentTimeString());
      const slotMinutes = timeToMinutes(slotStart);
      if (slotMinutes <= currentMinutes) {
        throw new AppError(400, 'PAST_TIME', 'Cannot book an appointment for a past time slot');
      }
    }

    // 4. Validate doctor's schedule on the appointment day
    const dayKey = getDayKey(dateStr);
    const daySchedule = doctor.schedule?.[dayKey];
    if (!daySchedule || !daySchedule.start || !daySchedule.end) {
      throw new AppError(400, 'DOCTOR_UNAVAILABLE', `Doctor is not available on ${dayKey.toUpperCase()}`);
    }

    // Generate valid slots for the day
    const slotDuration = doctor.slotMinutes || 15;
    const validSlots = generateSlotIntervals(daySchedule.start, daySchedule.end, slotDuration);
    if (!validSlots.includes(slotStart)) {
      throw new AppError(
        400,
        'SLOT_OUTSIDE_SCHEDULE',
        `Slot ${slotStart} is outside doctor's working schedule (${daySchedule.start} - ${daySchedule.end})`
      );
    }

    // 5. Pre-check slot availability (soft check)
    const appointmentDateObj = parseDateOnly(dateStr);
    const existingBooking = await appointmentRepository.findActiveByDoctorAndSlot(
      doctorId,
      appointmentDateObj,
      slotStart
    );

    if (existingBooking) {
      throw new AppError(409, 'SLOT_ALREADY_BOOKED', 'This slot is already booked');
    }

    // 6. Create appointment (PostgreSQL partial unique index `uniq_active_slot` acts as the final guard)
    try {
      const newAppointment = await appointmentRepository.create({
        doctorId,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        reason: reason?.trim() || null,
        appointmentDate: appointmentDateObj,
        slotStart,
        status: 'BOOKED',
      });

      return newAppointment;
    } catch (err) {
      // Catch Prisma P2002 if a race condition happened
      if (err.code === 'P2002') {
        throw new AppError(409, 'SLOT_ALREADY_BOOKED', 'This slot is already booked');
      }
      throw err;
    }
  },

  getAppointments: async ({ date, doctorId, status, search, page = 1, limit = 10, sort = 'appointmentDate:asc' }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (date) {
      where.appointmentDate = parseDateOnly(date);
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (status) {
      where.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { patientName: { contains: term, mode: 'insensitive' } },
        { patientPhone: { contains: term } },
      ];
    }

    let orderBy = [{ appointmentDate: 'asc' }, { slotStart: 'asc' }];
    if (sort) {
      const [field, direction] = sort.split(':');
      const validDirection = direction?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      if (field === 'appointmentDate' || field === 'createdAt' || field === 'patientName' || field === 'slotStart') {
        orderBy = [{ [field]: validDirection }];
      }
    }

    const [appointments, total] = await Promise.all([
      appointmentRepository.findAll({ where, skip, take: limitNum, orderBy }),
      appointmentRepository.count(where),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      appointments,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  },

  getAppointmentById: async (id) => {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      throw new AppError(404, 'NOT_FOUND', 'Appointment not found');
    }
    return appointment;
  },

  cancelAppointment: async (id) => {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      throw new AppError(404, 'NOT_FOUND', 'Appointment not found');
    }

    // Assert status transition (e.g. IN_CONSULTATION or COMPLETED cannot be cancelled -> 409)
    assertTransition(appointment.status, 'CANCELLED');

    const updated = await appointmentRepository.update(id, {
      status: 'CANCELLED',
    });

    return updated;
  },
};
