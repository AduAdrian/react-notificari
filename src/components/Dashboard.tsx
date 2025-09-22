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
                        <span className="welcome-text">Bună ziua, {user?.name}!</span>
                        <button onClick={logout} className="logout-button">
                            Deconectare
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>Notificări</h3>
                        <p>Gestionează notificările tale</p>
                        <div className="card-stats">
                            <span className="stat-number">5</span>
                            <span className="stat-label">Active</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Mesaje</h3>
                        <p>Vezi mesajele recente</p>
                        <div className="card-stats">
                            <span className="stat-number">12</span>
                            <span className="stat-label">Noi</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Setări</h3>
                        <p>Configurează aplicația</p>
                        <div className="card-stats">
                            <span className="stat-number">3</span>
                            <span className="stat-label">Opțiuni</span>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Profil</h3>
                        <p>Gestionează profilul tău</p>
                        <div className="card-stats">
                            <span className="stat-number">{user?.email}</span>
                            <span className="stat-label">Email</span>
                        </div>
                    </div>
                </div>

                <div className="recent-activity">
                    <h3>Activitate recentă</h3>
                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-icon">📧</div>
                            <div className="activity-content">
                                <p>Ai primit o notificare nouă</p>
                                <span className="activity-time">Acum 5 minute</span>
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-icon">👤</div>
                            <div className="activity-content">
                                <p>Profil actualizat cu succes</p>
                                <span className="activity-time">Acum 1 oră</span>
                            </div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-icon">⚙️</div>
                            <div className="activity-content">
                                <p>Setări modificate</p>
                                <span className="activity-time">Ieri</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;