// Script pentru modificarea componentei Login.tsx
const fs = require('fs');
const path = require('path');

// Calea către fișierul Login.tsx
const loginFilePath = path.join(__dirname, 'src', 'components', 'Login.tsx');

try {
  // Citim conținutul fișierului
  let content = fs.readFileSync(loginFilePath, 'utf8');
  
  // Găsim locația unde tratăm răspunsul de autentificare
  const searchText = `            if (data.success) {
                // Salvăm token-ul în localStorage
                localStorage.setItem('token', data.token);

                const userData = {
                    email: data.user.email,
                    name: data.user.name
                };

                onLogin(userData, data.token);
            } else {
                // Afișăm eroarea de la backend
                setErrors({
                    email: data.message || 'Eroare la autentificare. Încercați din nou.'
                });
            }`;
  
  // Text de înlocuire cu verificarea pentru requiresVerification
  const replaceText = `            if (data.success) {
                // Salvăm token-ul în localStorage
                localStorage.setItem('token', data.token);

                const userData = {
                    email: data.user.email,
                    name: data.user.name
                };

                onLogin(userData, data.token);
            } else if (data.requiresVerification) {
                // Redirecționăm către pagina de verificare cu emailul
                window.location.href = \`/verify?email=\${encodeURIComponent(formData.email)}&method=\${data.verificationMethod || 'sms'}\`;
            } else {
                // Afișăm eroarea de la backend
                setErrors({
                    email: data.message || 'Eroare la autentificare. Încercați din nou.'
                });
            }`;
  
  // Înlocuim textul
  if (content.includes(searchText)) {
    content = content.replace(searchText, replaceText);
    
    // Salvăm fișierul modificat
    fs.writeFileSync(loginFilePath, content, 'utf8');
    console.log('Fișierul Login.tsx a fost actualizat cu succes!');
  } else {
    console.log('Nu am găsit secvența exactă de text pentru înlocuire în Login.tsx');
  }
} catch (err) {
  console.error('Eroare:', err);
}