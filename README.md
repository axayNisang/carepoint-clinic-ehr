# CarePoint — Clinic Appointments & EHR System 🏥

[![CI Pipeline](https://github.com/axayNisang/carepoint-clinic-ehr/actions/workflows/ci.yml/badge.svg)](https://github.com/axayNisang/carepoint-clinic-ehr/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![FHIR Standard](https://img.shields.io/badge/Standard-HL7%20FHIR%20R4-orange.svg)](https://hl7.org/fhir/)

**CarePoint** is an enterprise-ready Electronic Health Record (EHR) and clinical appointment management platform compliant with HL7/FHIR R4 standards, strict HIPAA role-based access controls, and tamper-evident audit trails.

---

## 🏛 Architecture & Security Design

```
                  Client Request (Doctor / Receptionist)
                                    │
                                    ▼ [JWT Auth & Role Check]
                     +-----------------------------+
                     |    Access Policy Engine     |
                     |  (RBAC: Doctor, Nurse, Rec) |
                     +-----------------------------+
                                    │
                      ┌─────────────┴─────────────┐
                      ▼                           ▼
        +---------------------------+   +---------------------------+
        |   Appointment Scheduler   |   |     Clinical Encounters   |
        |  (Overlap Conflict Check) |   |    (PHI Encrypted Vault)  |
        +---------------------------+   +---------------------------+
                      │                           │
                      └─────────────┬─────────────┘
                                    ▼
                     +-----------------------------+
                     |   HIPAA Audit Logger        |
                     |  (Tamper-Evident Trail)     |
                     +-----------------------------+
```

---

## 🛡 Key Features

- **HL7 FHIR R4 Schema Alignment**: Native data structures conforming to standard healthcare schemas (`Patient`, `Appointment`, `Encounter`).
- **Zero-Overlap Appointment Scheduling**: Automated interval intersection detection prevents double-booking clinicians across simultaneous consultation windows.
- **Role-Based Access Control (RBAC)**: Enforces least-privilege access rules protecting sensitive Protected Health Information (PHI).
- **Audit Logging**: Every read, write, or update against a patient record generates an immutable access log.

---

## 🧪 Testing

```bash
npm install
npm test
```

---

## 📄 License
MIT License. Created by [Akshay Nisang](https://github.com/axayNisang).
