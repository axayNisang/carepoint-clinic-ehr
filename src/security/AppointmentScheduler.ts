import { FHIRAppointment, UserContext } from '../types';
import { AccessPolicyEngine, AuditLogger } from './AccessPolicyEngine';
import { v4 as uuidv4 } from 'uuid';

export class AppointmentScheduler {
  private appointments: FHIRAppointment[] = [];

  constructor(private auditLogger: AuditLogger) {}

  public schedule(
    user: UserContext,
    appointmentData: Omit<FHIRAppointment, 'id' | 'resourceType'>
  ): FHIRAppointment {
    if (!AccessPolicyEngine.canScheduleAppointments(user.role)) {
      throw new Error(`Unauthorized: Role '${user.role}' cannot schedule appointments`);
    }

    // Overlap / Double-booking Conflict Detection
    const reqStart = new Date(appointmentData.start).getTime();
    const reqEnd = new Date(appointmentData.end).getTime();

    const hasConflict = this.appointments.some(app => {
      if (app.practitionerId !== appointmentData.practitionerId || app.status === 'cancelled') {
        return false;
      }
      const existingStart = new Date(app.start).getTime();
      const existingEnd = new Date(app.end).getTime();
      return (reqStart < existingEnd && reqEnd > existingStart);
    });

    if (hasConflict) {
      throw new Error('Scheduling conflict: Practitioner already has an active appointment at this time');
    }

    const appt: FHIRAppointment = {
      resourceType: 'Appointment',
      id: `appt_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      ...appointmentData
    };

    this.appointments.push(appt);
    this.auditLogger.logAccess(user, 'WRITE', 'Appointment', appt.id, appt.patientId);

    return appt;
  }

  public getAppointmentsForPractitioner(practitionerId: string): FHIRAppointment[] {
    return this.appointments.filter(a => a.practitionerId === practitionerId);
  }
}
