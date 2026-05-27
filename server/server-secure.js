// ✅  server-secure.js — 방어된 JWT 서버 (파트 5 비교용)

const express = require('express');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');

const app    = express();
const PORT   = 3002;

// ✅ 취약점 2 방어: 충분히 긴 랜덤 시크릿 키
const SECRET = 'f3a9c2e1d847b056f3a9c2e1d847b056f3a9c2e1d847b056f3a9c2e1d847b056';

// ✅ 허용할 알고리즘 명시
const JWT_OPTIONS = { algorithms: ['HS256'] };

app.use(cors());
app.use(express.json());

const USERS = {
  user:  { pw: 'user123',  role: 'user',  name: '김철수' },
  admin: { pw: 'admin123', role: 'admin', name: '관리자' },
};

const ALL_ORDERS = [
  { id:'#ORD-001', user:'김철수', product:'무선 블루투스 이어폰', price:'₩89,000',  status:'shipping'  },
  { id:'#ORD-002', user:'이영희', product:'맥북 파우치 + 마우스',  price:'₩155,000', status:'delivered' },
  { id:'#ORD-003', user:'박민준', product:'USB-C 허브 7포트',      price:'₩42,000',  status:'ordered'   },
  { id:'#ORD-004', user:'최수진', product:'무선 충전 패드 듀얼',   price:'₩67,500',  status:'shipping'  },
  { id:'#ORD-005', user:'정호성', product:'게이밍 키보드 TKL',     price:'₩189,000', status:'delivered' },
];

const log = (label, value, ok = null) => {
  const icon = ok === true ? '✅' : ok === false ? '❌' : '🔍';
  console.log(`  ${icon} ${label}:`, value);
};

// ── 1. 로그인 ────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];

  console.log('\n[POST /api/login]');
  if (!user || user.pw !== password) {
    log('인증 결과', '실패', false);
    return res.status(401).json({ error: '아이디 또는 비밀번호 오류' });
  }

  const payload = {
    sub:  username,
    name: user.name,
    role: user.role,
    iat:  Math.floor(Date.now() / 1000),
    exp:  Math.floor(Date.now() / 1000) + 3600,
  };

  // ✅ algorithm 명시적 지정
  const token = jwt.sign(payload, SECRET, { algorithm: 'HS256' });
  log('인증 결과', '성공', true);
  log('발급 role', user.role);
  res.json({ token, user: { name: user.name, role: user.role } });
});

// ── 2. 내 주문 ───────────────────────────────────────────────
app.get('/api/orders', (req, res) => {
  console.log('\n[GET /api/orders]');
  const decoded = verifySecure(req, res);
  if (!decoded) return;

  const myOrders = ALL_ORDERS.filter(o => o.user === decoded.name);
  res.json({ orders: myOrders });
});

// ── 3. 관리자 전용 ───────────────────────────────────────────
app.get('/api/admin', (req, res) => {
  console.log('\n[GET /api/admin]');
  const decoded = verifySecure(req, res);
  if (!decoded) return;

  if (decoded.role !== 'admin') {
    log('권한 확인', '관리자 아님 → 403', false);
    return res.status(403).json({ error: '관리자 권한 필요' });
  }

  log('권한 확인', '관리자 확인 → 200 OK', true);
  res.json({ message: '관리자 접근 성공', orders: ALL_ORDERS });
});

// ── 방어된 JWT 검증 함수 ────────────────────────────────────
function verifySecure(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    log('토큰', '없음 → 401', false);
    res.status(401).json({ error: '토큰 없음' });
    return null;
  }

  try {
    // ✅ algorithms 옵션으로 alg:none 완전 차단
    const decoded = jwt.verify(token, SECRET, JWT_OPTIONS);
    log('서명 검증', '성공', true);
    log('토큰 role', decoded.role);
    return decoded;
  } catch (e) {
    log('서명 검증', `실패 → 401 (${e.message})`, false);
    res.status(401).json({ error: `토큰 검증 실패: ${e.message}` });
    return null;
  }
}

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   ✅  ShopSecure 방어 서버 (포트 3002)   ║');
  console.log('║   algorithms: HS256 / 강한 Secret 키     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
