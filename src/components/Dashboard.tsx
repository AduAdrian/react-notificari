import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

interface Client {
    id: string;
    registrationNumber: string;
    validity: string;
    expirationDate: string;
}

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    // Remove unused state variables - validity and expiration are handled in formData
    const [manualEdit, setManualEdit] = useState(false);

    const [formData, setFormData] = useState({
        registrationNumber: '',
        validity: '6 luni',
        expirationDate: '',
    });

    useEffect(() => {
        if (activeTab === 'clients') {
            fetchClients();
        }
    }, [activeTab]);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/vehicles', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data); // Debugging log
                // Verificăm dacă răspunsul are structura așteptată
                const clientsData = data.success ? data.data : (Array.isArray(data) ? data : []);
                setClients(clientsData); // Setăm direct datele primite
            } else {
                console.error('Failed to fetch clients:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const requestBody: any = {
                registrationNumber: formData.registrationNumber,
                validity: formData.validity,
                expirationDate: formData.validity === 'manual'
                    ? formData.expirationDate
                    : calculateExpirationDate(formData.validity)
            };

            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestBody),
            });
            if (response.ok) {
                const result = await response.json();
                console.log('Client adăugat:', result);
                setFormData({ registrationNumber: '', validity: '6 luni', expirationDate: '' });
                fetchClients(); // Reîncarcă lista după adăugare
            } else {
                const errorData = await response.json();
                console.error('Failed to add client:', errorData);
                alert(`Eroare: ${errorData.error || 'Nu s-a putut adăuga clientul'}`);
            }
        } catch (error) {
            console.error('Error adding client:', error);
            alert('Eroare de rețea. Încearcă din nou.');
        }
    };

    const calculateExpirationDate = (validity: string) => {
        const currentDate = new Date();
        let monthsToAdd = 0;

        switch (validity) {
            case '6 luni':
                monthsToAdd = 6;
                break;
            case '1 an':
                monthsToAdd = 12;
                break;
            case '2 ani':
                monthsToAdd = 24;
                break;
            default:
                return ''; // Pentru cazul 'manual'
        }

        // Creăm o nouă dată pentru a nu modifica data curentă
        const newDate = new Date(currentDate.getTime());
        newDate.setMonth(newDate.getMonth() + monthsToAdd);
        return newDate.toISOString().split('T')[0];
    };

    const handleValidityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValidity = event.target.value;
        const expirationDate = selectedValidity === 'manual' ? '' : calculateExpirationDate(selectedValidity);

        setFormData(prevData => ({
            ...prevData,
            validity: selectedValidity,
            expirationDate: expirationDate
        }));

        setManualEdit(selectedValidity === 'manual');
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleEditClient = async (id: string, updatedData: Partial<Client>) => {
        try {
            const response = await fetch(`/api/vehicles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updatedData),
            });
            if (response.ok) {
                fetchClients();
            } else {
                const errorData = await response.json();
                console.error('Failed to update client:', errorData);
                alert(`Eroare la actualizare: ${errorData.error || 'Nu s-a putut actualiza'}`);
            }
        } catch (error) {
            console.error('Error updating client:', error);
            alert('Eroare de rețea la actualizare.');
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (!window.confirm('Ești sigur că vrei să ștergi acest vehicul?')) {
            return;
        }
        try {
            const response = await fetch(`/api/vehicles/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (response.ok) {
                fetchClients();
            } else {
                const errorData = await response.json();
                console.error('Failed to delete client:', errorData);
                alert(`Eroare la ștergere: ${errorData.error || 'Nu s-a putut șterge'}`);
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
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label htmlFor="registration-number">Număr Înmatriculare:</label>
                                <input
                                    type="text"
                                    id="registration-number"
                                    value={formData.registrationNumber}
                                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                    placeholder="Ex: B123XYZ"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="validity">Valabilitate:</label>
                                <select
                                    id="validity"
                                    value={formData.validity}
                                    onChange={handleValidityChange}
                                >
                                    <option value="6 luni">6 luni</option>
                                    <option value="1 an">1 an</option>
                                    <option value="2 ani">2 ani</option>
                                    <option value="manual">Manual</option>
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
                            <button type="submit" className="add-button">Adaugă</button>
                        </form>

                        {clients.length > 0 ? (
                            <table className="clients-table">
                                <thead>
                                    <tr>
                                        <th>Număr Înmatriculare</th>
                                        <th>Valabilitate</th>
                                        <th>Data Expirării</th>
                                        <th>Acțiuni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client) => (
                                        <tr key={client.id}>
                                            <td>{client.registrationNumber}</td>
                                            <td>{client.validity}</td>
                                            <td>{new Date(client.expirationDate).toLocaleDateString('ro-RO')}</td>
                                            <td>
                                                <button
                                                    className="edit-button"
                                                    onClick={() => handleEditClient(client.id, {
                                                        registrationNumber: client.registrationNumber,
                                                        validity: client.validity,
                                                        expirationDate: client.expirationDate,
                                                    })}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="delete-button"
                                                    onClick={() => handleDeleteClient(client.id)}
                                                >
                                                    Șterge
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-data">Nu există intrări în baza de date</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;