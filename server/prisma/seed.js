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

  // 2. Seed 6 Specialisations with predictable UUIDs
  const specialisationData = [
    { id: '10000000-0000-0000-0000-000000000001', name: 'General Medicine' },
    { id: '10000000-0000-0000-0000-000000000002', name: 'Pediatrics' },
    { id: '10000000-0000-0000-0000-000000000003', name: 'Dermatology' },
    { id: '10000000-0000-0000-0000-000000000004', name: 'Cardiology' },
    { id: '10000000-0000-0000-0000-000000000005', name: 'Orthopedics' },
    { id: '10000000-0000-0000-0000-000000000006', name: 'ENT (Otolaryngology)' },
  ];

  for (const item of specialisationData) {
    await prisma.specialisation.create({ data: item });
  }
  console.log(`Created ${specialisationData.length} specialisations.`);

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
      id: '20000000-0000-0000-0000-000000000001',
      name: 'Dr. Priya Sharma',
      specialisationId: '10000000-0000-0000-0000-000000000001',
      consultationMinutes: 15,
      slotMinutes: 15,
      schedule: standardSchedule,
      isActive: true,
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      name: 'Dr. Rohan Verma',
      specialisationId: '10000000-0000-0000-0000-000000000002',
      consultationMinutes: 15,
      slotMinutes: 15,
      schedule: standardSchedule,
      isActive: true,
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      name: 'Dr. Aisha Khan',
      specialisationId: '10000000-0000-0000-0000-000000000003',
      consultationMinutes: 20,
      slotMinutes: 20,
      schedule: standardSchedule,
      isActive: true,
    },
    {
      id: '20000000-0000-0000-0000-000000000004',
      name: 'Dr. Vikram Malhotra',
      specialisationId: '10000000-0000-0000-0000-000000000004',
      consultationMinutes: 20,
      slotMinutes: 20,
      schedule: standardSchedule,
      isActive: true,
    },
    {
      id: '20000000-0000-0000-0000-000000000005',
      name: 'Dr. Neha Patel',
      specialisationId: '10000000-0000-0000-0000-000000000005',
      consultationMinutes: 15,
      slotMinutes: 15,
      schedule: standardSchedule,
      isActive: true,
    },
  ];

  for (const doc of doctorData) {
    await prisma.doctor.create({ data: doc });
  }
  console.log(`Created ${doctorData.length} doctors.`);

  // 4. Seed Staff User with bcrypt hashed password from environment
  const staffEmail = process.env.STAFF_EMAIL || 'staff@clinicflow.local';
  const rawStaffPassword = process.env.STAFF_PASSWORD || 'ClinicStaff123!';
  const passwordHash = await bcrypt.hash(rawStaffPassword, 10);

  const staffUser = await prisma.staffUser.create({
    data: {
      id: '30000000-0000-0000-0000-000000000001',
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

  const doc1Id = '20000000-0000-0000-0000-000000000001'; // Dr. Priya Sharma
  const doc2Id = '20000000-0000-0000-0000-000000000002'; // Dr. Rohan Verma
  const doc3Id = '20000000-0000-0000-0000-000000000003'; // Dr. Aisha Khan

  // Helper to create timestamps relative to the seed execution moment (now minus N minutes)
  const minutesAgo = (mins) => new Date(now.getTime() - mins * 60 * 1000);

  // Dr. Priya Sharma - Today's appointments & queue
  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000001',
      doctorId: doc1Id,
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
      id: '50000000-0000-0000-0000-000000000001',
      appointmentId: '40000000-0000-0000-0000-000000000001',
      doctorId: doc1Id,
      queueDate: today,
      tokenNumber: 1,
      status: QueueStatus.COMPLETED,
      checkedInAt: minutesAgo(60),
      calledAt: minutesAgo(45),
      completedAt: minutesAgo(30),
    },
  });

  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000002',
      doctorId: doc1Id,
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
      id: '50000000-0000-0000-0000-000000000002',
      appointmentId: '40000000-0000-0000-0000-000000000002',
      doctorId: doc1Id,
      queueDate: today,
      tokenNumber: 2,
      status: QueueStatus.COMPLETED,
      checkedInAt: minutesAgo(50),
      calledAt: minutesAgo(30),
      completedAt: minutesAgo(12),
    },
  });

  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000003',
      doctorId: doc1Id,
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
      id: '50000000-0000-0000-0000-000000000003',
      appointmentId: '40000000-0000-0000-0000-000000000003',
      doctorId: doc1Id,
      queueDate: today,
      tokenNumber: 3,
      status: QueueStatus.IN_CONSULTATION,
      checkedInAt: minutesAgo(25),
      calledAt: minutesAgo(8),
    },
  });

  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000004',
      doctorId: doc1Id,
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
      id: '50000000-0000-0000-0000-000000000004',
      appointmentId: '40000000-0000-0000-0000-000000000004',
      doctorId: doc1Id,
      queueDate: today,
      tokenNumber: 4,
      status: QueueStatus.WAITING,
      checkedInAt: minutesAgo(20),
    },
  });

  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000005',
      doctorId: doc1Id,
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
      id: '50000000-0000-0000-0000-000000000005',
      appointmentId: '40000000-0000-0000-0000-000000000005',
      doctorId: doc1Id,
      queueDate: today,
      tokenNumber: 5,
      status: QueueStatus.WAITING,
      checkedInAt: minutesAgo(10),
    },
  });

  // Today BOOKED appointments (ready for check-in demo)
  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000006',
      doctorId: doc1Id,
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
      id: '40000000-0000-0000-0000-000000000018',
      doctorId: doc1Id,
      patientName: 'Ramesh Kumar',
      patientPhone: '9876543227',
      reason: 'Blood pressure check',
      appointmentDate: today,
      slotStart: '10:45',
      status: AppointmentStatus.BOOKED,
    },
  });

  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000019',
      doctorId: doc1Id,
      patientName: 'Priya Varma',
      patientPhone: '9876543228',
      reason: 'Migraine consultation',
      appointmentDate: today,
      slotStart: '11:00',
      status: AppointmentStatus.BOOKED,
    },
  });

  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000007',
      doctorId: doc1Id,
      patientName: 'Sunita Mehra',
      patientPhone: '9876543216',
      reason: 'Seasonal cough',
      appointmentDate: today,
      slotStart: '10:30',
      status: AppointmentStatus.CANCELLED,
    },
  });

  // Dr. Rohan Verma - Today's appointments & queue
  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000008',
      doctorId: doc2Id,
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
      id: '50000000-0000-0000-0000-000000000006',
      appointmentId: '40000000-0000-0000-0000-000000000008',
      doctorId: doc2Id,
      queueDate: today,
      tokenNumber: 1,
      status: QueueStatus.COMPLETED,
      checkedInAt: minutesAgo(40),
      calledAt: minutesAgo(28),
      completedAt: minutesAgo(14),
    },
  });

  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000009',
      doctorId: doc2Id,
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
      id: '50000000-0000-0000-0000-000000000007',
      appointmentId: '40000000-0000-0000-0000-000000000009',
      doctorId: doc2Id,
      queueDate: today,
      tokenNumber: 2,
      status: QueueStatus.WAITING,
      checkedInAt: minutesAgo(20),
    },
  });

  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000010',
      doctorId: doc2Id,
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
      id: '50000000-0000-0000-0000-000000000008',
      appointmentId: '40000000-0000-0000-0000-000000000010',
      doctorId: doc2Id,
      queueDate: today,
      tokenNumber: 3,
      status: QueueStatus.WAITING,
      checkedInAt: minutesAgo(10),
    },
  });

  // Dr. Rohan Verma - Today BOOKED
  await prisma.appointment.create({
    data: {
      id: '40000000-0000-0000-0000-000000000011',
      doctorId: doc2Id,
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
      id: '40000000-0000-0000-0000-000000000012',
      doctorId: doc3Id,
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
      id: '40000000-0000-0000-0000-000000000013',
      doctorId: doc3Id,
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
      id: '40000000-0000-0000-0000-000000000014',
      doctorId: doc1Id,
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
      id: '40000000-0000-0000-0000-000000000015',
      doctorId: doc1Id,
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
      id: '40000000-0000-0000-0000-000000000016',
      doctorId: doc2Id,
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
      id: '40000000-0000-0000-0000-000000000017',
      doctorId: doc2Id,
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
