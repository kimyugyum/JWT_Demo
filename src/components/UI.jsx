import { b64decode } from '../utils/jwt';

// ─── Badge ────────────────────────────────────────────────────
export function Badge({ children, color = '#3dd68c' }) {
  return (
    <span style={{
      padding:'3px 10px', borderRadius:20,
      fontSize:11, fontWeight:600,
      background:color+'22', color,
      border:`1px solid ${color}44`,
    }}>{children}</span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    delivered:{ label:'✓ 배송 완료', color:'#3dd68c' },
    shipping: { label:'🚚 배송 중',  color:'#f5a623' },
    ordered:  { label:'● 주문 완료', color:'#7c6dfa' },
  };
  const { label, color } = map[status] || map.ordered;
  return <Badge color={color}>{label}</Badge>;
}

// ─── Navbar ───────────────────────────────────────────────────
export function Navbar({ name, role, onLogout }) {
  return (
    <nav style={{
      background:'var(--surface)', borderBottom:'1px solid var(--border)',
      height:60, padding:'0 40px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      position:'sticky', top:0, zIndex:100,
    }}>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18, color:'var(--text)', display:'flex', alignItems:'center', gap:8 }}>
        🛒 ShopSecure
        {role === 'admin' && <span style={{ fontSize:12, color:'var(--danger)', fontFamily:'var(--font-body)', fontWeight:400 }}>관리자 패널</span>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background: role==='admin' ? 'var(--danger)' : 'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', fontFamily:'var(--font-display)' }}>{name?.[0]}</div>
        <span style={{ fontSize:14, color:'var(--muted)' }}>{name}</span>
        <Badge color={role==='admin' ? 'var(--danger)' : 'var(--success)'}>{role==='admin' ? 'ADMIN' : 'USER'}</Badge>
        <button onClick={onLogout} style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--muted)', padding:'6px 14px', borderRadius:7, fontSize:13 }}>로그아웃</button>
      </div>
    </nav>
  );
}

// ─── Card ─────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, ...style }}>
      {children}
    </div>
  );
}

// ─── TokenVisualizer ──────────────────────────────────────────
export function TokenVisualizer({ token }) {
  if (!token) return null;
  const [h, p, s] = token.split('.');
  return (
    <div style={{ fontFamily:'var(--font-mono)', fontSize:11, lineHeight:1.8, wordBreak:'break-all' }}>
      <span style={{ color:'#ff6b6b' }}>{h}</span>
      <span style={{ color:'var(--muted)' }}>.</span>
      <span style={{ color:'#ffd93d' }}>{p}</span>
      <span style={{ color:'var(--muted)' }}>.</span>
      <span style={{ color:'#6bceff' }}>{s || <em style={{ opacity:0.4 }}>(없음)</em>}</span>
    </div>
  );
}

export function TokenDecoder({ token }) {
  if (!token) return null;
  const [h, p, s] = token.split('.');
  const parts = [
    { label:'Header',    color:'#ff6b6b', data: b64decode(h) },
    { label:'Payload',   color:'#ffd93d', data: b64decode(p) },
    { label:'Signature', color:'#6bceff', data: s },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
      {parts.map(({ label, color, data }) => (
        <div key={label} style={{ background:'var(--surface2)', borderRadius:8, padding:14 }}>
          <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color, marginBottom:8, fontWeight:600 }}>{label}</div>
          <pre style={{ fontFamily:'var(--font-mono)', fontSize:11, lineHeight:1.7, color:'var(--text)', whiteSpace:'pre-wrap', wordBreak:'break-all', margin:0 }}>
            {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data||'').substring(0,40)+'...'}
          </pre>
        </div>
      ))}
    </div>
  );
}
