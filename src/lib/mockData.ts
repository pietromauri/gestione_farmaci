import { Medication, Schedule, Log, HealthMetric, Appointment } from '../types';

export const mockMedications: Medication[] = [
  {
    id: 'm1',
    userId: 'u1',
    name: 'Aspirina',
    dosage: '100mg',
    form: 'PILL',
    currentStock: 25,
    refillThreshold: 5,
  },
  {
    id: 'm2',
    userId: 'u1',
    name: 'Vitamina D',
    dosage: '1000 UI',
    form: 'DROPS',
    currentStock: 15,
    refillThreshold: 3,
  },
];

export const mockSchedules: Schedule[] = [
  {
    id: 's1',
    medicationId: 'm1',
    time: '08:00',
    frequencyType: 'DAILY',
  },
  {
    id: 's2',
    medicationId: 'm2',
    time: '13:00',
    frequencyType: 'DAILY',
  },
  {
    id: 's3',
    medicationId: 'm1',
    time: '20:00',
    frequencyType: 'DAILY',
  },
];

export const mockLogs: Log[] = [
  {
    id: 'l1',
    userId: 'u1',
    medicationId: 'm1',
    scheduledTime: new Date().toISOString(),
    status: 'TAKEN',
    actionTime: new Date().toISOString(),
  },
];

export const mockMetrics: HealthMetric[] = [
  {
    id: 'h1',
    userId: 'u1',
    type: 'MOOD',
    value: '4',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'h2',
    userId: 'u1',
    type: 'BLOOD_PRESSURE',
    value: { systolic: 120, diastolic: 80 },
    timestamp: new Date().toISOString(),
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 'a1',
    userId: 'u1',
    title: 'Visita Cardiologica',
    doctorName: 'Dr. Rossi',
    dateTime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
  },
];
