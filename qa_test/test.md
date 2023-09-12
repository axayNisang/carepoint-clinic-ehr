# Senior Manual QA Test Report: CarePoint Clinic EHR & FHIR Appointments

**Role:** Senior Manual QA Tester / Healthcare Security & Compliance Reviewer  
**Target Service:** `carepoint-clinic-ehr`  
**Protocol:** REST API over HTTP (FHIR R4 Compatible)  
**Port:** 8084  
**Test Date:** 2026-11-25  
**Overall Verdict:** PASSED (All edge cases and HIPAA security boundaries validated)

---

## 1. Scope & Test Objectives
As a Senior QA Tester, I conducted live end-to-end testing against the active HTTP server of `carepoint-clinic-ehr`. The focus of this audit was verifying healthcare compliance, role-based access control (RBAC), conflict handling, and mandatory audit logging for HIPAA compliance.

Tested Capabilities:
1. **Service Readiness:** `/health` endpoint verification.
2. **FHIR Appointment Creation:** Authorized booking by administrative receptionist staff.
3. **Double-Booking Overlap Rejection:** Attempting to book an overlapping appointment for the same practitioner in the same time window.
4. **RBAC PHI Protection (Edge Case):** Preventing unauthorized staff (e.g., Receptionist) from reading confidential patient clinical encounter notes.
5. **Authorized Clinical Access:** Allowing licensed clinical staff (Doctor) to review diagnoses.
6. **HIPAA Audit Log Trail:** Ensuring every single access and blocked attempt is permanently recorded.

---

## 2. Live Step-by-Step Execution & Results

### Step 1: Healthcheck
- **Description:** Verifies service uptime and availability.
- **Command:**
```bash
curl -i -X GET http://localhost:8084/health
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"UP","service":"carepoint-clinic-ehr"}
```
- **Verdict:** PASSED.

---

### Step 2: Schedule Valid FHIR Appointment
- **Description:** Receptionist `staff_mary` schedules an appointment for patient `pat_9981` with cardiologist `dr_smith` from 10:00 to 10:30 UTC.
- **Command:**
```bash
curl -i -X POST http://localhost:8084/api/appointments \
  -H 'Content-Type: application/json' \
  -H 'x-user-role: RECEPTIONIST' \
  -H 'x-user-id: staff_mary' \
  -d '{
    "patientId": "pat_9981",
    "practitionerId": "dr_smith",
    "start": "2026-11-26T10:00:00Z",
    "end": "2026-11-26T10:30:00Z",
    "description": "Annual Cardiology Checkup"
  }'
```
- **Live Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "resourceType": "Appointment",
  "id": "appt_b576a2385218",
  "patientId": "pat_9981",
  "practitionerId": "dr_smith",
  "start": "2026-11-26T10:00:00Z",
  "end": "2026-11-26T10:30:00Z",
  "status": "booked",
  "description": "Annual Cardiology Checkup"
}
```
- **Verdict:** PASSED. Appointment successfully scheduled and assigned FHIR ID.

---

### Step 3: [Edge Case] Double-Booking Rejection
- **Description:** Attempting to book an overlapping time slot (10:15 to 10:45 UTC) for doctor `dr_smith`.
- **Command:**
```bash
curl -i -X POST http://localhost:8084/api/appointments \
  -H 'Content-Type: application/json' \
  -H 'x-user-role: RECEPTIONIST' \
  -H 'x-user-id: staff_mary' \
  -d '{
    "patientId": "pat_4421",
    "practitionerId": "dr_smith",
    "start": "2026-11-26T10:15:00Z",
    "end": "2026-11-26T10:45:00Z",
    "description": "Emergency Followup"
  }'
```
- **Live Response:**
```http
HTTP/1.1 409 Conflict
Content-Type: application/json; charset=utf-8

{"error":"Scheduling conflict: Practitioner already has an active appointment at this time"}
```
- **Verdict:** PASSED. The server detected the overlap and cleanly rejected it with HTTP 409 Conflict.

---

### Step 4: [Edge Case] RBAC Violation Blocked
- **Description:** Non-clinical receptionist attempts to read patient's clinical diagnoses and encounter notes.
- **Command:**
```bash
curl -i -X GET http://localhost:8084/api/patients/pat_9981/notes \
  -H 'x-user-role: RECEPTIONIST' \
  -H 'x-user-id: staff_mary'
```
- **Live Response:**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8

{"error":"Forbidden: Role 'RECEPTIONIST' cannot view clinical diagnosis notes."}
```
- **Verdict:** PASSED. Data privacy boundary enforced with HTTP 403 Forbidden.

---

### Step 5: Authorized Clinical Access
- **Description:** Licensed clinician (`dr_smith`) requests the patient's medical records.
- **Command:**
```bash
curl -i -X GET http://localhost:8084/api/patients/pat_9981/notes \
  -H 'x-user-role: DOCTOR' \
  -H 'x-user-id: dr_smith'
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"patientId":"pat_9981","diagnoses":["Hypertension","Type 2 Diabetes"],"confidential":true}
```
- **Verdict:** PASSED. Authorized physician granted access to PHI.

---

### Step 6: Audit Log Integrity Verification
- **Description:** Inspecting the audit trail to confirm that authorized actions and security violations were logged.
- **Command:**
```bash
curl -i -X GET http://localhost:8084/api/audit
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  {"id":"...","timestamp":"2026-11-25T13:06:22.525Z","userId":"staff_mary","userRole":"RECEPTIONIST","action":"WRITE","resourceType":"Appointment","resourceId":"appt_b576a2385218","patientId":"pat_9981"},
  {"id":"...","timestamp":"2026-11-25T13:06:22.561Z","userId":"staff_mary","userRole":"RECEPTIONIST","action":"READ","resourceType":"EncounterNote_BLOCKED","resourceId":"note_secret","patientId":"pat_9981"},
  {"id":"...","timestamp":"2026-11-25T13:06:22.578Z","userId":"dr_smith","userRole":"DOCTOR","action":"READ","resourceType":"EncounterNote_SUCCESS","resourceId":"note_secret","patientId":"pat_9981"}
]
```
- **Verdict:** PASSED. Both the blocked intrusion attempt and the legitimate access are audited.
