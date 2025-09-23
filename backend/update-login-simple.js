// Script pentru modificarea rutei de login - abordare simplă
const fs = require('fs');
const path = require('path');

// Calea către fișierul auth.js
const authFilePath = path.join(__dirname, 'routes', 'auth.js');

try {
  // Citim conținutul fișierului
  let content = fs.readFileSync(authFilePath, 'utf8');
  
  // Text de căutare - după verificarea parolei
  const searchText = `if (!authUtils.validatePassword(password, user.password)) {
            return res.status(401).json({
                success: false,
                message: 'Email sau parolă incorecte'
            });
        }`;
  
  // Text de înlocuire - adăugăm verificarea contului
  const replaceText = `if (!authUtils.validatePassword(password, user.password)) {
            return res.status(401).json({
                success: false,
                message: 'Email sau parolă incorecte'
            });
        }
        
        // Verificăm dacă utilizatorul este verificat
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Contul nu este verificat',
                requiresVerification: true,
                email: user.email,
                verificationMethod: user.verificationMethod
            });
        }`;
  
  // Înlocuim textul
  if (content.includes(searchText)) {
    content = content.replace(searchText, replaceText);
    
    // Salvăm fișierul modificat
    fs.writeFileSync(authFilePath, content, 'utf8');
    console.log('Fișierul auth.js a fost actualizat cu succes!');
  } else {
    console.log('Nu am găsit secvența exactă de text pentru înlocuire.');
  }
} catch (err) {
  console.error('Eroare:', err);
}