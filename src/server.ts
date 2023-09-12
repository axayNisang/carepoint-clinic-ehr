import express, { Request, Response } from 'express';
import { AuditLogger, AccessPolicyEngine } from './security/AccessPolicyEngine';
import { AppointmentScheduler } from './security/AppointmentScheduler';
import { ClinicalRole, UserContext } from './types';

const app = express();
app.use(express.json());

const auditLogger = new AuditLogger();
const scheduler = new AppointmentScheduler(auditLogger);

// Auth simulation middleware
function getUser(req: Request): UserContext {
  const role = (req.headers['x-user-role'] as ClinicalRole) || 'RECEPTIONIST';
  const userId = (req.headers['x-user-id'] as string) || 'usr_anonymous';
  return { userId, name: 'Staff User', role };
}

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'carepoint-clinic-ehr' }));

app.post('/api/appointments', (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const body = req.body;
    const appointment = scheduler.schedule(user, {
      patientId: body.patientId,
      practitionerId: body.practitionerId,
      start: body.start || body.startTime,
      end: body.end || body.endTime,
      status: body.status || 'booked',
      description: body.description || body.reason || ''
    });
    return res.status(201).json(appointment);
  } catch (err: any) {
    const status = err.message.includes('Unauthorized') ? 403 : 409;
    return res.status(status).json({ error: err.message });
  }
});

app.get('/api/appointments/:practitionerId', (req: Request, res: Response) => {
  const list = scheduler.getAppointmentsForPractitioner(req.params.practitionerId);
  return res.json(list);
});

app.get('/api/patients/:patientId/notes', (req: Request, res: Response) => {
  const user = getUser(req);
  if (!AccessPolicyEngine.canAccessClinicalNotes(user.role)) {
    auditLogger.logAccess(user, 'READ', 'EncounterNote_BLOCKED', 'note_secret', req.params.patientId);
    return res.status(403).json({ error: `Forbidden: Role '${user.role}' cannot view clinical diagnosis notes.` });
  }
  auditLogger.logAccess(user, 'READ', 'EncounterNote_SUCCESS', 'note_secret', req.params.patientId);
  return res.json({ patientId: req.params.patientId, diagnoses: ['Hypertension', 'Type 2 Diabetes'], confidential: true });
});

app.get('/api/audit', (req, res) => {
  res.json(auditLogger.getAuditTrail());
});

const PORT = 8084;
app.listen(PORT, () => console.log(`[CarePoint EHR] Running on port ${PORT}`));
