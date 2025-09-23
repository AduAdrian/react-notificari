import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

interface Client {
    id: string;
    nrInmatriculare: string;
    nrTelefon: string;
    valabilitate: string;
    optional?: string;
    expirationDate: string;
    createdAt?: string;
    updatedAt?: string;
}

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [manualEdit, setManualEdit] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterExpiring, setFilterExpiring] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nrInmatriculare: '',
        nrTelefon: '',
        valabilitate: '6months',
        optional: '',
        expirationDate: '',
    });

    useEffect(() => {
        if (activeTab === 'clients') {
            fetchClients();
        }
    }, [activeTab]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/clients', {
                credentials: 'include' // Use session-based auth
            });
            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data); // Debugging log
                // The admin API returns { success: true, clients: [...] }
                const clientsData = data.success ? data.clients : (Array.isArray(data) ? data : []);
                setClients(clientsData || []); 
            } else {
                console.error('Failed to fetch clients:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const requestBody: any = {
                nrInmatriculare: formData.nrInmatriculare,
                nrTelefon: formData.nrTelefon,
                valabilitate: formData.valabilitate,
                optional: formData.optional,
                manualDate: formData.valabilitate === 'manual' ? formData.expirationDate : undefined
            };

            const response = await fetch('/api/admin/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Use session-based auth
                body: JSON.stringify(requestBody),
            });
            if (response.ok) {
                const result = await response.json();
                console.log('Client adăugat:', result);
                setFormData({ 
                    nrInmatriculare: '', 
                    nrTelefon: '', 
                    valabilitate: '6months', 
                    optional: '', 
                    expirationDate: '' 
                });
                setManualEdit(false);
                fetchClients(); // Reîncarcă lista după adăugare
                alert('Client adăugat cu succes!');
            } else {
                const errorData = await response.json();
                console.error('Failed to add client:', errorData);
                alert(`Eroare: ${errorData.message || 'Nu s-a putut adăuga clientul'}`);
            }
        } catch (error) {
            console.error('Error adding client:', error);
            alert('Eroare de rețea. Încearcă din nou.');
        }
    };



    const handleValidityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValidity = event.target.value;
        
        setFormData(prevData => ({
            ...prevData,
            valabilitate: selectedValidity,
            expirationDate: selectedValidity === 'manual' ? '' : ''
        }));

        setManualEdit(selectedValidity === 'manual');
    };

    // Add search and filter functionality
    const filteredClients = clients.filter(client => {
        const matchesSearch = client.nrInmatriculare?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.nrTelefon?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!filterExpiring) return matchesSearch;
        
        // Check if expiring within 7 days
        const expirationDate = new Date(client.expirationDate);
        const today = new Date();
        const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const isExpiringSoon = expirationDate <= sevenDaysFromNow && expirationDate >= today;
        
        return matchesSearch && isExpiringSoon;
    });

    // Function to get expiration status
    const getExpirationStatus = (expirationDate: string) => {
        const expiry = new Date(expirationDate);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { status: 'expired', days: Math.abs(diffDays), className: 'expired' };
        if (diffDays <= 7) return { status: 'expiring', days: diffDays, className: 'expiring-soon' };
        return { status: 'valid', days: diffDays, className: 'valid' };
    };

    // Function to format validity label  
    const getValidityLabel = (valabilitate: string) => {
        switch (valabilitate) {
            case '6months': return '6 luni';
            case '1year': return '1 an';
            case '2years': return '2 ani';
            case 'manual': return 'Manual';
            default: return valabilitate;
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleEditClient = async (id: string, updatedData: Partial<Client>) => {
        try {
            const response = await fetch(`/api/admin/clients/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Use session-based auth
                body: JSON.stringify(updatedData),
            });
            if (response.ok) {
                fetchClients();
                alert('Client actualizat cu succes!');
            } else {
                const errorData = await response.json();
                console.error('Failed to update client:', errorData);
                alert(`Eroare la actualizare: ${errorData.message || 'Nu s-a putut actualiza'}`);
            }
        } catch (error) {
            console.error('Error updating client:', error);
            alert('Eroare de rețea la actualizare.');
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (!window.confirm('Ești sigur că vrei să ștergi acest client?')) {
            return;
        }
        try {
            const response = await fetch(`/api/admin/clients/${id}`, {
                method: 'DELETE',
                credentials: 'include', // Use session-based auth
            });
            if (response.ok) {
                fetchClients();
                alert('Client șters cu succes!');
            } else {
                const errorData = await response.json();
                console.error('Failed to delete client:', errorData);
                alert(`Eroare la ștergere: ${errorData.message || 'Nu s-a putut șterge'}`);
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Eroare de rețea la ștergere.');
        }
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Dashboard</h1>
                    <div className="user-info">
                        <span className="welcome-text">Bună ziua, {user?.firstName} {user?.lastName}!</span>
                        <button onClick={logout} className="logout-button">
                            Deconectare
                        </button>
                    </div>
                </div>
            </header>

            <nav className="dashboard-nav">
                <button
                    onClick={() => handleTabChange('dashboard')}
                    className={activeTab === 'dashboard' ? 'active' : ''}
                >
                    Dashboard
                </button>
                <button
                    onClick={() => handleTabChange('clients')}
                    className={activeTab === 'clients' ? 'active' : ''}
                >
                    Clienți
                </button>
            </nav>

            <main className="dashboard-main">
                {activeTab === 'dashboard' && (
                    <div className="welcome-message">
                        <h2>Bun venit în aplicația de notificări!</h2>
                        <p>Dashboard-ul tău este pregătit pentru utilizare.</p>
                    </div>
                )}

                {activeTab === 'clients' && (
                    <div className="clients-section">
                        <h2>Gestionare Clienți</h2>
                        
                        {/* Client Form */}
                        <form onSubmit={handleFormSubmit} className="client-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="registration-number">Număr Înmatriculare:</label>
                                    <input
                                        type="text"
                                        id="registration-number"
                                        value={formData.nrInmatriculare}
                                        onChange={(e) => setFormData({ ...formData, nrInmatriculare: e.target.value.toUpperCase() })}
                                        placeholder="B123ABC"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone-number">Număr Telefon:</label>
                                    <input
                                        type="tel"
                                        id="phone-number"
                                        value={formData.nrTelefon}
                                        onChange={(e) => setFormData({ ...formData, nrTelefon: e.target.value })}
                                        placeholder="0756596565"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="validity">Valabilitate:</label>
                                    <select
                                        id="validity"
                                        value={formData.valabilitate}
                                        onChange={handleValidityChange}
                                        className="validity-select"
                                    >
                                        <option value="6months">6 luni</option>
                                        <option value="1year">1 an</option>
                                        <option value="2years">2 ani</option>
                                        <option value="manual">Manual (Deblocat)</option>
                                    </select>
                                </div>
                                {manualEdit && (
                                    <div className="form-group">
                                        <label htmlFor="expiration-date">Data Expirării:</label>
                                        <input
                                            type="date"
                                            id="expiration-date"
                                            value={formData.expirationDate}
                                            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label htmlFor="optional">Notițe opționale:</label>
                                    <input
                                        type="text"
                                        id="optional"
                                        value={formData.optional}
                                        onChange={(e) => setFormData({ ...formData, optional: e.target.value })}
                                        placeholder="Informații suplimentare..."
                                    />
                                </div>
                            </div>
                            <button type="submit" className="add-button">
                                ➕ Adaugă Client
                            </button>
                        </form>

                        {/* Search and Filter Controls */}
                        <div className="database-controls">
                            <h3>📋 Baza de Date Clienți ({filteredClients.length})</h3>
                            <div className="controls-row">
                                <div className="search-group">
                                    <input
                                        type="text"
                                        placeholder="🔍 Caută după număr înmatriculare sau telefon..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                <div className="filter-group">
                                    <label className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filterExpiring}
                                            onChange={(e) => setFilterExpiring(e.target.checked)}
                                        />
                                        ⚠️ Afișează doar cele care expiră în 7 zile
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Database Display Table */}
                        {loading ? (
                            <div className="loading">Se încarcă datele...</div>
                        ) : filteredClients.length > 0 ? (
                            <div className="database-display">
                                <table className="clients-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Număr Înmatriculare</th>
                                            <th>Număr Telefon</th>
                                            <th>Valabilitate</th>
                                            <th>Data Expirării</th>
                                            <th>Status</th>
                                            <th>Notițe</th>
                                            <th>Data Creării</th>
                                            <th>Acțiuni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClients.map((client) => {
                                            const expStatus = getExpirationStatus(client.expirationDate);
                                            return (
                                                <tr key={client.id} className={expStatus.className}>
                                                    <td>{client.id}</td>
                                                    <td className="registration-number">{client.nrInmatriculare}</td>
                                                    <td>{client.nrTelefon}</td>
                                                    <td>{getValidityLabel(client.valabilitate)}</td>
                                                    <td>{new Date(client.expirationDate).toLocaleDateString('ro-RO')}</td>
                                                    <td>
                                                        <span className={`status-badge ${expStatus.className}`}>
                                                            {expStatus.status === 'expired' ? `❌ Expirat (${expStatus.days} zile)` :
                                                             expStatus.status === 'expiring' ? `⚠️ Expiră în ${expStatus.days} zile` :
                                                             `✅ Valabil (${expStatus.days} zile)`}
                                                        </span>
                                                    </td>
                                                    <td>{client.optional || '-'}</td>
                                                    <td>{client.createdAt ? new Date(client.createdAt).toLocaleDateString('ro-RO') : '-'}</td>
                                                    <td>
                                                        <button
                                                            className="edit-button"
                                                            onClick={() => handleEditClient(client.id, client)}
                                                            title="Editează client"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="delete-button"
                                                            onClick={() => handleDeleteClient(client.id)}
                                                            title="Șterge client"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-data">
                                {searchTerm || filterExpiring ? 
                                    `📭 Nu s-au găsit clienți pentru criteriile de căutare` :
                                    `📝 Nu există clienți înregistrați în baza de date`
                                }
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;