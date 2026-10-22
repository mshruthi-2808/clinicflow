import { PrismaClient, AppointmentStatus, QueueStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ClinicFlow database...');

  // 1. Clean existing records in referential integrity order for re-runnability
  await prisma.queueEntry.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.specialisation.deleteMany();
  await prisma.staffUser.deleteMany();

  console.log('Cleared existing records.');

  // 2. Seed 6 Specialisations
  const specialisationData = [
    { name: 'General Medicine' },
    { name: 'Pediatrics' },
    { name: 'Dermatology' },
    { name: 'Cardiology' },
    { name: 'Orthopedics' },
    { name: 'ENT (Otolaryngology)' },
  ];

  const specialisations = {};
  for (const item of specialisationData) {
    const created = await prisma.specialisation.create({
      data: item,
    });
    specialisations[created.name] = created.id;
  }
  console.log(`Created ${Object.keys(specialisations).length} specialisations.`);

  // 3. Seed 5 Fictional Doctors with weekly schedules (Mon to Sat)
  const standardSchedule = {
    mon: { start: '09:00', end: '13:00' },
    tue: { start: '09:00', end: '13:00' },
    wed: { start: '09:00', end: '13:00' },
    thu: { start: '09:00', end: '13:00' },
    fri: { start: '09:00', end: '13:00' },
    sat: { start: '09:00', end: '12:00' },
  };

  const doctorData = [
    {
      name: 'Dr. Priya Sharma',
      specialisationId: specialisations['General Medicine'],
      consultationMinutes: 15,
      slotMinutes: 15,
      schedule: standardSchedule,
      isActive: true,
    },
    {
      name: 'Dr. Rohan Verma',
      specialisationId: specialisations['Pediatrics'],
      consultationMinutes: 15,
      slotMinutes: 15,
      schedule: standardSchedule,
      isActive: true,
    },
    {
      name: 'Dr. Aisha Khan',
      specialisationId: specialisations['Dermatology'],
      consultationMinutes: 20,
      slotMinutes: 20,
      schedule: standardSchedule,
      isActive: true,
    },
    {
      name: 'Dr. Vikram Malhotra',
      specialisationId: specialisations['Cardiology'],
      consultationMinutes: 20,
      slotMinutes: 20,
      schedule: standardSchedule,
      isActive: true,
    },
    {
      name: 'Dr. Neha Patel',
      specialisationId: specialisations['Orthopedics'],
      consultationMinutes: 15,
      slotMinutes: 15,
      schedule: standardSchedule,
      isActive: true,
    },
  ];

  const doctors = [];
  for (const doc of doctorData) {
    const created = await prisma.doctor.create({ data: doc });
    doctors.push(created);
  }
  console.log(`Created ${doctors.length} doctors.`);

  // 4. Seed Staff User with bcrypt hashed password from environment
  const staffEmail = process.env.STAFF_EMAIL || 'staff@clinicflow.local';
  const rawStaffPassword = process.env.STAFF_PASSWORD || 'ClinicStaff123!';
  const passwordHash = await bcrypt.hash(rawStaffPassword, 10);

  const staffUser = await prisma.staffUser.create({
    data: {
      name: 'Front Desk Admin',
      email: staffEmail,
      passwordHash,
    },
  });
  console.log(`Created staff user: ${staffUser.email}`);

  // 5. Seed Appointments for Today and Tomorrow
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

  // Doctor 1 (Dr. Priya Sharma) - Today
  // 2 COMPLETED, 1 IN_CONSULTATION, 2 CHECKED_IN (WAITING), 1 BOOKED, 1 CANCELLED
  const doc1 = doctors[0];
  const doc2 = doctors[1];
  const doc3 = doctors[2];

  // Helper for timestamps relative to today
  const timeToday = (hours, minutes) => {
    const d = new Date(today);
    d.setUTCHours(hours, minutes, 0, 0);
    return d;
  };

  // Dr. Priya Sharma - Today's appointments & queue
  const apt1 = await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientName: 'Amit Kumar',
      patientPhone: '9876543210',
      reason: 'Viral fever follow-up',
      appointmentDate: today,
      slotStart: '09:00',
      status: AppointmentStatus.COMPLETED,
    },
  });
  await prisma.queueEntry.create({
    data: {
      appointmentId: apt1.id,
      doctorId: doc1.id,
      queueDate: today,
      tokenNumber: 1,
      status: QueueStatus.COMPLETED,
      checkedInAt: timeToday(8, 50),
      calledAt: timeToday(9, 2),
      completedAt: timeToday(9, 18),
    },
  });

  const apt2 = await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientName: 'Sneha Rao',
      patientPhone: '9876543211',
      reason: 'Persistent headache',
      appointmentDate: today,
      slotStart: '09:15',
      status: AppointmentStatus.COMPLETED,
    },
  });
  await prisma.queueEntry.create({
    data: {
      appointmentId: apt2.id,
      doctorId: doc1.id,
      queueDate: today,
      tokenNumber: 2,
      status: QueueStatus.COMPLETED,
      checkedInAt: timeToday(9, 0),
      calledAt: timeToday(9, 20),
      completedAt: timeToday(9, 36),
    },
  });

  const apt3 = await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientName: 'Rahul Nair',
      patientPhone: '9876543212',
      reason: 'Stomach pain and acidity',
      appointmentDate: today,
      slotStart: '09:30',
      status: AppointmentStatus.IN_CONSULTATION,
    },
  });
  await prisma.queueEntry.create({
    data: {
      appointmentId: apt3.id,
      doctorId: doc1.id,
      queueDate: today,
      tokenNumber: 3,
      status: QueueStatus.IN_CONSULTATION,
      checkedInAt: timeToday(9, 15),
      calledAt: timeToday(9, 38),
    },
  });

  const apt4 = await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientName: 'Pooja Hegde',
      patientPhone: '9876543213',
      reason: 'Blood pressure review',
      appointmentDate: today,
      slotStart: '09:45',
      status: AppointmentStatus.CHECKED_IN,
    },
  });
  await prisma.queueEntry.create({
    data: {
      appointmentId: apt4.id,
      doctorId: doc1.id,
      queueDate: today,
      tokenNumber: 4,
      status: QueueStatus.WAITING,
      checkedInAt: timeToday(9, 25),
    },
  });

  const apt5 = await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientName: 'Kiran Desai',
      patientPhone: '9876543214',
      reason: 'General body fatigue',
      appointmentDate: today,
      slotStart: '10:00',
      status: AppointmentStatus.CHECKED_IN,
    },
  });
  await prisma.queueEntry.create({
    data: {
      appointmentId: apt5.id,
      doctorId: doc1.id,
      queueDate: today,
      tokenNumber: 5,
      status: QueueStatus.WAITING,
      checkedInAt: timeToday(9, 35),
    },
  });

  await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientName: 'Manish Gupta',
      patientPhone: '9876543215',
      reason: 'Review lab results',
      appointmentDate: today,
      slotStart: '10:15',
      status: AppointmentStatus.BOOKED,
    },
  });

  await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientName: 'Sunita Mehra',
      patientPhone: '9876543216',
      reason: 'Seasonal cough',
      appointmentDate: today,
      slotStart: '10:30',
      status: AppointmentStatus.CANCELLED,
    },
  });

  // Dr. Rohan Verma - Today's appointments & queue
  const apt8 = await prisma.appointment.create({
    data: {
      doctorId: doc2.id,
      patientName: 'Aarav Joshi',
      patientPhone: '9876543217',
      reason: 'Child immunization booster',
      appointmentDate: today,
      slotStart: '09:00',
      status: AppointmentStatus.COMPLETED,
    },
  });
  await prisma.queueEntry.create({
    data: {
      appointmentId: apt8.id,
      doctorId: doc2.id,
      queueDate: today,
      tokenNumber: 1,
      status: QueueStatus.COMPLETED,
      checkedInAt: timeToday(8, 52),
      calledAt: timeToday(9, 1),
      completedAt: timeToday(9, 17),
    },
  });

  const apt9 = await prisma.appointment.create({
    data: {
      doctorId: doc2.id,
      patientName: 'Ananya Sen',
      patientPhone: '9876543218',
      reason: 'Pediatric allergic reaction',
      appointmentDate: today,
      slotStart: '09:15',
      status: AppointmentStatus.CHECKED_IN,
    },
  });
  await prisma.queueEntry.create({
    data: {
      appointmentId: apt9.id,
      doctorId: doc2.id,
      queueDate: today,
      tokenNumber: 2,
      status: QueueStatus.WAITING,
      checkedInAt: timeToday(9, 5),
    },
  });

  const apt10 = await prisma.appointment.create({
    data: {
      doctorId: doc2.id,
      patientName: 'Vivaan Reddy',
      patientPhone: '9876543219',
      reason: 'Mild ear infection',
      appointmentDate: today,
      slotStart: '09:30',
      status: AppointmentStatus.CHECKED_IN,
    },
  });
  await prisma.queueEntry.create({
    data: {
      appointmentId: apt10.id,
      doctorId: doc2.id,
      queueDate: today,
      tokenNumber: 3,
      status: QueueStatus.WAITING,
      checkedInAt: timeToday(9, 12),
    },
  });

  await prisma.appointment.create({
    data: {
      doctorId: doc2.id,
      patientName: 'Diya Pillai',
      patientPhone: '9876543220',
      reason: 'Routine pediatric check',
      appointmentDate: today,
      slotStart: '09:45',
      status: AppointmentStatus.BOOKED,
    },
  });

  // Dr. Aisha Khan - Today
  await prisma.appointment.create({
    data: {
      doctorId: doc3.id,
      patientName: 'Farhan Ali',
      patientPhone: '9876543221',
      reason: 'Acne scar treatment inquiry',
      appointmentDate: today,
      slotStart: '10:00',
      status: AppointmentStatus.CANCELLED,
    },
  });

  await prisma.appointment.create({
    data: {
      doctorId: doc3.id,
      patientName: 'Zoya Siddiqui',
      patientPhone: '9876543222',
      reason: 'Skin rash on forearm',
      appointmentDate: today,
      slotStart: '10:20',
      status: AppointmentStatus.BOOKED,
    },
  });

  // Tomorrow Appointments (BOOKED & CANCELLED)
  await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientName: 'Deepak Chopra',
      patientPhone: '9876543223',
      reason: 'Annual preventive exam',
      appointmentDate: tomorrow,
      slotStart: '09:00',
      status: AppointmentStatus.BOOKED,
    },
  });

  await prisma.appointment.create({
    data: {
      doctorId: doc1.id,
      patientName: 'Meera Iyer',
      patientPhone: '9876543224',
      reason: 'Diabetes HbA1c review',
      appointmentDate: tomorrow,
      slotStart: '09:15',
      status: AppointmentStatus.BOOKED,
    },
  });

  await prisma.appointment.create({
    data: {
      doctorId: doc2.id,
      patientName: 'Kabir Bose',
      patientPhone: '9876543225',
      reason: 'Child nutrition advice',
      appointmentDate: tomorrow,
      slotStart: '09:30',
      status: AppointmentStatus.BOOKED,
    },
  });

  await prisma.appointment.create({
    data: {
      doctorId: doc2.id,
      patientName: 'Ishaan Khattar',
      patientPhone: '9876543226',
      reason: 'Growth curve checkup',
      appointmentDate: tomorrow,
      slotStart: '09:45',
      status: AppointmentStatus.CANCELLED,
    },
  });

  const totalAppointments = await prisma.appointment.count();
  const totalQueue = await prisma.queueEntry.count();
  console.log(`Database seeded successfully! Total Appointments: ${totalAppointments}, Queue Entries: ${totalQueue}`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
