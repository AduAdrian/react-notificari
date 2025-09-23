# Configurare alias pentru comanda "deschide app"
# Acest script va crea un alias pentru comanda "deschide app" care va executa scriptul DESCHIDE_APP.bat

$scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "DESCHIDE_APP.bat"

# Verificăm dacă scriptul există
if (-not (Test-Path -Path $scriptPath)) {
    Write-Host "EROARE: Nu s-a găsit scriptul DESCHIDE_APP.bat în directorul curent." -ForegroundColor Red
    Write-Host "Asigurați-vă că acest script este în același director cu DESCHIDE_APP.bat" -ForegroundColor Yellow
    exit 1
}

# Creăm funcția care va fi folosită ca alias
$functionContent = @"
function Deschide-App {
    param(
        [Parameter(Position=0)]
        [string] `$Action = "app"
    )

    if (`$Action -eq "app") {
        Write-Host "Pornire aplicație React Notificări..." -ForegroundColor Cyan
        & "$scriptPath"
    }
    else {
        Write-Host "Comandă nerecunoscută. Folosiți 'deschide app' pentru a porni aplicația." -ForegroundColor Yellow
    }
}
"@

# Cream fisierul de profil PowerShell daca nu exista
$profilePath = $PROFILE
$profileDir = Split-Path -Parent $profilePath

if (-not (Test-Path -Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

if (-not (Test-Path -Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

# Verificăm dacă funcția există deja în profil
$profileContent = Get-Content -Path $profilePath -Raw -ErrorAction SilentlyContinue
if ($profileContent -and $profileContent.Contains("function Deschide-App")) {
    Write-Host "Funcția 'Deschide-App' există deja în profilul PowerShell." -ForegroundColor Yellow
}
else {
    # Adăugăm funcția la profilul PowerShell
    Add-Content -Path $profilePath -Value "`n$functionContent"
    
    # Adaugăm și un alias pentru funcție
    Add-Content -Path $profilePath -Value "`nNew-Alias -Name deschide -Value Deschide-App"
    
    Write-Host "Alias 'deschide' a fost adăugat cu succes în profilul PowerShell!" -ForegroundColor Green
    Write-Host "Pentru a folosi noul alias, reporniți PowerShell sau executați: . `$PROFILE" -ForegroundColor Yellow
}

# Oferim opțiunea de a reîncărca profilul imediat
$reloadProfile = Read-Host "Doriți să reîncărcați profilul PowerShell acum? (da/nu)"
if ($reloadProfile -eq "da") {
    try {
        . $PROFILE
        Write-Host "Profilul a fost reîncărcat. Acum puteți folosi comanda 'deschide app'" -ForegroundColor Green
    }
    catch {
        Write-Host "A apărut o eroare la reîncărcarea profilului: $_" -ForegroundColor Red
        Write-Host "Reporniți PowerShell pentru a activa comanda 'deschide app'" -ForegroundColor Yellow
    }
}

Write-Host "`nInstrucțiuni de utilizare:" -ForegroundColor Cyan
Write-Host "1. Deschideți PowerShell"
Write-Host "2. Tastați comanda: deschide app"
Write-Host "3. Aplicația va porni cu toate porturile verificate și curate"