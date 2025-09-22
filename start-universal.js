#!/usr/bin/env node

/**
 * Multi-platform startup script pentru React Notificări
 * Detectează OS-ul și rulează scriptul corespunzător
 */

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

function detectPlatform() {
    const platform = os.platform();
    
    switch (platform) {
        case 'win32':
            return 'windows';
        case 'darwin':
            return 'macos';
        case 'linux':
            return 'linux';
        default:
            return 'unix';
    }
}

function runScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`🚀 Rulează script: ${scriptPath}`);
        
        const child = spawn(scriptPath, args, {
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd()
        });
        
        child.on('exit', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });
        
        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function main() {
    console.log('🔧 React Notificări - Multi-platform Startup');
    console.log(`📱 Platform detectat: ${detectPlatform()}`);
    
    const platform = detectPlatform();
    
    try {
        switch (platform) {
            case 'windows':
                // Încearcă PowerShell scripturi
                if (fs.existsSync('CLEAN_START.ps1')) {
                    await runScript('powershell', ['-File', 'CLEAN_START.ps1']);
                } else if (fs.existsSync('START_CLEAN.ps1')) {
                    await runScript('powershell', ['-File', 'START_CLEAN.ps1']);
                } else {
                    throw new Error('Nu s-a găsit niciun script PowerShell pentru Windows');
                }
                break;
                
            case 'macos':
            case 'linux':
            case 'unix':
            default:
                // Folosește bash script
                if (fs.existsSync('start-app.sh')) {
                    await runScript('./start-app.sh');
                } else {
                    throw new Error('Nu s-a găsit start-app.sh pentru Unix/Linux');
                }
                break;
        }
        
        console.log('\n✅ Aplicația a fost pornită cu succes!');
    } catch (error) {
        console.error('\n❌ Eroare la pornirea aplicației:', error.message);
        console.log('\n💡 Încercați să rulați manual:');
        
        if (platform === 'windows') {
            console.log('   • PowerShell: .\\CLEAN_START.ps1');
            console.log('   • Cmd: START_APP.bat');
        } else {
            console.log('   • Bash: ./start-app.sh');
            console.log('   • Manual: cd backend && npm start (într-un terminal)');
            console.log('            apoi: npm start (în alt terminal din root)');
        }
        
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}