param(
  [int]$artisanId = 7
)
$ErrorActionPreference = 'Stop'
try {
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $adminBody = @{ email = 'admin@skillsconnect.gh'; password = 'Admin@2026'; remember_me = $true } | ConvertTo-Json -Compress
  $login = Invoke-WebRequest -Uri 'http://127.0.0.1:3003/api/auth/login' -Method POST -ContentType 'application/json' -Body $adminBody -WebSession $session -TimeoutSec 60
  Write-Host "ADMIN LOGIN STATUS:" $login.StatusCode
  Write-Host $login.Content

  $res = Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/admin/artisans/$artisanId" -Method GET -WebSession $session -TimeoutSec 60
  Write-Host "GET ARTISAN STATUS:" $res.StatusCode
  Write-Host $res.Content
} catch {
  Write-Host 'ERROR:' $_.Exception.Message
  if ($_.Exception.Response) {
    $r = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $r.BaseStream.Position = 0
    $r.DiscardBufferedData()
    Write-Host $r.ReadToEnd()
  }
  exit 1
}
