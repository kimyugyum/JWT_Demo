// ⚠️  server-vulnerable.js — 취약한 JWT 서버 (발표 데모용)
// 절대 실제 서비스에 사용하지 마세요!

const express = require('express');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');

const app    = express();
const PORT   = 3001;
const SECRET = 'secret'; // ❌ 취약점 2: 너무 약한 시크릿 키

app.use(cors());
app.use(express.json());

// ── 더미 데이터 ──────────────────────────────────────────────
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

// ── 로그 헬퍼 ────────────────────────────────────────────────
const log = (label, value, ok = null) => {
  const icon = ok === true ? '✅' : ok === false ? '❌' : '🔍';
  console.log(`  ${icon} ${label}:`, value);
};

// ── 1. 로그인 ────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];

  console.log('\n[POST /api/login]');
  log('입력 아이디', username);

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

  const token = jwt.sign(payload, SECRET); // ❌ algorithms 미지정
  log('인증 결과', '성공', true);
  log('발급 role', user.role);
  log('발급 토큰', token.substring(0, 40) + '...');
  res.json({ token, user: { name: user.name, role: user.role } });
});

// ── 2. 내 주문 (일반 유저) ───────────────────────────────────
app.get('/api/orders', (req, res) => {
  console.log('\n[GET /api/orders]');
  const token = extractToken(req);
  const decoded = verifyVulnerable(token); // ❌ 취약한 검증

  if (!decoded) return res.status(401).json({ error: '인증 실패' });

  log('토큰 role', decoded.role);
  const myOrders = ALL_ORDERS.filter(o => o.user === decoded.name);
  log('반환 주문 수', myOrders.length, true);
  res.json({ orders: myOrders });
});

// ── 3. 전체 주문 (관리자 전용) ───────────────────────────────
app.get('/api/admin', (req, res) => {
  console.log('\n[GET /api/admin]');
  const token = extractToken(req);
  const decoded = verifyVulnerable(token); // ❌ 취약한 검증

  if (!decoded) {
    log('검증 결과', '토큰 없음 또는 파싱 실패', false);
    return res.status(401).json({ error: '인증 실패' });
  }

  log('토큰 alg', decoded.header?.alg ?? '알 수 없음');
  log('토큰 role', decoded.role);

  if (decoded.role !== 'admin') {
    log('권한 확인', '관리자 아님 → 403', false);
    return res.status(403).json({ error: '관리자 권한 필요' });
  }

  log('권한 확인', '관리자 확인 → 200 OK', true);
  res.json({
    message: '🚨 관리자 데이터 접근 성공',
    orders:  ALL_ORDERS,
    stats:   { total: 1284, revenue: '₩48.2M', members: 3891 },
  });
});

// ── 취약한 JWT 검증 함수 ────────────────────────────────────
function verifyVulnerable(token) {
  if (!token) return null;
  try {
    // ❌ 핵심 취약점: algorithms 옵션 없음 → alg:none 허용
    const decoded = jwt.verify(token, SECRET);
    return decoded;
  } catch (e) {
    // ❌ alg:none 토큰은 verify 실패하지만 직접 디코딩으로 우회
    try {
      const [, payload] = token.split('.');
      const decoded = JSON.parse(
        Buffer.from(payload.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString()
      );
      // alg:none 이면 그냥 통과 (최악의 구현)
      const [header] = token.split('.');
      const { alg } = JSON.parse(
        Buffer.from(header.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString()
      );
      if (alg === 'none') {
        console.log('  ⚠️  alg:none 감지 → 서명 검증 스킵 (취약!)');
        return { ...decoded, header: { alg } };
      }
      return null;
    } catch { return null; }
  }
}

function extractToken(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   ⚠️  ShopSecure 취약 서버 (포트 3001)   ║');
  console.log('║   alg:none 허용 / Secret: "secret"       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
