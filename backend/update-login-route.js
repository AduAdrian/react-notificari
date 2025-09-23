// Script pentru modificarea rutei de login
const fs = require('fs');
const path = require('path');

// Calea către fișierul auth.js
const authFilePath = path.join(__dirname, 'routes', 'auth.js');

// Citim conținutul fișierului
fs.readFile(authFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Eroare la citirea fișierului:', err);
    return;
  }

  // Găsim ruta de login
  const loginRoutePattern = /router\.post\(['"]\/login['"].*?\{([\s\S]*?)(?=\}\);)/;
  const match = data.match(loginRoutePattern);
  
  if (!match) {
    console.error('Nu am putut găsi ruta de login în fișierul auth.js');
    return;
  }

  const loginRoute = match[0];
  const loginRouteContent = match[1];

  // Verificăm dacă există deja verificarea isVerified
  if (loginRouteContent.includes('user.isVerified')) {
    console.log('Verificarea isVerified există deja în ruta de login');
    return;
  }

  // Găsim locul unde se verifică parola
  const passwordCheckPattern = /if \(!authUtils\.validatePassword\([^)]+\)\) \{([\s\S]*?)(?=\})/;
  const passwordCheckMatch = loginRouteContent.match(passwordCheckPattern);

  if (!passwordCheckMatch) {
    console.error('Nu am putut găsi verificarea parolei în ruta de login');
    return;
  }

  // Construim noul conținut cu verificarea isVerified adăugată după verificarea parolei
  const passwordCheckEnd = loginRouteContent.indexOf(passwordCheckMatch[0]) + passwordCheckMatch[0].length + 1;
  
  const newLoginRouteContent = 
    loginRouteContent.substring(0, passwordCheckEnd) +
    `
        // Verificăm dacă utilizatorul este verificat
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Contul nu este verificat',
                requiresVerification: true,
                email: user.email,
                verificationMethod: user.verificationMethod
            });
        }` +
    loginRouteContent.substring(passwordCheckEnd);

  // Înlocuim conținutul vechi al rutei de login cu cel nou
  const updatedData = data.replace(loginRouteContent, newLoginRouteContent);

  // Scriem fișierul actualizat
  fs.writeFile(authFilePath, updatedData, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Eroare la scrierea fișierului:', writeErr);
      return;
    }
    console.log('Fișierul auth.js a fost actualizat cu succes!');
  });
});