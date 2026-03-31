'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AccountStats {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
  maxSubaccounts: number | null;
  _count: { subaccounts: number; patients: number; users: number; appointments: number; services: number };
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
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string>('');

  const fetchData = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/superadmin/accounts', {
        headers: { 'x-superadmin-id': id },
      });
      if (!res.ok) { 
        setError('Error al cargar la información del servidor. Intenta reiniciar el servidor.');
        setLoading(false);
        return; 
      }
      const data = await res.json();
      setAccounts(data.data.accounts);
      setStats(data.data.stats);
      setLoading(false);
    } catch (err) {
      setError('Error de conexión.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem('med_session');
    if (!raw) { router.replace('/login'); return; }
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { router.replace('/login'); return; }
    if (parsed?.role !== 'SUPERADMIN') { router.replace('/'); return; }
    setAdminId(parsed.id);
    fetchData(parsed.id);
  }, [fetchData, router]);

  const createAccount = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }
    setCreating(true);
    setError(null);
    const res = await fetch('/api/superadmin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-superadmin-id': adminId },
      body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), password: newPassword }),
    });
    const data = await res.json();
    if (res.ok) { setNewName(''); setNewEmail(''); setNewPassword(''); fetchData(adminId); }
    else setError(data.error || 'Error al crear cuenta');
    setCreating(false);
  };

  const deleteAccount = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta "${name}" y todos sus datos?`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/superadmin/accounts/${id}`, {
      method: 'DELETE',
      headers: { 'x-superadmin-id': adminId },
    });
    if (res.ok) {
      fetchData(adminId);
    } else {
      const data = await res.json();
      alert(data.error || 'Error al eliminar la cuenta');
    }
    setDeletingId(null);
  };

  const changeLimit = async (id: string, currentLimit: number | null) => {
    const newVal = prompt('Ingresa el límite máximo de sedes permitidas (o deja en blanco para ilimitado):', currentLimit !== null ? String(currentLimit) : '');
    if (newVal === null) return;
    
    const parsed = newVal.trim() === '' ? null : parseInt(newVal.trim(), 10);
    if (newVal.trim() !== '' && isNaN(parsed as number)) {
      alert('Por favor ingresa un número válido o deja en blanco');
      return;
    }

    const res = await fetch(`/api/superadmin/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-superadmin-id': adminId },
      body: JSON.stringify({ maxSubaccounts: parsed }),
    });

    if (res.ok) fetchData(adminId);
    else alert('Error al actualizar el límite');
  };

  const copy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const logout = () => { localStorage.removeItem('med_session'); router.replace('/login'); };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="sa-spin" />
      <style>{`.sa-spin{width:40px;height:40px;border-radius:50%;border:3px solid #1e1b4b;border-top-color:#7c3aed;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const statCards = [
    { label: 'Cuentas', value: stats?.totalAccounts ?? 0, icon: '🏢', grad: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
    { label: 'Sedes', value: stats?.totalSubaccounts ?? 0, icon: '🏥', grad: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
    { label: 'Usuarios', value: stats?.totalUsers ?? 0, icon: '👤', grad: 'linear-gradient(135deg,#059669,#047857)' },
    { label: 'Citas totales', value: stats?.totalAppointments ?? 0, icon: '📅', grad: 'linear-gradient(135deg,#ea580c,#c2410c)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e2e8f0', fontFamily: 'Inter,system-ui,sans-serif' }}>
      {/* ─ Header ─ */}
      <header style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderBottom: '1px solid rgba(124,58,237,.25)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 24px rgba(0,0,0,.5)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#a78bfa', letterSpacing: '-0.5px' }}>Super Admin</div>
              <div style={{ fontSize: 11, color: '#6366f1', marginTop: -2 }}>Panel de Control Global</div>
            </div>
          </div>
          <button onClick={logout} style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5', padding: '8px 18px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>
        {/* ─ Stats ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 36 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: '#12122a', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 18, border: '1px solid rgba(255,255,255,.06)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, boxShadow: '0 8px 20px rgba(0,0,0,.4)' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: '#f8fafc' }}>{s.value.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─ Create Account ─ */}
        <div style={{ background: '#12122a', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid rgba(124,58,237,.2)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#c4b5fd', marginBottom: 14 }}>➕ Crear nueva cuenta</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nombre de la empresa / clínica..."
              style={{ flex: 1, minWidth: '200px', background: '#0a0a14', border: '1px solid rgba(124,58,237,.3)', borderRadius: 10, padding: '11px 16px', color: '#f1f5f9', fontSize: 15, outline: 'none' }}
            />
            <input
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              type="email"
              placeholder="Correo del administrador..."
              style={{ flex: 1, minWidth: '200px', background: '#0a0a14', border: '1px solid rgba(124,58,237,.3)', borderRadius: 10, padding: '11px 16px', color: '#f1f5f9', fontSize: 15, outline: 'none' }}
            />
            <input
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              type="password"
              placeholder="Contraseña..."
              onKeyDown={e => e.key === 'Enter' && createAccount()}
              style={{ flex: 1, minWidth: '200px', background: '#0a0a14', border: '1px solid rgba(124,58,237,.3)', borderRadius: 10, padding: '11px 16px', color: '#f1f5f9', fontSize: 15, outline: 'none' }}
            />
            <button
              onClick={createAccount}
              disabled={creating}
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(124,58,237,.4)', opacity: creating ? 0.6 : 1 }}
            >
              {creating ? 'Creando...' : '+ Crear'}
            </button>
          </div>
          {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>

        {/* ─ Accounts Table ─ */}
        <div style={{ background: '#12122a', borderRadius: 16, border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(124,58,237,.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#c4b5fd' }}>🏢 Cuentas registradas</h2>
            <span style={{ background: 'rgba(124,58,237,.15)', color: '#a78bfa', borderRadius: 20, padding: '3px 12px', fontSize: 13, fontWeight: 700 }}>{accounts.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(124,58,237,.08)' }}>
                  {['Cuenta', 'API Key (para n8n)', 'Sedes', 'Citas', 'Pacientes', 'Servicios', 'Usuarios', 'Creada', 'Acciones'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: '#475569', fontSize: 14 }}>
                      No hay cuentas registradas aún.<br />
                      <span style={{ fontSize: 12, color: '#334155', marginTop: 4, display: 'block' }}>Usa el formulario de arriba para crear la primera cuenta.</span>
                    </td>
                  </tr>
                ) : accounts.map((acc, i) => (
                  <tr key={acc.id} style={{ borderTop: '1px solid rgba(255,255,255,.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{acc.name}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.08)', padding: '3px 8px', borderRadius: 6, fontSize: 11, color: '#a78bfa', fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {acc.apiKey}
                        </code>
                        <button onClick={() => copy(acc.apiKey)} title="Copiar" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2 }}>
                          {copied === acc.apiKey ? '✅' : '📋'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {acc._count.subaccounts} / {acc.maxSubaccounts !== null ? acc.maxSubaccounts : '∞'}
                        <button onClick={() => changeLimit(acc.id, acc.maxSubaccounts)} title="Cambiar límite de sedes" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, opacity: 0.7, padding: 0 }}>✏️</button>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>{acc._count.appointments || 0}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>{acc._count.patients}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>{acc._count.services || 0}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>{acc._count.users}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                      {new Date(acc.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button 
                        onClick={() => deleteAccount(acc.id, acc.name)}
                        disabled={deletingId === acc.id}
                        style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {deletingId === acc.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
