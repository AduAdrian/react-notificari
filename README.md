# 🔐 React Notificări - Sistem de Autentificare cu Verificare 2FA

Aplicație React cu backend Node.js pentru autentificare securizată folosind verificare în 2 pași prin **email real SMTP** și **SMS real**.

## ⚡ START RAPID - UN SINGUR CLICK!

**Pentru a porni aplicația complet curățată cu doar 1 frontend și 1 backend:**

```powershell
.\CLEAN_START.ps1
```

### 🧹 Script de Curățare Automată

Acest script **CLEAN_START.ps1** face următoarele automat:

1. **Oprește toate procesele** Node.js, npm care pot ocupa porturile
2. **Curață cache-ul** npm și fișierele temporare  
3. **Verifică dependențele** și le instalează dacă lipsesc
4. **Pornește DOAR 1 backend** pe portul 3001
5. **Pornește DOAR 1 frontend** pe portul 3000
6. **Rulează teste automate** pentru validare
7. **Deschide browser-ul** automat la aplicație

### 📋 Opțiuni Script

```powershell
# Pornire standard cu teste
.\CLEAN_START.ps1

# Pornire fără teste (mai rapid)
.\CLEAN_START.ps1 -SkipTests

# Pornire cu output detaliat
.\CLEAN_START.ps1 -Verbose

# Combinat
.\CLEAN_START.ps1 -SkipTests -Verbose
```

### 🛑 Oprire Rapidă

```powershell
# Oprește toate procesele Node.js/npm
Get-Process node,npm -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 🔧 Servicii Reale Configurate

- **📧 Email SMTP**: noreply@misedainspectsrl.ro (mail.misedainspectsrl.ro:465)
- **📱 SMS API**: smsadvert.ro cu token JWT valid
- **🔐 JWT Authentication**: Tokeni securizați pentru sesiuni
- **📊 Database**: Stocare JSON pentru utilizatori

### 🎯 Linkuri Aplicație

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
