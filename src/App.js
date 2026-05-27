import { useState, useCallback } from 'react';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage     from './pages/AdminPage';
import CVESimulator  from './pages/CVESimulator';

export default function App() {
  const [session, setSession] = useState(null);
  const [view,    setView]    = useState('login');

  const handleLogin = useCallback((sess) => {
    setSession(sess);
    setView(sess.role === 'admin' ? 'admin' : 'user');
  }, []);

  const handleAttackSuccess = useCallback((sess) => {
    setSession(sess);
    setView('admin');
  }, []);

  const handleLogout = useCallback(() => {
    setSession(null);
    setView('login');
  }, []);

  if (view === 'cve') return (
    <div>
      <div style={{ position:'fixed', top:12, right:16, zIndex:999 }}>
        <button onClick={() => setView('login')} style={{
          padding:'6px 14px', background:'rgba(255,255,255,0.08)',
          border:'1px solid rgba(255,255,255,0.15)', borderRadius:7,
          color:'#aaa', fontSize:12, cursor:'pointer', fontFamily:'DM Sans,sans-serif',
        }}>← ShopSecure로 돌아가기</button>
      </div>
      <CVESimulator />
    </div>
  );

  if (view === 'login') return (
    <div>
      <div style={{ position:'fixed', bottom:20, right:20, zIndex:999 }}>
        <button onClick={() => setView('cve')} style={{
          padding:'10px 18px',
          background:'rgba(255,90,106,0.15)',
          border:'1px solid rgba(255,90,106,0.3)',
          borderRadius:10, color:'#ff5a6a',
          fontSize:12, fontWeight:600, cursor:'pointer',
          fontFamily:'Syne,sans-serif',
        }}>
          🔬 CVE-2026-29000 시뮬레이터
        </button>
      </div>
      <LoginPage onLogin={handleLogin} />
    </div>
  );

  if (view === 'user')  return <DashboardPage session={session} onLogout={handleLogout} onAttackSuccess={handleAttackSuccess} />;
  if (view === 'admin') return <AdminPage     session={session} onLogout={handleLogout} />;
}
