# Componente de Verificare SMS și Email

Această colecție de componente React oferă interfețe moderne și funcționale pentru verificarea prin SMS și email, similare cu imaginea mockup furnizată.

## 📁 Structura Fișierelor

```
src/components/verification/
├── SmsVerification.tsx        # Componentă verificare SMS
├── EmailVerification.tsx     # Componentă verificare Email  
├── VerificationWrapper.tsx   # Wrapper unificat pentru ambele
├── VerificationComponents.css # Stiluri CSS pentru toate componentele
└── index.ts                  # Export-uri centralizate
```

## ✨ Caracteristici

### 🎨 Design Modern
- **UI inspirat din mockup**: Design elegant cu gradient violet și layout card
- **Animații fluide**: Tranziții smooth și feedback vizual
- **Responsive**: Optimizat pentru toate dimensiunile de ecran
- **Accesibilitate**: Support complet pentru screen readers și navigare keyboard

### 🔧 Funcționalități Avansate
- **6 câmpuri pentru cifre**: Input-uri separate pentru fiecare cifră
- **Auto-advance**: Focus automat pe următorul câmp
- **Auto-submit**: Trimite automat când toate cifrele sunt completate
- **Paste support**: Permite lipirea codurilor de 6 cifre
- **Navigare keyboard**: Arrow keys, Backspace, Enter
- **Validare în timp real**: Feedback imediat pentru utilizator
- **Loading states**: Indicatori vizuali pentru operațiuni async

### 🛡️ Siguranță și Robustețe
- **Validare strictă**: Doar cifre 0-9 sunt acceptate
- **Debouncing**: Previne apelurile multiple simultanee
- **Error handling**: Gestionarea erorilor cu mesaje clare
- **TypeScript**: Type safety complet

## 🚀 Utilizare Rapidă

### 1. Import Componente

```tsx
import { SmsVerification, EmailVerification, VerificationWrapper } from './components/verification';
```

### 2. Verificare SMS

```tsx
<SmsVerification
    phoneNumber="+40756596565"
    onVerificationSuccess={async (code) => {
        // Apelează API-ul pentru verificarea codului SMS
        const response = await fetch('/api/auth/verify-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, phone: '+40756596565' })
        });
        
        if (!response.ok) throw new Error('Cod invalid');
        
        // Succes - redirecționează utilizatorul
        navigate('/dashboard');
    }}
    onResendCode={async () => {
        // Retrimitere cod SMS
        await fetch('/api/auth/resend-sms', {
            method: 'POST',
            body: JSON.stringify({ phone: '+40756596565' })
        });
    }}
    onBack={() => navigate('/register')}
/>
```

### 3. Verificare Email

```tsx
<EmailVerification
    email="user@example.com"
    onVerificationSuccess={async (code) => {
        // Apelează API-ul pentru verificarea codului email
        const response = await fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, email: 'user@example.com' })
        });
        
        if (!response.ok) throw new Error('Cod invalid');
        
        // Succes
        navigate('/dashboard');
    }}
    onResendCode={async () => {
        // Retrimitere cod email
        await fetch('/api/auth/resend-email', {
            method: 'POST',
            body: JSON.stringify({ email: 'user@example.com' })
        });
    }}
    onBack={() => navigate('/register')}
/>
```

### 4. Wrapper Unificat (Recomandat)

```tsx
<VerificationWrapper
    method="sms" // sau "email"
    contact="+40756596565" // sau "user@example.com"
    onSuccess={() => {
        // Utilizatorul a fost verificat cu succes
        navigate('/dashboard');
    }}
    onBack={() => navigate('/register')}
/>
```

## 🎯 Props și Interface-uri

### SmsVerification Props

```tsx
interface SmsVerificationProps {
    phoneNumber: string;           // Numărul de telefon formatat (ex: +40756596565)
    onVerificationSuccess: (code: string) => Promise<void>; // Callback succes
    onResendCode: () => Promise<void>;                      // Callback retrimite
    onBack?: () => void;                                    // Callback înapoi (opțional)
    isLoading?: boolean;                                    // Stare loading (opțional)
}
```

### EmailVerification Props

```tsx
interface EmailVerificationProps {
    email: string;                 // Adresa de email
    onVerificationSuccess: (code: string) => Promise<void>; // Callback succes
    onResendCode: () => Promise<void>;                      // Callback retrimite
    onBack?: () => void;                                    // Callback înapoi (opțional)
    isLoading?: boolean;                                    // Stare loading (opțional)
}
```

### VerificationWrapper Props

```tsx
interface VerificationWrapperProps {
    method: 'sms' | 'email';      // Metoda de verificare
    contact: string;              // Telefon sau email
    onSuccess: () => void;        // Callback succes
    onBack?: () => void;          // Callback înapoi (opțional)
}
```

## 🎨 Personalizare CSS

### Variabile CSS Principale

```css
:root {
    --verification-primary: #667eea;
    --verification-secondary: #764ba2;
    --verification-success: #27ae60;
    --verification-error: #e74c3c;
    --verification-border-radius: 12px;
    --verification-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}
```

### Clase CSS Importante

- `.verification-container` - Container principal
- `.verification-card` - Card-ul cu conținutul  
- `.code-input` - Input-urile pentru cifre
- `.verify-button` - Butonul de verificare
- `.error-message` - Mesajele de eroare
- `.loading-spinner` - Spinner-ul de loading

## 🔌 Integrare cu Backend

### Endpoint-uri Necesare

```typescript
// POST /api/auth/verify
{
    "verificationCode": "123456",
    "method": "sms" | "email"
}

// POST /api/auth/resend-code  
{
    "method": "sms" | "email",
    "contact": "+40756596565" | "user@example.com"
}
```

### Răspunsuri Backend

```typescript
// Succes
{
    "success": true,
    "message": "Verificare reușită",
    "user": { /* datele utilizatorului */ }
}

// Eroare
{
    "success": false,
    "message": "Cod de verificare invalid"
}
```

## 📱 Responsive Design

Componentele sunt optimizate pentru:
- **Desktop** (>768px): Layout complet cu toate funcționalitățile
- **Tablet** (480px-768px): Layout adaptat cu dimensiuni reduse
- **Mobile** (<480px): Layout vertical compact

## ♿ Accesibilitate

- **Screen readers**: Suport complet ARIA
- **Navigare keyboard**: Tab, Arrow keys, Enter, Backspace
- **Focus indicators**: Indicatori vizibili pentru focus
- **Labels**: Etichete descriptive pentru toate input-urile

## 🔧 Dezvoltare și Contribuții

### Setup Local

```bash
# Instalează dependențele
npm install

# Pornește aplicația în mod dezvoltare
npm start

# Testează componentele
npm test
```

### Structura de Fișiere pentru Dezvoltare

```
src/components/verification/
├── SmsVerification.tsx        # Componentă SMS principală
├── EmailVerification.tsx     # Componentă Email principală
├── VerificationWrapper.tsx   # Wrapper cu logică API
├── VerificationComponents.css # Stiluri complete
├── index.ts                  # Export-uri
└── __tests__/                # Teste (opțional)
    ├── SmsVerification.test.tsx
    └── EmailVerification.test.tsx
```

## 📞 Support și Contribuții

Pentru întrebări, bug reports sau feature requests, vă rugăm să:

1. Verificați documentația existentă
2. Căutați în issues-urile existente
3. Creați un issue nou cu detalii complete
4. Pentru contribuții, faceți fork și submit pull request

---

**Creat cu ❤️ pentru aplicația React Notificări**