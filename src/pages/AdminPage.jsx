import { useState } from 'react';
import { Navbar, StatusBadge, Badge, Card } from '../components/UI';
import { ALL_ORDERS } from '../utils/data';

export default function AdminPage({ session, onLogout }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const isForged = session.forged;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* 침입 경고 배너 */}
      {isForged && (
        <div style={{ background:'var(--danger-lo)', borderBottom:'1px solid rgba(255,90,106,.3)', padding:'10px 40px', display:'flex', alignItems:'center', gap:12, fontSize:13, color:'var(--danger)' }}>
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
          <span style={{ animation:'blink 1.2s infinite' }}>⚠️</span>
          <strong>보안 경고:</strong> 이 세션은 <code style={{ fontFamily:'var(--font-mono)' }}>alg:none</code> JWT 위조 공격으로 획득된 관리자 권한입니다. (데모)
          <button onClick={()=>setShowEvidence(true)} style={{ marginLeft:'auto', padding:'4px 14px', background:'var(--danger-lo)', border:'1px solid rgba(255,90,106,.4)', color:'var(--danger)', borderRadius:6, fontSize:12, cursor:'pointer' }}>
            공격 분석 보기
          </button>
        </div>
      )}

      <Navbar name={session.name} role="admin" onLogout={onLogout}/>

      <div style={{ display:'flex', minHeight:'calc(100vh - 60px)' }}>

        {/* 사이드바 */}
        <div style={{ width:220, background:'var(--surface)', borderRight:'1px solid var(--border)', padding:'24px 12px', flexShrink:0 }}>
          {[{icon:'📦',label:'전체 주문',active:true},{icon:'👥',label:'회원 관리'},{icon:'📊',label:'매출 통계'},{icon:'⚙️',label:'시스템 설정'}].map(({icon,label,active})=>(
            <div key={label} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, fontSize:14, marginBottom:2, cursor:'pointer', background:active?'var(--accent-lo)':'transparent', color:active?'#a09cff':'var(--muted)' }}>
              {icon} {label}
            </div>
          ))}
          <div style={{ height:1, background:'var(--border)', margin:'14px 0' }}/>
          <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', padding:'0 12px', marginBottom:8 }}>보안</div>
          <div onClick={()=>setShowEvidence(true)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, fontSize:14, cursor:'pointer', color:isForged?'var(--danger)':'var(--muted)', background:isForged?'var(--danger-lo)':'transparent' }}>
            🔍 침입 분석
            {isForged && <span style={{ fontSize:10, background:'var(--danger)', color:'#fff', borderRadius:4, padding:'1px 6px' }}>!</span>}
          </div>
        </div>

        {/* 메인 */}
        <div style={{ flex:1, padding:'36px 40px' }}>
          <div style={{ marginBottom:26 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:24, letterSpacing:-0.5, color:'var(--text)' }}>전체 주문 관리</h1>
            <p style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>
              모든 사용자의 주문 조회
              {isForged && <span style={{ color:'var(--danger)' }}> — ⚠️ JWT 위조를 통한 무단 접근</span>}
            </p>
          </div>

          {/* 스탯 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            {[{label:'전체 주문',value:'1,284'},{label:'오늘 신규',value:'47'},{label:'총 매출',value:'₩48.2M'},{label:'회원 수',value:'3,891'}].map(({label,value})=>(
              <Card key={label} style={{ padding:'16px 18px' }}>
                <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:5 }}>{label}</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'var(--text)' }}>{value}</div>
              </Card>
            ))}
          </div>

          {/* 전체 주문 테이블 */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:14, color:'var(--text)' }}>📋 전체 주문 (모든 유저)</div>
            {isForged && <Badge color="var(--danger)">⚠️ 민감 데이터 무단 열람 중</Badge>}
          </div>
          <Card style={{ overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'130px 90px 1fr 120px 100px 110px', padding:'11px 18px', borderBottom:'1px solid var(--border)', fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)' }}>
              {['주문 번호','유저','상품명','금액','상태','주문일'].map(h=><div key={h}>{h}</div>)}
            </div>
            {ALL_ORDERS.map((o,i)=>(
              <div key={o.id} style={{ display:'grid', gridTemplateColumns:'130px 90px 1fr 120px 100px 110px', padding:'14px 18px', alignItems:'center', borderBottom:i<ALL_ORDERS.length-1?'1px solid var(--border)':'none', fontSize:13, color:'var(--text)' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)' }}>{o.id}</div>
                <div>{o.user}</div>
                <div>{o.product}</div>
                <div>{o.price}</div>
                <div><StatusBadge status={o.status}/></div>
                <div style={{ color:'var(--muted)', fontSize:12 }}>{o.date}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* 침입 분석 모달 */}
      {showEvidence && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, width:'100%', maxWidth:680, padding:30 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--danger)' }}>🔍 alg:none 공격 분석</div>
              <button onClick={()=>setShowEvidence(false)} style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--muted)', width:30, height:30, borderRadius:6, fontSize:14 }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { label:'원본 Payload (일반 유저)', text:`{\n  "sub": "user",\n  "role": "user",   ✓\n  "alg": "HS256"   ✓\n}`, color:'var(--success)' },
                { label:'위조된 Payload (공격자)',  text:`{\n  "sub": "user",\n  "role": "admin",  ← 위조!\n  "alg": "none"    ← 서명 제거!`, color:'var(--danger)' },
                { label:'취약한 서버 검증',         text:`alg 검증:  SKIP (none 허용) ❌\n서명 검증: SKIP ❌\n결과: 관리자 접근 허용 ⚠️`, color:'var(--danger)' },
                { label:'방어된 서버 검증',         text:`alg 검증:  HS256만 허용 ✓\n서명 검증: 실패 → 401 ✓\n결과: 접근 차단 ✓`, color:'var(--success)' },
              ].map(({label,text,color})=>(
                <div key={label} style={{ background:'var(--surface2)', borderRadius:8, padding:16 }}>
                  <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:8 }}>{label}</div>
                  <pre style={{ fontFamily:'var(--font-mono)', fontSize:12, lineHeight:1.7, color, whiteSpace:'pre-wrap', margin:0 }}>{text}</pre>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, padding:14, background:'var(--accent-lo)', borderRadius:8, fontSize:13, color:'var(--text)', lineHeight:1.6 }}>
              💡 <strong>핵심 교훈:</strong> <code style={{ color:'var(--accent)' }}>algorithms: ['HS256']</code> 옵션으로 허용 알고리즘을 명시적으로 지정해야 합니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
