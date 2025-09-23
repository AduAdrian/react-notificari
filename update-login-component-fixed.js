// Script pentru modificarea componentei Login.tsx - versiune actualizată
const fs = require('fs');
const path = require('path');

// Calea către fișierul Login.tsx
const loginFilePath = path.join(__dirname, 'src', 'components', 'Login.tsx');

try {
  // Citim conținutul fișierului
  let content = fs.readFileSync(loginFilePath, 'utf8');
  
  // Căutăm start și end pentru blocul else
  const successIfStart = content.indexOf('if (data.success) {');
  if (successIfStart === -1) {
    console.log('Nu am găsit blocul if (data.success)');
    process.exit(1);
  }
  
  // Găsim poziția blocului else
  const elseStart = content.indexOf('} else {', successIfStart);
  if (elseStart === -1) {
    console.log('Nu am găsit blocul else');
    process.exit(1);
  }
  
  // Inserăm blocul else if pentru verificare între if și else
  const insertText = `} else if (data.requiresVerification) {
                // Redirecționăm către pagina de verificare cu emailul
                window.location.href = \`/verify?email=\${encodeURIComponent(formData.email)}&method=\${data.verificationMethod || 'sms'}\`;`;
  
  // Cream conținutul actualizat
  const updatedContent = 
    content.substring(0, elseStart) + 
    insertText + 
    content.substring(elseStart);
  
  // Salvăm fișierul modificat
  fs.writeFileSync(loginFilePath, updatedContent, 'utf8');
  console.log('Fișierul Login.tsx a fost actualizat cu succes!');
} catch (err) {
  console.error('Eroare:', err);
}