. "$PSScriptRoot\load-env.ps1"
$Root = $PSScriptRoot
$env:DB_PASSWORD = Get-DbPasswordFromEnv -Root $Root
$logDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$tests = @(
    @{ Name = "auth"; Jar = "backend\auth-service\target\auth-service-1.0.0.jar" },
    @{ Name = "gateway"; Jar = "backend\api-gateway\target\api-gateway-1.0.0.jar" }
)

foreach ($t in $tests) {
    $jar = Join-Path $Root $t.Jar
    $out = Join-Path $logDir "$($t.Name)-out.log"
    $err = Join-Path $logDir "$($t.Name)-err.log"
    Write-Host "Testing $($t.Name)..."
    $p = Start-Process -FilePath 'java' -ArgumentList '-jar', (Split-Path $jar -Leaf) `
        -WorkingDirectory (Split-Path $jar) -PassThru -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden
    Start-Sleep -Seconds 20
    if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "--- $($t.Name) stderr (last 15 lines) ---"
    if (Test-Path $err) { Get-Content $err -Tail 15 }
    Write-Host ""
}
