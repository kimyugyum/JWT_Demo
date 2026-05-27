import { useState, useRef } from "react";

// ── 디자인 토큰 ──────────────────────────────────────────────
const G = {
  bg:       "#060610",
  surface:  "#0c0c1e",
  surface2: "#12122a",
  border:   "#1e1e3a",
  accent:   "#7c6dfa",
  text:     "#eeeef8",
  muted:    "#5a5a7a",
  success:  "#3dd68c",
  warn:     "#f5a623",
  danger:   "#ff5a6a",
  red:      "#ff6b6b",
  yellow:   "#ffd93d",
  blue:     "#6bceff",
};

// ── 유틸 ─────────────────────────────────────────────────────
const b64url = (obj) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
    .replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── 시뮬레이션 단계 데이터 ────────────────────────────────────
const PHASES = [
  {
    id: "normal",
    title: "정상 요청",
    subtitle: "서버가 SignedJWT를 처리하는 방식",
    color: G.success,
    steps: [
      { actor:"공격자", action:"JWE 생성", detail:`내부: SignedJWT { alg:"RS256", role:"user" }`, color: G.blue },
      { actor:"서버", action:"JWE 복호화 (RSA 개인키)", detail:"→ 내부 토큰 추출", color: G.muted },
      { actor:"서버", action:"SignedJWT 파싱 시도", detail:'result = SignedJWT.parse(innerToken)', color: G.muted },
      { actor:"서버", action:"파싱 결과 확인", detail:'result != null  ✓', color: G.success },
      { actor:"서버", action:"서명 검증", detail:"RSA 공개키로 서명 검증 → 성공", color: G.success },
      { actor:"서버", action:"권한 확인", detail:'role: "user" → 일반 유저 페이지 허용', color: G.success },
    ],
    verdict: { ok: true, msg: "✓ 정상 인증 완료 — 200 OK" },
  },
  {
    id: "attack",
    title: "CVE-2026-29000 공격",
    subtitle: "JWE 안에 PlainJWT(서명 없음)를 숨긴다",
    color: G.danger,
    steps: [
      { actor:"공격자", action:"PlainJWT 생성 (서명 없음)", detail:`{ alg:"none", role:"admin" } — 서명 제거`, color: G.danger },
      { actor:"공격자", action:"JWE로 암호화", detail:"RSA 공개키(공개된 정보)로 PlainJWT를 감쌈", color: G.warn },
      { actor:"공격자", action:"서버에 전송", detail:"겉보기엔 정상적인 암호화 토큰", color: G.warn },
      { actor:"서버", action:"JWE 복호화 (RSA 개인키)", detail:"→ 내부 토큰 추출 성공", color: G.muted },
      { actor:"서버", action:"SignedJWT 파싱 시도", detail:'result = SignedJWT.parse(innerToken)', color: G.muted },
      { actor:"서버", action:"⚠️ 파싱 결과: null!", detail:"PlainJWT라 SignedJWT 객체가 null 반환", color: G.danger },
      { actor:"서버", action:"❌ null 체크 없이 진행", detail:"서명 검증 경로 완전 스킵!", color: G.danger },
      { actor:"서버", action:"클레임으로 프로필 생성", detail:'role: "admin" → 그대로 신뢰 💀', color: G.danger },
      { actor:"서버", action:"관리자 접근 허용", detail:"비밀번호도, 키도, 권한도 없이 관리자!", color: G.red },
    ],
    verdict: { ok: false, msg: "🚨 공격 성공 — 200 OK (관리자 권한 획득)" },
  },
  {
    id: "patch",
    title: "패치 후 방어",
    subtitle: "null 체크 하나로 완전 차단",
    color: G.success,
    steps: [
      { actor:"공격자", action:"동일한 공격 패킷 전송", detail:"JWE 안에 PlainJWT 숨김", color: G.warn },
      { actor:"서버", action:"JWE 복호화", detail:"→ 내부 토큰 추출", color: G.muted },
      { actor:"서버", action:"SignedJWT 파싱 시도", detail:'result = SignedJWT.parse(innerToken)', color: G.muted },
      { actor:"서버", action:"✅ null 체크!", detail:'if (result == null) → 즉시 reject', color: G.success },
      { actor:"서버", action:"요청 거부", detail:"401 Unauthorized — 인증 실패", color: G.success },
    ],
    verdict: { ok: true, msg: "✓ 공격 차단 — 401 Unauthorized" },
  },
];

