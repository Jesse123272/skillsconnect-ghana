$ErrorActionPreference = 'Stop'
try {
  $baseUrl = $env:BASE_URL
  if (-not $baseUrl) { $baseUrl = 'https://skillsconnect-ghana.vercel.app' }
  $artisanEmail = "artisan$(Get-Date -Format 'yyMMddHHmmss')@example.com"
  $artisanBody = @{
    full_name = 'E2E Artisan'
    email = $artisanEmail
    phone = '+233500000003'
    password = 'Artisan@123'
    confirm_password = 'Artisan@123'
    role = 'artisan'
    region = 'Greater Accra'
    district = 'Accra Central'
    category_id = 1
    years_experience = 5
    bio = 'Test artisan profile.'
  }
  $resArt = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body ($artisanBody | ConvertTo-Json -Compress) -TimeoutSec 120
  Write-Host "ARTISAN REGISTER STATUS:" $resArt.StatusCode
  Write-Host $resArt.Content
  $artObj = $resArt.Content | ConvertFrom-Json
  $artisanId = $artObj.data.user_id

  $sessionAdmin = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $adminBody = @{ email = 'admin@skillsconnect.gh'; password = 'Admin@2026'; remember_me = $true } | ConvertTo-Json -Compress
  $resAdminLogin = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -ContentType 'application/json' -Body $adminBody -WebSession $sessionAdmin -TimeoutSec 120
  Write-Host "ADMIN LOGIN STATUS:" $resAdminLogin.StatusCode
  Write-Host $resAdminLogin.Content

  $approveBody = @{ action = 'approve' }
  $resApprove = Invoke-WebRequest -Uri "$baseUrl/api/admin/artisans/$artisanId" -Method PUT -ContentType 'application/json' -Body ($approveBody | ConvertTo-Json -Compress) -WebSession $sessionAdmin -TimeoutSec 120
  Write-Host "APPROVE ARTISAN STATUS:" $resApprove.StatusCode
  Write-Host $resApprove.Content

  Write-Host 'Artisan approve script completed successfully.'
} catch {
  Write-Host 'Error:' $_.Exception.Message
  if ($_.Exception.Response) {
    $r = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $r.BaseStream.Position = 0
    $r.DiscardBufferedData()
    Write-Host $r.ReadToEnd()
  }
  exit 1
}