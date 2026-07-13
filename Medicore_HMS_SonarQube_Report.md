# SonarQube Analysis Report
**Project Name:** Medicore_HMS
**Generated On:** 2026-07-13

## 📊 Overall Metrics
- **Quality Gate Status:** OK
- **Lines of Code:** 11,562
- **Bugs:** 5
- **Vulnerabilities:** 3
- **Security Hotspots:** 0
- **Code Smells:** 183
- **Coverage:** 0.0%
- **Duplicated Lines Density:** 0.9%

## 🛑 Vulnerabilities (3)

1. **Hard-coded password detected**
   - **Severity:** MAJOR (Security)
   - **File:** `backend/appointment-service/src/test/java/com/medicore/appointment/CrossRoleSecurityTest.java`
   - **Rule:** java:S2068

2. **Hard-coded password detected**
   - **Severity:** MAJOR (Security)
   - **File:** `backend/auth-service/src/main/java/com/medicore/auth/config/DataInitializer.java` (Line 15)
   - **Rule:** java:S2068

3. **Hard-coded password detected**
   - **Severity:** MAJOR (Security)
   - **File:** `backend/auth-service/src/main/java/com/medicore/auth/config/DataInitializer.java` (Line 16)
   - **Rule:** java:S2068

## 🐛 Recent Bugs (Sample)

1. **Unused assignment**
   - **Severity:** MAJOR (Reliability)
   - **File:** `frontend/src/pages/dashboards/ReceptionistDashboard.tsx`
   - **Message:** Remove this useless assignment to local variable 'handlePageChange'.

2. **Unused assignment**
   - **Severity:** MAJOR (Reliability)
   - **File:** `frontend/src/pages/dashboards/AdminDashboard.tsx`
   - **Message:** Remove this useless assignment to local variable 'handlePageChange'.

3. **Container run as root**
   - **Severity:** MINOR
   - **File:** `backend/Dockerfile`
   - **Message:** A user should be specified in the Dockerfile, otherwise the image will run as root.

*(Note: Total of 5 bugs detected. See the SonarQube dashboard for the full list.)*

---
**View Full Report in Browser:** [http://localhost:9000/dashboard?id=Medicore_HMS](http://localhost:9000/dashboard?id=Medicore_HMS)
