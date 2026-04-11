export type MedicationForm = 'PILL' | 'DROPS' | 'INJECTION' | 'OTHER';

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  form: MedicationForm;
  currentStock?: number;
  refillThreshold?: number;
}

export type FrequencyType = 'DAILY' | 'SPECIFIC_DAYS' | 'AS_NEEDED';

export interface Schedule {
  id: string;
  medicationId: string;
  time: string; // "08:00"
  frequencyType: FrequencyType;
  daysOfWeek?: number[]; // [1..7]
}

export type LogStatus = 'TAKEN' | 'SKIPPED' | 'SNOOZED';

export interface Log {
  id: string;
  userId: string;
  medicationId?: string;
  scheduledTime: string; // ISO string
  actionTime?: string; // ISO string
  status: LogStatus;
  notes?: string;
}

export type MetricType = 'BLOOD_PRESSURE' | 'WEIGHT' | 'SYMPTOM' | 'MOOD';

export interface HealthMetric {
  id: string;
  userId: string;
  type: MetricType;
  value: any; // {systolic: 120, diastolic: 80} or "3"
  name?: string; // "Mal di testa"
  severity?: number; // 1-10
  timestamp: string; // ISO string
}

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  doctorName: string;
  dateTime: string; // ISO string
}
