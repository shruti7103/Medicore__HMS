# MediCore HMS — Java-only stack (no Python)

Hospital Management System with 6 roles, Spring Boot microservices, React frontend, and MySQL.

## Quick start

```powershell
cd "d:\Shruti HMS"
.\setup-database.ps1
.\start-backend.ps1
cd frontend; npm install; npm run dev
```

Open http://localhost:5173

## Demo logins (password: `Admin@123`)

| Role | Email |
|------|-------|
| Admin | admin@medicore.local |
| Doctor | doctor@medicore.local |
| Nurse | nurse@medicore.local |
| Receptionist | reception@medicore.local |
| Patient | patient@medicore.local |
| Pharmacist | pharmacist@medicore.local |

Admin password reset sets temporary password: `Reset@123`

## Architecture

- **Java microservices**: Eureka, Gateway, Auth, Patient, Doctor, Appointment, Billing, Pharmacy, Notification, **Nurse**, **Analytics**, **Symptom-Check**
- Symptom Pre-Check and Analytics are **Java Spring Boot** services (not Python)
- **6 roles**: ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT, PHARMACIST
- JWT auth with route guards (frontend) and `@PreAuthorize` (backend)
- Database-per-service MySQL schemas (`01_auth_db.sql` … `08_nurse_db.sql`)

## Service ports

| Service | Port |
|---------|------|
| API Gateway | 8080 |
| Eureka | 8761 |
| Auth | 8081 |
| Patient | 8082 |
| Doctor | 8083 |
| Appointment | 8084 |
| Billing | 8085 |
| Pharmacy | 8086 |
| Notification | 8087 |
| Nurse | 8088 |
| Analytics | 8089 |
| Symptom-Check | 8090 |

## Build backend

```powershell
$env:MAVEN_OPTS='-Xmx512m'
cd backend
mvn package "-Dmaven.test.skip=true"
```

## Environment

Set `DB_PASSWORD` in `.env` at project root (used by setup scripts and services).
