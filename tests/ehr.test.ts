import { AuditLogger, AccessPolicyEngine } from '../src/security/AccessPolicyEngine';
import { AppointmentScheduler } from '../src/security/AppointmentScheduler';
import { UserContext } from '../src/types';

describe('CarePoint EHR & Access Governance', () => {
  let auditLogger: AuditLogger;
  let scheduler: AppointmentScheduler;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    scheduler = new AppointmentScheduler(auditLogger);
  });

  const doctor: UserContext = { userId: 'doc_1', name: 'Dr. Evans', role: 'DOCTOR' };
  const receptionist: UserContext = { userId: 'rec_1', name: 'Alice', role: 'RECEPTIONIST' };

  test('successfully schedules appointment and writes audit log', () => {
    const appt = scheduler.schedule(receptionist, {
      status: 'booked',
      patientId: 'pat_101',
      practitionerId: 'doc_1',
      start: '2024-04-10T10:00:00Z',
      end: '2024-04-10T10:30:00Z',
      description: 'Annual Physical Examination'
    });

    expect(appt.id).toBeDefined();
    expect(auditLogger.getAuditTrail('pat_101').length).toBe(1);
    expect(auditLogger.getAuditTrail('pat_101')[0].userRole).toBe('RECEPTIONIST');
  });

  test('prevents double-booking doctor in overlapping time slot', () => {
    scheduler.schedule(receptionist, {
      status: 'booked',
      patientId: 'pat_101',
      practitionerId: 'doc_1',
      start: '2024-04-10T14:00:00Z',
      end: '2024-04-10T15:00:00Z',
      description: 'Cardiology Consultation'
    });

    // Overlapping schedule attempt
    expect(() => {
      scheduler.schedule(receptionist, {
        status: 'booked',
        patientId: 'pat_202',
        practitionerId: 'doc_1',
        start: '2024-04-10T14:30:00Z',
        end: '2024-04-10T15:30:00Z',
        description: 'Follow-up'
      });
    }).toThrow(/Scheduling conflict/);
  });

  test('enforces RBAC policy restricting clinical notes to authorized personnel', () => {
    expect(AccessPolicyEngine.canAccessClinicalNotes('DOCTOR')).toBe(true);
    expect(AccessPolicyEngine.canAccessClinicalNotes('NURSE')).toBe(true);
    expect(AccessPolicyEngine.canAccessClinicalNotes('RECEPTIONIST')).toBe(false);
  });

  test('allows consecutive back-to-back appointments where end equals next start', () => {
    scheduler.schedule(receptionist, {
      status: 'booked',
      patientId: 'pat_1',
      practitionerId: 'doc_1',
      start: '2024-05-01T10:00:00Z',
      end: '2024-05-01T10:30:00Z',
      description: 'Morning Checkup'
    });

    // Exactly adjacent: 10:30 start should be ALLOWED
    const adjacent = scheduler.schedule(receptionist, {
      status: 'booked',
      patientId: 'pat_2',
      practitionerId: 'doc_1',
      start: '2024-05-01T10:30:00Z',
      end: '2024-05-01T11:00:00Z',
      description: 'Follow-up'
    });
    expect(adjacent.id).toBeDefined();
  });
});