// ── 토큰 구조 시각화 ──────────────────────────────────────────
function TokenDiagram({ phase }) {
  const isAttack = phase === "attack";
  const isPatch  = phase === "patch";

  return (
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, lineHeight:1.8, wordBreak:"break-all", overflowWrap:"break-word" }}>
      {/* JWE 겉 레이어 */}
      <div style={{
        border:`1px solid ${isAttack||isPatch ? G.warn+"88" : G.blue+"88"}`,
        borderRadius:8, padding:"10px 14px", marginBottom:8,
        background: (isAttack||isPatch) ? G.warn+"08" : G.blue+"08",
      }}>
        <div style={{ color:G.muted, fontSize:10, marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>
          JWE (암호화 외부 레이어)
        </div>
        <span style={{ color:G.yellow }}>eyJhbGciOiJSU0Et...</span>
        <span style={{ color:G.muted }}>.</span>
        <span style={{ color:G.blue }}>eyJlbmMiOiJBMTI4...</span>
        <span style={{ color:G.muted }}>...</span>
        <div style={{ marginTop:6, color:G.muted, fontSize:10 }}>
          RSA 공개키로 암호화 — 겉보기엔 정상
        </div>
      </div>

      {/* 화살표 */}
      <div style={{ textAlign:"center", color:G.muted, marginBottom:8 }}>
        ↓ 복호화 후 내부 토큰
      </div>

      {/* 내부 토큰 */}
      <div style={{
        border:`1px solid ${isAttack||isPatch ? G.danger+"88" : G.success+"88"}`,
        borderRadius:8, padding:"10px 14px",
        background: (isAttack||isPatch) ? G.danger+"08" : G.success+"08",
      }}>
        <div style={{ color:G.muted, fontSize:10, marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>
          내부 토큰 — {isAttack||isPatch ? "PlainJWT (서명 없음!)" : "SignedJWT (서명 있음)"}
        </div>
        <div style={{ marginBottom:4 }}>
          <span style={{ color:G.red }}>
            {b64url({ alg: isAttack||isPatch ? "none" : "RS256", typ:"JWT" }).substring(0,20)}...
          </span>
          <span style={{ color:G.muted }}>.</span>
          <span style={{ color:G.yellow }}>
            {b64url({ sub:"attacker", role: isAttack||isPatch ? "admin" : "user", name:"공격자" }).substring(0,20)}...
          </span>
          <span style={{ color:G.muted }}>.</span>
          <span style={{ color: isAttack||isPatch ? G.danger : G.blue }}>
            {isAttack||isPatch ? "(없음)" : "Rs256Signature..."}
          </span>
        </div>
        <div style={{ fontSize:10, marginTop:4 }}>
          <span style={{ color:G.muted }}>alg: </span>
          <span style={{ color: isAttack||isPatch ? G.danger : G.success, fontWeight:600 }}>
            "{isAttack||isPatch ? "none" : "RS256"}"
          </span>
          <span style={{ color:G.muted, marginLeft:12 }}>role: </span>
          <span style={{ color: isAttack||isPatch ? G.danger : G.success, fontWeight:600 }}>
            "{isAttack||isPatch ? "admin" : "user"}"
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 서버 코드 비교 ────────────────────────────────────────────
function CodeComparison() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
      {[
        {
          label:"❌ 취약한 코드 (pac4j v4.5.8 이하)",
          color: G.danger,
          lines: [
            { t:"JWEObject jwe = JWEObject.parse(token);", c:G.text },
            { t:"jwe.decrypt(decrypter);", c:G.text },
            { t:"SignedJWT signed =", c:G.text },
            { t:'  SignedJWT.parse(', c:G.text },
            { t:"    jwe.getPayload().toString()", c:G.text },
            { t:"  );", c:G.text },
            { t:"// ❌ null 체크 없음!", c:G.danger },
            { t:"signed.verify(verifier);", c:G.text },
            { t:"// signed가 null이면 스킵됨 💀", c:G.danger },
            { t:"buildProfile(signed.getClaims());", c:G.text },
          ],
        },
        {
          label:"✅ 패치된 코드 (pac4j v4.5.9+)",
          color: G.success,
          lines: [
            { t:"JWEObject jwe = JWEObject.parse(token);", c:G.text },
            { t:"jwe.decrypt(decrypter);", c:G.text },
            { t:"SignedJWT signed =", c:G.text },
            { t:'  SignedJWT.parse(', c:G.text },
            { t:"    jwe.getPayload().toString()", c:G.text },
            { t:"  );", c:G.text },
            { t:"// ✅ null 체크 추가!", c:G.success },
            { t:"if (signed == null) {", c:G.success },
            { t:'  throw new Exception("Invalid");', c:G.success },
            { t:"}", c:G.success },
          ],
        },
      ].map(({ label, color, lines }) => (
        <div key={label} style={{ background:G.surface2, borderRadius:8, overflow:"hidden", border:`1px solid ${color}33` }}>
          <div style={{ padding:"8px 14px", background:color+"15", fontSize:11, fontWeight:600, color, borderBottom:`1px solid ${color}22` }}>
            {label}
          </div>
          <div style={{ padding:"12px 14px", fontFamily:"'JetBrains Mono',monospace", fontSize:11, lineHeight:2 }}>
            {lines.map((l, i) => (
              <div key={i} style={{ color:l.c }}>{l.t}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 메인 시뮬레이터 ───────────────────────────────────────────
export default function CVESimulator() {
  const [activePhase, setActivePhase] = useState(0);
  const [running,     setRunning]     = useState(false);
  const [stepIdx,     setStepIdx]     = useState(-1);
  const [done,        setDone]        = useState(false);
  const [showCode,    setShowCode]    = useState(false);
  const logRef = useRef(null);

  const phase = PHASES[activePhase];

  const reset = (idx) => {
    setActivePhase(idx);
    setStepIdx(-1);
    setRunning(false);
    setDone(false);
    setShowCode(false);
  };

  const runSim = async () => {
    if (running) return;
    setRunning(true);
    setStepIdx(-1);
    setDone(false);
    for (let i = 0; i < phase.steps.length; i++) {
      await sleep(750);
      setStepIdx(i);
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }
    await sleep(500);
    setDone(true);
    setRunning(false);
  };

  return (
    <div style={{
      minHeight:"100vh", background:G.bg,
      fontFamily:"'DM Sans',sans-serif", color:G.text,
      padding:"40px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:${G.surface}; }
        ::-webkit-scrollbar-thumb { background:${G.border}; border-radius:2px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 10px rgba(255,90,106,.3)} 50%{box-shadow:0 0 25px rgba(255,90,106,.6)} }
      `}</style>

      {/* 헤더 */}
      <div style={{ marginBottom:36 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <div style={{ padding:"4px 12px", background:G.danger+"22", border:`1px solid ${G.danger}44`, borderRadius:20, fontSize:11, fontWeight:600, color:G.danger }}>
            CVE-2026-29000
          </div>
          <div style={{ padding:"4px 12px", background:G.warn+"22", border:`1px solid ${G.warn}44`, borderRadius:20, fontSize:11, color:G.warn }}>
            CVSS 9.8 CRITICAL
          </div>
          <div style={{ padding:"4px 12px", background:G.surface, border:`1px solid ${G.border}`, borderRadius:20, fontSize:11, color:G.muted }}>
            pac4j-jwt ≤ 4.5.8
          </div>
        </div>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:32, letterSpacing:-1.5, color:G.text, marginBottom:6 }}>
          pac4j JWT 인증 우회 시뮬레이터
        </h1>
        <p style={{ fontSize:14, color:G.muted, lineHeight:1.7, maxWidth:640 }}>
          JWE 안에 PlainJWT를 숨겨 서명 검증을 우회하는 실제 취약점입니다.
          라이브러리 자체는 정상 동작했지만, <span style={{ color:G.danger }}>null 체크 하나</span>를 빠뜨린 로직 실수로 관리자 권한이 탈취됩니다.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:24 }}>

        {/* 좌측: 시나리오 선택 + 토큰 구조 */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, overflow:"hidden", minWidth:0 }}>

          {/* 시나리오 탭 */}
          <div style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:12, padding:16 }}>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:1, color:G.muted, marginBottom:12 }}>시나리오 선택</div>
            {PHASES.map((p, i) => (
              <div key={p.id} onClick={() => reset(i)} style={{
                padding:"12px 14px", borderRadius:8, marginBottom:6, cursor:"pointer",
                background: activePhase===i ? p.color+"18" : "transparent",
                border:`1px solid ${activePhase===i ? p.color+"55" : "transparent"}`,
                transition:"all .2s",
              }}>
                <div style={{ fontSize:13, fontWeight:600, color: activePhase===i ? p.color : G.text, marginBottom:2 }}>
                  {i+1}. {p.title}
                </div>
                <div style={{ fontSize:11, color:G.muted }}>{p.subtitle}</div>
              </div>
            ))}
          </div>

          {/* 토큰 구조 */}
          <div style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:12, padding:16 }}>
            <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:1, color:G.muted, marginBottom:12 }}>토큰 구조</div>
            <TokenDiagram phase={phase.id} />
          </div>
        </div>

        {/* 우측: 시뮬레이션 로그 */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* 실행 헤더 */}
          <div style={{
            background:G.surface, border:`1px solid ${phase.color}44`,
            borderRadius:12, padding:"18px 22px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:phase.color, marginBottom:2 }}>
                {phase.title}
              </div>
              <div style={{ fontSize:13, color:G.muted }}>{phase.subtitle}</div>
            </div>
            <button onClick={runSim} disabled={running} style={{
              padding:"10px 24px",
              background: running ? G.surface2 : phase.color,
              border:"none", borderRadius:8, color:"#fff",
              fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
              cursor: running ? "not-allowed" : "pointer",
              opacity: running ? 0.6 : 1, transition:"all .2s",
            }}>
              {running ? "⏳ 실행 중..." : done ? "↺ 다시 실행" : "▶ 시뮬레이션 실행"}
            </button>
          </div>

          {/* 로그 패널 */}
          <div ref={logRef} style={{
            background:"#050510", border:`1px solid ${G.border}`,
            borderRadius:12, padding:"18px 20px",
            minHeight:360, maxHeight:360, overflowY:"auto",
            fontFamily:"'JetBrains Mono',monospace",
          }}>
            <div style={{ color:G.muted, fontSize:11, marginBottom:12 }}>
              {'// pac4j JwtAuthenticator 처리 흐름'}
            </div>

            {stepIdx === -1 && !running && !done && (
              <div style={{ color:G.muted, fontSize:12, paddingTop:40, textAlign:"center" }}>
                ▶ 시뮬레이션 실행 버튼을 클릭하세요
              </div>
            )}

            {phase.steps.slice(0, stepIdx+1).map((step, i) => (
              <div key={i} style={{
                marginBottom:12, animation:"fadeUp .3s ease",
                paddingBottom:12,
                borderBottom: i < stepIdx ? `1px solid ${G.border}` : "none",
              }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{
                    fontSize:10, fontWeight:600, padding:"1px 8px",
                    borderRadius:4, flexShrink:0,
                    background: step.actor==="서버" ? G.accent+"22" : G.danger+"22",
                    color:       step.actor==="서버" ? G.accent       : G.danger,
                    border:`1px solid ${step.actor==="서버" ? G.accent+"44" : G.danger+"44"}`,
                  }}>{step.actor}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:step.color }}>{step.action}</span>
                </div>
                <div style={{ fontSize:11, color:G.muted, paddingLeft:4, lineHeight:1.6 }}>
                  {step.detail}
                </div>
              </div>
            ))}

            {/* 커서 */}
            {running && (
              <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:4 }}>
                <span style={{ color:G.accent, fontSize:12 }}>›</span>
                <span style={{ display:"inline-block", width:8, height:14, background:G.text, animation:"blink .8s infinite" }}/>
              </div>
            )}
          </div>

          {/* 결과 */}
          {done && (
            <div style={{
              padding:"14px 20px",
              background: phase.verdict.ok ? G.success+"15" : G.danger+"15",
              border:`1px solid ${phase.verdict.ok ? G.success+"44" : G.danger+"44"}`,
              borderRadius:10, fontSize:13, fontWeight:600,
              color: phase.verdict.ok ? G.success : G.danger,
              animation:"fadeUp .3s ease",
              display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <span>{phase.verdict.msg}</span>
              {activePhase === 1 && (
                <button onClick={() => reset(2)} style={{
                  padding:"6px 16px", background:G.success, border:"none",
                  borderRadius:6, color:"#fff", fontSize:12,
                  fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                }}>
                  → 패치 후 확인
                </button>
              )}
            </div>
          )}

          {/* 코드 비교 토글 */}
          <div>
            <button onClick={() => setShowCode(v => !v)} style={{
              width:"100%", padding:"10px 0",
              background:"transparent", border:`1px solid ${G.border}`,
              borderRadius:8, color:G.muted, fontSize:13,
              fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>
              <span>{showCode ? "▲" : "▼"}</span>
              취약 코드 vs 패치 코드 비교 (Java)
            </button>
            {showCode && (
              <div style={{ marginTop:12, animation:"fadeUp .3s ease" }}>
                <CodeComparison />
                <div style={{
                  marginTop:12, padding:"12px 16px",
                  background:G.accent+"12", border:`1px solid ${G.accent}33`,
                  borderRadius:8, fontSize:13, color:G.text, lineHeight:1.7,
                }}>
                  💡 <strong>핵심 교훈:</strong> 암호화(JWE)와 서명(SignedJWT)은 별개입니다.
                  암호화가 됐다고 서명이 검증된 게 아닙니다.
                  라이브러리가 정상 동작해도 <span style={{ color:G.danger }}>로직 한 줄</span>이 빠지면 뚫립니다.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단: alg:none과의 비교 */}
      <div style={{ marginTop:32, background:G.surface, border:`1px solid ${G.border}`, borderRadius:12, padding:24 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:G.text, marginBottom:16 }}>
          📊 alg:none 공격 vs CVE-2026-29000 비교
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
          {[
            { label:"", items:["공격 방식","서명 우회 경로","필요 조건","탐지 난이도","CVSS"] },
            { label:"alg:none (취약점 1)", items:["Header alg를 none으로 변조","서버가 none 허용","유효한 JWT 1개","쉬움","7.5 High"] , color:G.warn },
            { label:"CVE-2026-29000 (더 교묘)", items:["JWE 안에 PlainJWT 숨김","null 체크 로직 누락","RSA 공개키 (공개 정보)","어려움 (암호화 됨)","9.8 Critical"], color:G.danger },
          ].map(({ label, items, color }, ci) => (
            <div key={ci} style={{
              background: ci===0 ? "transparent" : G.surface2,
              borderRadius:8,
              border: ci===0 ? "none" : `1px solid ${color}33`,
            }}>
              {label && (
                <div style={{ padding:"8px 14px", borderBottom:`1px solid ${color}22`, fontSize:12, fontWeight:600, color }}>
                  {label}
                </div>
              )}
              {items.map((item, i) => (
                <div key={i} style={{
                  padding:"10px 14px",
                  borderBottom: i < items.length-1 ? `1px solid ${G.border}` : "none",
                  fontSize:12,
                  color: ci===0 ? G.muted : ci===2 && (i===2||i===3) ? G.danger : G.text,
                  fontWeight: ci===0 ? 400 : ci===2 && i===4 ? 700 : 400,
                }}>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
