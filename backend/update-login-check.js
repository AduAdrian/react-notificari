// Script pentru modificarea rutei de login - abordare actualizată
const fs = require('fs');
const path = require('path');

// Calea către fișierul auth.js
const authFilePath = path.join(__dirname, 'routes', 'auth.js');

try {
  // Citim conținutul fișierului
  let content = fs.readFileSync(authFilePath, 'utf8');
  
  // Text de căutare - verificăm dacă contul este activ
  const searchText = `        // Verifică dacă contul este activ și verificat
        if (!user.isActive) {`;
  
  // Text de înlocuire - verificăm dacă contul este activ și apoi verificat
  const replaceText = `        // Verifică dacă contul este activ
        if (!user.isActive) {`;
  
  // Înlocuim textul
  if (content.includes(searchText)) {
    content = content.replace(searchText, replaceText);
    
    // Adăugăm verificarea pentru contul verificat
    const isActiveCheckEnd = content.indexOf('        }', content.indexOf(replaceText)) + 9;
    
    const verificationCheck = `
        // Verifică dacă contul este verificat
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Contul nu este verificat',
                requiresVerification: true,
                email: user.email,
                verificationMethod: user.verificationMethod
            });
        }
`;
    
    // Inserăm verificarea după verificarea isActive
    content = content.substring(0, isActiveCheckEnd) + verificationCheck + content.substring(isActiveCheckEnd);
    
    // Salvăm fișierul modificat
    fs.writeFileSync(authFilePath, content, 'utf8');
    console.log('Fișierul auth.js a fost actualizat cu succes!');
  } else {
    console.log('Nu am găsit secvența exactă de text pentru înlocuire.');
  }
} catch (err) {
  console.error('Eroare:', err);
}