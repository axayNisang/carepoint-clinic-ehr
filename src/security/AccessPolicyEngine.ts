import { AuditLogEntry, ClinicalRole, UserContext } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AuditLogger {
  private logs: AuditLogEntry[] = [];

  public logAccess(user: UserContext, action: 'READ' | 'WRITE' | 'DELETE', resourceType: string, resourceId: string, patientId: string): void {
    this.logs.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: user.userId,
      userRole: user.role,
      action,
      resourceType,
      resourceId,
      patientId
    });
  }

  public getAuditTrail(patientId?: string): AuditLogEntry[] {
    if (patientId) {
      return this.logs.filter(l => l.patientId === patientId);
    }
    return this.logs;
  }
}

export class AccessPolicyEngine {
  public static canAccessClinicalNotes(role: ClinicalRole): boolean {
    return role === 'DOCTOR' || role === 'NURSE';
  }

  public static canScheduleAppointments(role: ClinicalRole): boolean {
    return role === 'RECEPTIONIST' || role === 'ADMIN' || role === 'DOCTOR';
  }

  public static canModifyMedicalHistory(role: ClinicalRole): boolean {
    return role === 'DOCTOR';
  }
}
