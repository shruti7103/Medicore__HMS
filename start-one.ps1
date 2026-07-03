# Start one service with log file (for debugging)
param(
    [Parameter(Mandatory=$true)][string]$ServiceName
)
. "$PSScriptRoot\load-env.ps1"
$Root = $PSScriptRoot
$DbPassword = Get-DbPasswordFromEnv -Root $Root
$logDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$map = @{
    eureka       = @{ Port = 8761; Jar = "eureka-server\target\eureka-server-1.0.0.jar" }
    gateway      = @{ Port = 8080; Jar = "api-gateway\target\api-gateway-1.0.0.jar" }
    auth         = @{ Port = 8081; Jar = "auth-service\target\auth-service-1.0.0.jar" }
    patient      = @{ Port = 8082; Jar = "patient-service\target\patient-service-1.0.0.jar" }
    doctor       = @{ Port = 8083; Jar = "doctor-service\target\doctor-service-1.0.0.jar" }
    appointment  = @{ Port = 8084; Jar = "appointment-service\target\appointment-service-1.0.0.jar" }
    billing      = @{ Port = 8085; Jar = "billing-service\target\billing-service-1.0.0.jar" }
    pharmacy     = @{ Port = 8086; Jar = "pharmacy-service\target\pharmacy-service-1.0.0.jar" }
    notification = @{ Port = 8087; Jar = "notification-service\target\notification-service-1.0.0.jar" }
}

$key = $ServiceName.ToLower()
if (-not $map.ContainsKey($key)) { Write-Error "Unknown service: $ServiceName"; exit 1 }

$jar = Join-Path $Root "backend\$($map[$key].Jar)"
$log = Join-Path $logDir "$key.log"
$env:DB_PASSWORD = $DbPassword
Write-Host "Starting $key -> $log"
Start-Process -FilePath 'java' -ArgumentList '-jar', $jar -WorkingDirectory (Split-Path $jar) -RedirectStandardOutput $log -RedirectStandardError $log -WindowStyle Hidden
