# Setup all MediCore databases — reads DB_PASSWORD from .env
$env:PATH = "C:\xampp\mysql\bin;" + $env:PATH
. "$PSScriptRoot\load-env.ps1"
$Root = $PSScriptRoot
$DbPassword = Get-DbPasswordFromEnv -Root $Root

if (-not $DbPassword -or $DbPassword -eq 'YOUR_MYSQL_PASSWORD') {
    Write-Host 'ERROR: Open .env and set DB_PASSWORD=your_mysql_password' -ForegroundColor Red
    exit 1
}

$env:MYSQL_PWD = $DbPassword
$sqlFiles = @(
    '01_auth_db', '02_patient_db', '03_doctor_db', '04_appointment_db',
    '05_billing_db', '06_pharmacy_db', '07_notification_db', '08_nurse_db'
)

Write-Host 'Connecting to MySQL...' -ForegroundColor Cyan
mysql -u root -e "SELECT 1;" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'MySQL connection failed. Check DB_PASSWORD in .env and that MySQL service is running.' -ForegroundColor Red
    exit 1
}

Write-Host 'Dropping old databases...'
mysql -u root -e "DROP DATABASE IF EXISTS auth_db; DROP DATABASE IF EXISTS patient_db; DROP DATABASE IF EXISTS doctor_db; DROP DATABASE IF EXISTS appointment_db; DROP DATABASE IF EXISTS billing_db; DROP DATABASE IF EXISTS pharmacy_db; DROP DATABASE IF EXISTS notification_db; DROP DATABASE IF EXISTS nurse_db;"

foreach ($f in $sqlFiles) {
    $path = Join-Path $Root "$f.sql"
    Write-Host "Running $f.sql ..."
    cmd /c "mysql -u root < `"$path`""
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $f.sql" -ForegroundColor Red
        exit 1
    }
}

Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
Write-Host ''
Write-Host 'Database setup complete!' -ForegroundColor Green
