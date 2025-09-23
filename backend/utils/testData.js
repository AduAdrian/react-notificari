const database = require('./database');

/**
 * Adaugă date de test pentru demonstrarea funcționalității
 */
function addTestClients() {
    const db = database.read('accounts.json');
    
    // Inițializează clients array dacă nu există
    if (!db.clients) {
        db.clients = [];
    }

    // Calculează date pentru teste
    const today = new Date();
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);
    
    const expired = new Date(today);
    expired.setDate(today.getDate() - 5);

    const testClients = [
        {
            id: Date.now() + 1,
            nrInmatriculare: 'B123TEST',
            nrTelefon: '0756123456',
            valabilitate: '6months',
            optional: 'Client de test - expiră în 3 zile',
            expirationDate: in3Days.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        },
        {
            id: Date.now() + 2,
            nrInmatriculare: 'B456DEMO',
            nrTelefon: '0756987654',
            valabilitate: '1year',
            optional: 'Client demo - expiră în 7 zile',
            expirationDate: in7Days.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        },
        {
            id: Date.now() + 3,
            nrInmatriculare: 'B789VALID',
            nrTelefon: '0756555666',
            valabilitate: '2years',
            optional: 'Client valid - expiră în 30 zile',
            expirationDate: in30Days.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        },
        {
            id: Date.now() + 4,
            nrInmatriculare: 'B111EXPIRED',
            nrTelefon: '0756111222',
            valabilitate: '6months',
            optional: 'Client expirat - a expirat acum 5 zile',
            expirationDate: expired.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system'
        }
    ];

    // Verifică dacă clienții de test există deja
    const existingTestClients = db.clients.filter(client => 
        testClients.some(testClient => testClient.nrInmatriculare === client.nrInmatriculare)
    );

    if (existingTestClients.length === 0) {
        // Adaugă clienții de test
        db.clients.push(...testClients);
        database.write(db, 'accounts.json');
        
        console.log('✅ Date de test adăugate cu succes:');
        testClients.forEach(client => {
            const expirationDate = new Date(client.expirationDate);
            const daysLeft = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
            console.log(`   - ${client.nrInmatriculare}: ${daysLeft > 0 ? `expiră în ${daysLeft} zile` : `expirat cu ${Math.abs(daysLeft)} zile în urmă`}`);
        });
        
        return { success: true, added: testClients.length };
    } else {
        console.log('ℹ️ Datele de test există deja în baza de date');
        return { success: true, added: 0, message: 'Test data already exists' };
    }
}

/**
 * Șterge datele de test
 */
function removeTestClients() {
    const db = database.read('accounts.json');
    
    if (!db.clients) {
        return { success: true, removed: 0 };
    }

    const testClientNumbers = ['B123TEST', 'B456DEMO', 'B789VALID', 'B111EXPIRED'];
    const initialCount = db.clients.length;
    
    db.clients = db.clients.filter(client => 
        !testClientNumbers.includes(client.nrInmatriculare)
    );
    
    const removedCount = initialCount - db.clients.length;
    
    if (removedCount > 0) {
        database.write(db, 'accounts.json');
        console.log(`✅ ${removedCount} clienți de test au fost șterși`);
    }
    
    return { success: true, removed: removedCount };
}

module.exports = {
    addTestClients,
    removeTestClients
};