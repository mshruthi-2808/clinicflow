import { doctorRepository } from '../repositories/doctorRepository.js';
import { specialisationRepository } from '../repositories/specialisationRepository.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { AppError } from '../utils/appError.js';
import {
  parseDateOnly,
  getDayKey,
  generateSlotIntervals,
  getTodayDateString,
  getCurrentTimeString,
  timeToMinutes,
} from '../utils/dateTime.js';

export const doctorService = {
  getDoctors: async ({ search, specialisationId, page = 1, limit = 10, sort = 'name:asc', activeOnly = 'true' }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Filter by active status
    if (activeOnly === 'true') {
      where.isActive = true;
    } else if (activeOnly === 'false') {
      where.isActive = false;
    }

    // Filter by specialisation
    if (specialisationId) {
      where.specialisationId = specialisationId;
    }

    // Filter by name search
    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    // Parse sort: "field:direction" (e.g., name:asc, consultationMinutes:desc)
    let orderBy = { name: 'asc' };
    if (sort) {
      const [field, direction] = sort.split(':');
      const validFields = ['name', 'consultationMinutes', 'slotMinutes', 'createdAt'];
      const validDirection = direction?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      if (validFields.includes(field)) {
        orderBy = { [field]: validDirection };
      }
    }

    const [doctors, total] = await Promise.all([
      doctorRepository.findAll({ where, skip, take: limitNum, orderBy }),
      doctorRepository.count(where),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      doctors,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  },

  getDoctorById: async (id) => {
    const doctor = await doctorRepository.findById(id);
    if (!doctor) {
      throw new AppError(404, 'NOT_FOUND', 'Doctor not found');
    }
    return doctor;
  },

  getAvailableSlots: async (doctorId, dateString) => {
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new AppError(404, 'NOT_FOUND', 'Doctor not found');
    }

    if (!doctor.isActive) {
      throw new AppError(400, 'DOCTOR_INACTIVE', 'Doctor is currently inactive');
    }

    const todayStr = getTodayDateString();
    // Past dates have no available booking slots
    if (dateString < todayStr) {
      return [];
    }

    // Check doctor schedule for this day of the week
    const dayKey = getDayKey(dateString);
    const schedule = doctor.schedule || {};
    const daySchedule = schedule[dayKey];

    // Non-working day: return empty list
    if (!daySchedule || !daySchedule.start || !daySchedule.end) {
      return [];
    }

    // Generate intervals based on doctor's slotMinutes
    const slotMinutes = doctor.slotMinutes || 15;
    const intervals = generateSlotIntervals(daySchedule.start, daySchedule.end, slotMinutes);

    // Fetch existing active (non-cancelled) bookings for this doctor on this date
    const appointmentDate = parseDateOnly(dateString);
    const activeAppointments = await appointmentRepository.findActiveByDoctorAndDate(doctorId, appointmentDate);
    const bookedSet = new Set(activeAppointments.map((apt) => apt.slotStart));

    const isToday = dateString === todayStr;
    const currentMinutes = isToday ? timeToMinutes(getCurrentTimeString()) : -1;

    const slots = [];
    for (const slot of intervals) {
      // Exclude past slots when the date is today
      if (isToday && timeToMinutes(slot) <= currentMinutes) {
        continue;
      }

      slots.push({
        slotStart: slot,
        isAvailable: !bookedSet.has(slot),
      });
    }

    return slots;
  },

  createDoctor: async (data) => {
    // Verify specialisation exists
    const specialisation = await specialisationRepository.findById(data.specialisationId);
    if (!specialisation) {
      throw new AppError(404, 'NOT_FOUND', 'Specified specialisation does not exist');
    }

    return doctorRepository.create(data);
  },

  updateDoctor: async (id, data) => {
    // Check doctor exists
    const doctor = await doctorRepository.findById(id);
    if (!doctor) {
      throw new AppError(404, 'NOT_FOUND', 'Doctor not found');
    }

    if (data.specialisationId) {
      const specialisation = await specialisationRepository.findById(data.specialisationId);
      if (!specialisation) {
        throw new AppError(404, 'NOT_FOUND', 'Specified specialisation does not exist');
      }
    }

    return doctorRepository.update(id, data);
  },

  deleteDoctor: async (id) => {
    const doctor = await doctorRepository.findById(id);
    if (!doctor) {
      throw new AppError(404, 'NOT_FOUND', 'Doctor not found');
    }

    return doctorRepository.softDelete(id);
  },
};
