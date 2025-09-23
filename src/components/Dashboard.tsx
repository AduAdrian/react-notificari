import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

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

            <main className="dashboard-main">
                <div className="welcome-message">
                    <h2>Bun venit în aplicația de notificări!</h2>
                    <p>Dashboard-ul tău este pregătit pentru utilizare.</p>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;