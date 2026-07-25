$ErrorActionPreference = 'Stop'
try {
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $adminBody = @{ email = 'admin@skillsconnect.gh'; password = 'Admin@2026'; remember_me = $true } | ConvertTo-Json -Compress
  $login = Invoke-WebRequest -Uri 'https://skillsconnect-ghana.vercel.app/api/auth/login' -Method POST -ContentType 'application/json' -Body $adminBody -WebSession $session -TimeoutSec 120
  Write-Host "ADMIN LOGIN STATUS:" $login.StatusCode

  $artisanId = 7
  $res = Invoke-WebRequest -Uri "https://skillsconnect-ghana.vercel.app/api/admin/artisans/$artisanId" -Method GET -WebSession $session -TimeoutSec 120
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
