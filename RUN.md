# Quick Run Guide — MediCore HMS

## Step 1: Set MySQL password

Open `db.env` and replace `YOUR_PASSWORD` with your MySQL root password:

```
DB_PASSWORD=your_actual_mysql_password
```

## Step 2: Create databases

Open **Command Prompt** or **PowerShell** in this folder:

```bat
setup-database.bat your_actual_mysql_password
```

This creates all 7 databases (`auth_db`, `patient_db`, etc.).

## Step 3: Start backend

```powershell
powershell -ExecutionPolicy Bypass -File start-backend.ps1
```

Wait **30–40 seconds** for all services to register with Eureka.

Check: open http://localhost:8761 — you should see services listed.

## Step 4: Start frontend

```bat
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:5173

## Step 5: Login

| Email | Password |
|-------|----------|
| admin@medicore.local | Admin@123 |
| doctor@medicore.local | Admin@123 |
| patient@medicore.local | Admin@123 |
| reception@medicore.local | Admin@123 |
| pharmacist@medicore.local | Admin@123 |

---

## "Invalid password" fix (already applied in code)

This happened because:
1. **Backend was not running** — login could not reach the API
2. **Wrong MySQL password** — auth-service failed to start (check `db.env`)
3. **Old SQL seed hash** — now fixed; demo users are created/reset when auth-service starts

If login still fails:
- Confirm http://localhost:8080/auth/login is reachable
- Confirm `db.env` has the correct MySQL password
- Restart backend after changing `db.env`

## Verify services are up

```powershell
netstat -ano | findstr "8080 8081 5173 8761"
```

You should see ports **8761**, **8080**, **8081**, and **5173** listening.
