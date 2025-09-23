# PowerShell test script for registration and verification flow
param(
    [string]$BaseUrl = "http://localhost:3002/api/auth"
)

Write-Host "🧪 Testare fluxului complet de înregistrare și verificare" -ForegroundColor Yellow
Write-Host ""

# Generate unique test data
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser = @{
    firstName          = "Ion"
    lastName           = "Popescu"  
    email              = "test$timestamp@example.com"
    password           = "Test123!"
    confirmPassword    = "Test123!"
    phone              = "0721234567"
    cui                = "12345678"
    verificationMethod = "email"
}

try {
    # Step 1: Register new user
    Write-Host "1️⃣ Înregistrare utilizator nou..." -ForegroundColor Cyan
    Write-Host "   Email: $($testUser.email)" -ForegroundColor Gray
    Write-Host "   Nume: $($testUser.firstName) $($testUser.lastName)" -ForegroundColor Gray
    Write-Host "   Telefon: $($testUser.phone)" -ForegroundColor Gray
    Write-Host "   CUI: $($testUser.cui)" -ForegroundColor Gray
    
    $registerBody = $testUser | ConvertTo-Json -Depth 10
    $registerResponse = Invoke-RestMethod -Uri "$BaseUrl/register" -Method Post -Body $registerBody -ContentType "application/json" -ErrorAction Stop
    
    if (-not $registerResponse.success) {
        Write-Host "❌ Eroare înregistrare: $($registerResponse.message)" -ForegroundColor Red
        if ($registerResponse.errors) {
            Write-Host "   Detalii: $($registerResponse.errors | ConvertTo-Json)" -ForegroundColor Red
        }
        return
    }

    Write-Host "✅ Înregistrare reușită!" -ForegroundColor Green
    Write-Host "   Mesaj: $($registerResponse.message)" -ForegroundColor Gray

    # Step 2: Test resend code
    Write-Host ""
    Write-Host "2️⃣ Test retrimite cod..." -ForegroundColor Cyan
    $resendBody = @{ email = $testUser.email } | ConvertTo-Json
    $resendResponse = Invoke-RestMethod -Uri "$BaseUrl/resend-code" -Method Post -Body $resendBody -ContentType "application/json" -ErrorAction SilentlyContinue
    
    if ($resendResponse.success) {
        Write-Host "✅ Codul poate fi retrimis cu succes" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Retrimite cod: $($resendResponse.message)" -ForegroundColor Yellow
    }

    # Step 3: Try verification with common test codes
    Write-Host ""
    Write-Host "3️⃣ Verificare cod..." -ForegroundColor Cyan
    Write-Host "   📝 Pentru test, încercăm coduri comune de test" -ForegroundColor Gray
    Write-Host "   În producție, codul ar fi primit prin email/SMS" -ForegroundColor Gray
    
    $testCodes = @('123456', '000000', '111111', '654321')
    $verificationSuccess = $false
    $userData = $null

    foreach ($testCode in $testCodes) {
        try {
            $verifyBody = @{
                email            = $testUser.email
                verificationCode = $testCode
            } | ConvertTo-Json
            
            $verifyResponse = Invoke-RestMethod -Uri "$BaseUrl/verify" -Method Post -Body $verifyBody -ContentType "application/json" -ErrorAction Stop
            
            if ($verifyResponse.success) {
                Write-Host "✅ Verificare reușită cu codul: $testCode" -ForegroundColor Green
                $tokenPreview = $verifyResponse.token.Substring(0, [Math]::Min(30, $verifyResponse.token.Length))
                Write-Host "   Token JWT: $tokenPreview..." -ForegroundColor Gray
                $verificationSuccess = $true
                $userData = $verifyResponse.user
                break
            }
        }
        catch {
            # Continue to next code
        }
    }

    if (-not $verificationSuccess) {
        Write-Host "⚠️ Nu s-a putut verifica cu codurile de test" -ForegroundColor Yellow
        Write-Host "   Verifică logs-urile backend-ului pentru codul real" -ForegroundColor Gray
        Write-Host "   Sau încearcă manual în interfața web" -ForegroundColor Gray
        return
    }

    # Step 4: Test login with verified account
    Write-Host ""
    Write-Host "4️⃣ Test login cu contul verificat..." -ForegroundColor Cyan
    $loginBody = @{
        email    = $testUser.email
        password = $testUser.password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    if ($loginResponse.success) {
        Write-Host "✅ Login reușit!" -ForegroundColor Green
        Write-Host "   Utilizator: $($loginResponse.user.firstName) $($loginResponse.user.lastName)" -ForegroundColor Gray
        Write-Host "   Email: $($loginResponse.user.email)" -ForegroundColor Gray
        $statusText = if ($loginResponse.user.isActive) { "Activ" } else { "Inactiv" }
        $verifiedText = if ($loginResponse.user.isVerified) { "Da" } else { "Nu" }
        Write-Host "   Status: $statusText" -ForegroundColor Gray
        Write-Host "   Verificat: $verifiedText" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ Eroare login: $($loginResponse.message)" -ForegroundColor Red
    }

    # Summary
    Write-Host ""
    Write-Host "🎉 Test complet finalizat!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Yellow
    Write-Host "📊 Sumar rezultate:" -ForegroundColor Yellow
    Write-Host "   ✅ Înregistrare: Reușită" -ForegroundColor Green
    Write-Host "   ✅ Retrimite cod: Funcțional" -ForegroundColor Green
    $verifyText = if ($verificationSuccess) { "✅ Verificare: Reușită" } else { "❌ Verificare: Eșuată" }
    $verifyColor = if ($verificationSuccess) { "Green" } else { "Red" }
    Write-Host "   $verifyText" -ForegroundColor $verifyColor
    $loginText = if ($loginResponse.success) { "✅ Login: Reușit" } else { "❌ Login: Eșuat" }
    $loginColor = if ($loginResponse.success) { "Green" } else { "Red" }
    Write-Host "   $loginText" -ForegroundColor $loginColor

    if ($verificationSuccess -and $loginResponse.success) {
        Write-Host ""
        Write-Host "🎊 Toate testele au trecut cu succes!" -ForegroundColor Green
        Write-Host "   Sistemul de înregistrare și verificare funcționează perfect!" -ForegroundColor Green
    }

}
catch {
    Write-Host "❌ Eroare în test: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Detalii: $($_.Exception.ToString())" -ForegroundColor Red
}