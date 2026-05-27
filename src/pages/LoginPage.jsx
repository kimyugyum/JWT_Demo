import { useState } from 'react';
import { ACCOUNTS } from '../utils/data';
import { createToken, parseToken } from '../utils/jwt';
import { Badge, TokenVisualizer } from '../components/UI';

export default function LoginPage({ onLogin }) {
  const [id, setId]         = useState('');
  const [pw, setPw]         = useState('');
  const [error, setError]   = useState('');
  const [token, setToken]   = useState(null);
  const [parsed, setParsed] = useState(null);
  const [copied, setCopied] = useState(false);

  const fill = (uid) => { setId(uid); setPw(ACCOUNTS[uid].pw); setError(''); setToken(null); };

  const login = () => {
    const acc = ACCOUNTS[id];
    if (!acc || acc.pw !== pw) { setError('아이디 또는 비밀번호가 올바르지 않습니다.'); return; }
    setError('');
    const payload = { sub:id, name:acc.name, role:acc.role, iat:Math.floor(Date.now()/1000), exp:Math.floor(Date.now()/1000)+3600 };
    const t = createToken(payload);
    setToken(t); setParsed(parseToken(t));
  };

  const copy = () => { navigator.clipboard.writeText(token); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const proceed = () => onLogin({ token, role:ACCOUNTS[id].role, name:ACCOUNTS[id].name });

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)' }}>

      {/* 좌측 브랜드 */}
      <div style={{ width:'42%', background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:48, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-100, left:-100, width:400, height:400, background:'radial-gradient(circle,rgba(124,109,250,.15) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, right:-60, width:280, height:280, background:'radial-gradient(circle,rgba(255,90,106,.12) 0%,transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ display:'flex', alignItems:'center', gap:10, position:'relative' }}>
          <div style={{ width:38, height:38, background:'var(--accent)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🛒</div>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:20, color:'var(--text)' }}>ShopSecure</span>
        </div>

        <div style={{ position:'relative' }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:50, lineHeight:1.05, letterSpacing:-3, color:'var(--text)', marginBottom:16 }}>
            쇼핑의<br/><span style={{ color:'var(--accent)' }}>새로운</span><br/>기준
          </h1>
          <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.8, maxWidth:300 }}>
            JWT 기반 인증으로 보호되는 가상 쇼핑 플랫폼.<br/>
            <span style={{ color:'var(--danger)' }}>보안 취약점 시연</span>을 위해 제작되었습니다.
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, position:'relative' }}>
          {['JWT 토큰 기반 인증','역할 기반 접근 제어 (RBAC)','alg:none 취약점 포함 (데모)'].map((f,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--muted)' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:i===2?'var(--danger)':'var(--accent)', flexShrink:0 }}/>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* 우측 폼 */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:28, letterSpacing:-0.5, color:'var(--text)', marginBottom:6 }}>로그인</h2>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:32 }}>계정에 접속하세요</p>

          {error && <div style={{ background:'var(--danger-lo)', border:'1px solid rgba(255,90,106,.3)', color:'var(--danger)', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>{error}</div>}

          {[{label:'아이디',value:id,setter:setId,type:'text',ph:'아이디를 입력하세요'},{label:'비밀번호',value:pw,setter:setPw,type:'password',ph:'비밀번호를 입력하세요'}].map(({label,value,setter,type,ph})=>(
            <div key={label} style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:8, fontWeight:500 }}>{label}</label>
              <input type={type} value={value} placeholder={ph} onChange={e=>setter(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}
                onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'}
                style={{ width:'100%', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', fontSize:15, color:'var(--text)', transition:'border-color .2s' }}/>
            </div>
          ))}

          <button onClick={login} style={{ width:'100%', padding:15, background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontFamily:'var(--font-display)', fontSize:15, fontWeight:700 }}>
            로그인
          </button>

          <div style={{ textAlign:'center', color:'var(--muted)', fontSize:12, margin:'20px 0', position:'relative' }}>
            <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'var(--border)' }}/>
            <span style={{ background:'var(--bg)', padding:'0 12px', position:'relative' }}>테스트 계정</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[{uid:'user',label:'일반 유저',badge:'USER',bc:'var(--success)'},{uid:'admin',label:'관리자',badge:'ADMIN',bc:'var(--danger)'}].map(({uid,label,badge,bc})=>(
              <div key={uid} onClick={()=>fill(uid)} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:14, cursor:'pointer' }}
                onMouseOver={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='var(--surface2)'}}
                onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface)'}}>
                <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', marginBottom:6 }}>{uid} / {ACCOUNTS[uid].pw}</div>
                <Badge color={bc}>{badge}</Badge>
              </div>
            ))}
          </div>

          {token && (
            <div style={{ marginTop:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:18 }}>
              <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:10 }}>🔑 발급된 JWT 토큰</div>
              <TokenVisualizer token={token}/>
              {parsed && (
                <div style={{ marginTop:10, padding:10, background:'var(--surface2)', borderRadius:7, fontSize:11 }}>
                  <span style={{ color:'var(--muted)' }}>role: </span>
                  <span style={{ color:parsed.payload.role==='admin'?'var(--danger)':'var(--success)', fontFamily:'var(--font-mono)' }}>"{parsed.payload.role}"</span>
                  <span style={{ color:'var(--muted)', marginLeft:12 }}>alg: </span>
                  <span style={{ color:'var(--text)', fontFamily:'var(--font-mono)' }}>"{parsed.header.alg}"</span>
                </div>
              )}
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button onClick={copy} style={{ flex:1, padding:'8px 0', background:'transparent', border:'1px solid var(--border)', borderRadius:7, color:copied?'var(--success)':'var(--text)', fontSize:12 }}>{copied?'✓ 복사됨':'복사'}</button>
                <button onClick={()=>window.open(`https://jwt.io/#debugger-io?token=${token}`,'_blank')} style={{ flex:1, padding:'8px 0', background:'transparent', border:'1px solid var(--border)', borderRadius:7, color:'var(--text)', fontSize:12 }}>jwt.io →</button>
                <button onClick={proceed} style={{ flex:1, padding:'8px 0', background:'var(--accent)', border:'none', borderRadius:7, color:'#fff', fontSize:12, fontFamily:'var(--font-display)', fontWeight:600 }}>대시보드 →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
