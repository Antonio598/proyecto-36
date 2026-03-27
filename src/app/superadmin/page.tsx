'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AccountStats {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
  _count: {
    subaccounts: number;
    patients: number;
    users: number;
  };
}

interface GlobalStats {
  totalAccounts: number;
  totalSubaccounts: number;
  totalUsers: number;
  totalAppointments: number;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountStats[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAccountName, setNewAccountName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const session = localStorage.getItem('med_session');
    if (!session) { router.replace('/login'); return; }
    let parsed: any;
    try { parsed = JSON.parse(session); } catch { router.replace('/login'); return; }
    if (parsed?.role !== 'SUPERADMIN') { router.replace('/'); return; }

    const res = await fetch('/api/superadmin/accounts', {
      headers: { 'x-superadmin-id': parsed.id },
    });
    if (!res.ok) { router.replace('/'); return; }
    const data = await res.json();
    setAccounts(data.data.accounts);
    setStats(data.data.stats);
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createAccount = async () => {
    if (!newAccountName.trim()) return;
    setCreating(true);
    setError(null);
    const session = localStorage.getItem('med_session');
    const parsed = session ? JSON.parse(session) : null;
    const res = await fetch('/api/superadmin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-superadmin-id': parsed?.id ?? '' },
      body: JSON.stringify({ name: newAccountName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewAccountName('');
      fetchData();
    } else {
      setError(data.error || 'Error al crear cuenta');
    }
    setCreating(false);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="sa-loading">
        <div className="sa-spinner" />
      </div>
    );
  }

  return (
    <div className="sa-root">
      {/* Header */}
      <header className="sa-header">
        <div className="sa-header-inner">
          <div className="sa-logo">
            <span className="sa-logo-icon">⚡</span>
            <span className="sa-logo-text">Super Admin</span>
          </div>
          <button
            className="sa-logout"
            onClick={() => { localStorage.removeItem('med_session'); router.replace('/login'); }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="sa-main">
        {/* Stats */}
        <section className="sa-stats-grid">
          {[
            { label: 'Cuentas', value: stats?.totalAccounts ?? 0, icon: '🏢', color: 'purple' },
            { label: 'Sedes', value: stats?.totalSubaccounts ?? 0, icon: '🏥', color: 'blue' },
            { label: 'Usuarios', value: stats?.totalUsers ?? 0, icon: '👤', color: 'green' },
            { label: 'Citas totales', value: stats?.totalAppointments ?? 0, icon: '📅', color: 'orange' },
          ].map((s) => (
            <div key={s.label} className={`sa-stat-card sa-stat-${s.color}`}>
              <span className="sa-stat-icon">{s.icon}</span>
              <div>
                <p className="sa-stat-value">{s.value.toLocaleString()}</p>
                <p className="sa-stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Create Account */}
        <section className="sa-section">
          <h2 className="sa-section-title">Crear nueva cuenta</h2>
          <div className="sa-create-row">
            <input
              className="sa-input"
              placeholder="Nombre de la empresa / clínica..."
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createAccount()}
            />
            <button className="sa-btn-primary" onClick={createAccount} disabled={creating}>
              {creating ? 'Creando...' : '+ Crear'}
            </button>
          </div>
          {error && <p className="sa-error">{error}</p>}
        </section>

        {/* Accounts Table */}
        <section className="sa-section">
          <h2 className="sa-section-title">Cuentas registradas ({accounts.length})</h2>
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>API Key (para n8n)</th>
                  <th>Sedes</th>
                  <th>Usuarios</th>
                  <th>Pacientes</th>
                  <th>Creada</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr><td colSpan={6} className="sa-empty">No hay cuentas registradas aún.</td></tr>
                ) : accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="sa-td-name">{acc.name}</td>
                    <td>
                      <div className="sa-apikey-cell">
                        <code className="sa-apikey">{acc.apiKey}</code>
                        <button
                          className="sa-copy-btn"
                          onClick={() => copyKey(acc.apiKey)}
                          title="Copiar API Key"
                        >
                          {copied === acc.apiKey ? '✅' : '📋'}
                        </button>
                      </div>
                    </td>
                    <td className="sa-td-center">{acc._count.subaccounts}</td>
                    <td className="sa-td-center">{acc._count.users}</td>
                    <td className="sa-td-center">{acc._count.patients}</td>
                    <td className="sa-td-date">
                      {new Date(acc.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0f1a; }
        .sa-loading {
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; background: #0f0f1a;
        }
        .sa-spinner {
          width: 40px; height: 40px; border-radius: 50%;
          border: 3px solid #2a2a4a; border-top-color: #7c3aed;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .sa-root { min-height: 100vh; background: #0f0f1a; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; }

        .sa-header {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          border-bottom: 1px solid rgba(124,58,237,0.3);
          padding: 0 24px;
          position: sticky; top: 0; z-index: 50;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .sa-header-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
        }
        .sa-logo { display: flex; align-items: center; gap: 10px; }
        .sa-logo-icon { font-size: 22px; }
        .sa-logo-text { font-size: 20px; font-weight: 700; color: #a78bfa; letter-spacing: -0.5px; }

        .sa-logout {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5; padding: 8px 16px; border-radius: 8px;
          cursor: pointer; font-size: 13px; transition: all 0.2s;
        }
        .sa-logout:hover { background: rgba(239,68,68,0.2); }

        .sa-main { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }

        .sa-stats-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px; margin-bottom: 32px;
        }
        .sa-stat-card {
          background: #1a1a2e; border-radius: 16px;
          padding: 24px; display: flex; align-items: center; gap: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .sa-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
        .sa-stat-purple { border-top: 2px solid #7c3aed; }
        .sa-stat-blue   { border-top: 2px solid #2563eb; }
        .sa-stat-green  { border-top: 2px solid #16a34a; }
        .sa-stat-orange { border-top: 2px solid #ea580c; }
        .sa-stat-icon { font-size: 28px; }
        .sa-stat-value { font-size: 28px; font-weight: 800; line-height: 1.1; color: #f1f5f9; }
        .sa-stat-label { font-size: 13px; color: #94a3b8; margin-top: 2px; }

        .sa-section { margin-bottom: 28px; }
        .sa-section-title { font-size: 18px; font-weight: 600; color: #c4b5fd; margin-bottom: 16px; }

        .sa-create-row { display: flex; gap: 12px; }
        .sa-input {
          flex: 1; background: #1a1a2e; border: 1px solid rgba(124,58,237,0.3);
          border-radius: 10px; padding: 11px 16px; color: #f1f5f9;
          font-size: 15px; outline: none; transition: border-color 0.2s;
        }
        .sa-input:focus { border-color: #7c3aed; }
        .sa-input::placeholder { color: #64748b; }

        .sa-btn-primary {
          background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white;
          border: none; border-radius: 10px; padding: 11px 24px;
          font-size: 15px; font-weight: 600; cursor: pointer; white-space: nowrap;
          transition: all 0.2s; box-shadow: 0 4px 14px rgba(124,58,237,0.4);
        }
        .sa-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.5); }
        .sa-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .sa-error { color: #f87171; font-size: 13px; margin-top: 8px; }

        .sa-table-wrap {
          background: #1a1a2e; border-radius: 16px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .sa-table { width: 100%; border-collapse: collapse; }
        .sa-table thead tr {
          background: rgba(124,58,237,0.15);
          border-bottom: 1px solid rgba(124,58,237,0.3);
        }
        .sa-table th {
          text-align: left; padding: 14px 16px;
          font-size: 12px; font-weight: 600; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .sa-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .sa-table tbody tr:hover { background: rgba(124,58,237,0.06); }
        .sa-table tbody tr:last-child { border-bottom: none; }
        .sa-table td { padding: 14px 16px; font-size: 14px; color: #cbd5e1; }

        .sa-td-name { color: #f1f5f9; font-weight: 500; }
        .sa-td-center { text-align: center; }
        .sa-td-date { color: #64748b; font-size: 13px; }

        .sa-apikey-cell { display: flex; align-items: center; gap: 8px; }
        .sa-apikey {
          background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
          padding: 4px 8px; border-radius: 6px; font-size: 11px; color: #a78bfa;
          font-family: monospace; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .sa-copy-btn {
          background: none; border: none; cursor: pointer; font-size: 15px;
          padding: 2px; border-radius: 4px; transition: transform 0.1s;
        }
        .sa-copy-btn:hover { transform: scale(1.2); }

        .sa-empty { text-align: center; color: #475569; padding: 32px !important; }
      `}</style>
    </div>
  );
}
