// Script pentru modificarea rutei de login - versiunea finală
const fs = require('fs');
const path = require('path');

// Calea către fișierul auth.js
const authFilePath = path.join(__dirname, 'routes', 'auth.js');

try {
  // Citim conținutul fișierului
  let content = fs.readFileSync(authFilePath, 'utf8');
  
  // Text de căutare - după verificarea parolei
  const searchText = "        // Verifică dacă contul este activ și verificat";
  
  // Găsim poziția
  const position = content.indexOf(searchText);
  
  if (position !== -1) {
    // Separam verificarea isActive și isVerified
    const updatedText = "        // Verifică dacă contul este activ";
    content = content.replace(searchText, updatedText);
    
    // Găsim secțiunea cu if (!user.isActive) {
    const isActiveStart = content.indexOf("if (!user.isActive) {", position);
    
    if (isActiveStart !== -1) {
      // Găsim sfârșitul blocului if (!user.isActive)
      const isActiveEnd = content.indexOf("}", isActiveStart) + 1;
      
      // Verificăm dacă există deja o verificare pentru isVerified
      const verificationCheckText = `
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
      
      // Adăugăm verificarea după blocul if (!user.isActive)
      const updatedContent = content.substring(0, isActiveEnd) + 
                           verificationCheckText + 
                           content.substring(isActiveEnd);
      
      // Salvăm fișierul modificat
      fs.writeFileSync(authFilePath, updatedContent, 'utf8');
      console.log('Fișierul auth.js a fost actualizat cu succes!');
    } else {
      console.log('Nu am găsit verificarea pentru isActive');
    }
  } else {
    console.log('Nu am găsit textul de referință în fișier');
  }
} catch (err) {
  console.error('Eroare:', err);
}