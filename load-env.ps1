# Shared .env loader for MediCore scripts
function Get-DbPasswordFromEnv {
    param([string]$Root)
    $EnvFile = Join-Path $Root ".env"
    if (-not (Test-Path $EnvFile)) {
        return $null
    }
    foreach ($line in Get-Content $EnvFile -Encoding UTF8) {
        $line = $line.Trim()
        if (-not $line -or $line.StartsWith('#')) { continue }
        if ($line -match '^\s*DB_PASSWORD\s*=\s*(.+)\s*$') {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}
