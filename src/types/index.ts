export type ClinicalRole = 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'ADMIN';

export interface UserContext {
  userId: string;
  name: string;
  role: ClinicalRole;
}

export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  active: boolean;
  name: { family: string; given: string[] };
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  telecom: Array<{ system: 'phone' | 'email'; value: string }>;
}

export interface FHIRAppointment {
  resourceType: 'Appointment';
  id: string;
  status: 'booked' | 'arrived' | 'fulfilled' | 'cancelled';
  patientId: string;
  practitionerId: string;
  start: string; // ISO-8601
  end: string;
  description: string;
}

export interface FHIREncounter {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'in-progress' | 'finished';
  patientId: string;
  practitionerId: string;
  clinicalNotes: string; // PHI sensitive
  diagnoses: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userRole: ClinicalRole;
  action: 'READ' | 'WRITE' | 'DELETE';
  resourceType: string;
  resourceId: string;
  patientId: string;
}
