$ErrorActionPreference = 'Stop'

function PostJson($url, $body, $session=$null) {
  $json = $body | ConvertTo-Json -Compress
  if ($session) {
    return Invoke-WebRequest -Uri $url -Method POST -ContentType 'application/json' -Body $json -WebSession $session -TimeoutSec 120
  } else {
    return Invoke-WebRequest -Uri $url -Method POST -ContentType 'application/json' -Body $json -TimeoutSec 120
  }
}

try {
  $sessionCustomer = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $sessionAdmin = New-Object Microsoft.PowerShell.Commands.WebRequestSession

  # Register artisan
  $artisanEmail = "artisan$(Get-Date -Format 'yyMMddHHmmss')@example.com"
  $artisanBody = @{
    full_name = 'E2E Artisan'
    email = $artisanEmail
    phone = '+233500000001'
    password = 'Artisan@123'
    confirm_password = 'Artisan@123'
    role = 'artisan'
    region = 'Greater Accra'
    district = 'Accra Central'
    category_id = 1
    years_experience = 5
    bio = 'Test artisan profile.'
  }
  $resArt = PostJson 'https://skillsconnect-ghana.vercel.app/api/auth/register' $artisanBody
  Write-Host "ARTISAN REGISTER STATUS:" $resArt.StatusCode
  Write-Host $resArt.Content
  $artObj = $resArt.Content | ConvertFrom-Json
  $artisanId = $artObj.data.user_id

  # Register customer
  $customerEmail = "customer$(Get-Date -Format 'yyMMddHHmmss')@example.com"
  $customerBody = @{
    full_name = 'E2E Customer'
    email = $customerEmail
    phone = '+233500000002'
    password = 'Customer@123'
    confirm_password = 'Customer@123'
    role = 'customer'
    region = 'Greater Accra'
    district = 'Accra Central'
  }
  $resCust = PostJson 'https://skillsconnect-ghana.vercel.app/api/auth/register' $customerBody
  Write-Host "CUSTOMER REGISTER STATUS:" $resCust.StatusCode
  Write-Host $resCust.Content

  # Customer login (store cookies)
  $loginCustBody = @{ email = $customerEmail; password = 'Customer@123'; remember_me = $true }
  $resLoginCust = PostJson 'https://skillsconnect-ghana.vercel.app/api/auth/login' $loginCustBody $sessionCustomer
  Write-Host "CUSTOMER LOGIN STATUS:" $resLoginCust.StatusCode
  Write-Host $resLoginCust.Content

  # Create enquiry as customer
  $enqBody = @{ artisan_id = $artisanId; subject = 'Test Enquiry'; message = 'Hello, I need assistance with a task'; budget = 100 }
  $resEnq = PostJson 'https://skillsconnect-ghana.vercel.app/api/enquiries' $enqBody $sessionCustomer
  Write-Host "CREATE ENQUIRY STATUS:" $resEnq.StatusCode
  Write-Host $resEnq.Content

  # Admin login
  $adminBody = @{ email = 'admin@skillsconnect.gh'; password = 'Admin@2026'; remember_me = $true }
  $resAdminLogin = PostJson 'https://skillsconnect-ghana.vercel.app/api/auth/login' $adminBody $sessionAdmin
  Write-Host "ADMIN LOGIN STATUS:" $resAdminLogin.StatusCode
  Write-Host $resAdminLogin.Content

  # Approve artisan as admin
  $approveBody = @{ action = 'approve' }
  $resApprove = Invoke-WebRequest -Uri "https://skillsconnect-ghana.vercel.app/api/admin/artisans/$artisanId" -Method PUT -ContentType 'application/json' -Body ($approveBody | ConvertTo-Json -Compress) -WebSession $sessionAdmin -TimeoutSec 120
  Write-Host "APPROVE ARTISAN STATUS:" $resApprove.StatusCode
  Write-Host $resApprove.Content

  # Customer fetch enquiries
  $resCustEnqs = Invoke-WebRequest -Uri 'https://skillsconnect-ghana.vercel.app/api/enquiries?limit=10' -Method GET -WebSession $sessionCustomer -TimeoutSec 120
  Write-Host "CUSTOMER ENQUIRIES STATUS:" $resCustEnqs.StatusCode
  Write-Host $resCustEnqs.Content

  Write-Host 'E2E QA script completed successfully.'
} catch {
  Write-Host 'E2E QA script error:' $_.Exception.Message
  if ($_.Exception.Response) {
    $r = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $r.BaseStream.Position = 0
    $r.DiscardBufferedData()
    Write-Host $r.ReadToEnd()
  }
  exit 1
}
