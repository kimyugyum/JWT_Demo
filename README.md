# ShopSecure — JWT 보안 취약점 데모

JWT 인증의 두 가지 실제 취약점(**alg:none 공격**, **CVE-2026-29000**)을 브라우저에서 직접 체험할 수 있는 교육용 React 앱입니다.

> ⚠️ 이 프로젝트는 보안 교육 목적으로 제작되었습니다. 실제 서비스에 사용하지 마세요.

---

## 데모 화면

| 로그인 & 토큰 발급 | alg:none 공격 시연 | CVE-2026-29000 시뮬레이터 |
|---|---|---|
| JWT 구조를 시각적으로 분해해서 보여줌 | 브라우저 콘솔 시점에서 공격 흐름을 단계별 재현 | JWE + PlainJWT 공격부터 패치까지 3단계 시나리오 |

---

## 주요 기능

### 1. 로그인 페이지
- 테스트 계정(일반 유저 / 관리자)으로 원클릭 로그인
- 로그인 시 JWT 토큰을 직접 발급하고 Header · Payload · Signature 컬러 분해 표시
- jwt.io 바로가기 버튼 제공

### 2. 사용자 대시보드 (일반 유저)
- 역할 기반 접근 제어(RBAC) 체험 — `role: "user"` 토큰으로는 관리자 페이지 접근 불가
- **alg:none 공격 시연**: 브라우저 콘솔 시뮬레이터로 JWT 위조 과정을 5단계로 재현
  1. 기존 토큰 확인
  2. Header 디코딩 (`alg: "HS256"` 확인)
  3. `alg: "none"`, `role: "admin"` 변조
  4. 서명 제거 후 토큰 재조합
  5. 위조 토큰으로 관리자 접근 성공

### 3. 관리자 페이지
- 전체 주문 데이터 열람 (정상 로그인 / 위조 토큰 구분)
- 위조 토큰으로 접근 시 경고 배너 표시 및 공격 분석 모달 제공
- 취약 코드 vs 방어 코드 비교

### 4. CVE-2026-29000 시뮬레이터
- **pac4j-jwt ≤ 4.5.8** 라이브러리의 실제 취약점 (CVSS 9.8 Critical) 재현
- JWE 안에 PlainJWT(서명 없음)를 숨겨 `SignedJWT.parse()` 결과가 `null`이 되는 순간 서명 검증 경로 완전 스킵
- 3가지 시나리오: 정상 요청 → 공격 → 패치 후 방어
- 취약 Java 코드 vs 패치 코드 비교, alg:none 공격과의 차이점 비교표

---

## 취약점 요약

| | alg:none 공격 | CVE-2026-29000 |
|---|---|---|
| **공격 방식** | JWT Header의 alg를 `none`으로 변조 | JWE 안에 PlainJWT를 숨김 |
| **서명 우회 경로** | 서버가 `none` 알고리즘을 허용 | `null` 체크 없는 로직 누락 |
| **필요 조건** | 유효한 JWT 1개 | RSA 공개키 (공개 정보) |
| **탐지 난이도** | 쉬움 | 어려움 (외부는 정상 암호화 토큰) |
| **CVSS** | 7.5 High | 9.8 Critical |
| **방어** | 허용 알고리즘 명시 (`algorithms: ['HS256']`) | `SignedJWT.parse()` 결과 null 체크 |

---

## 기술 스택

- **React 19** + React Router DOM 7
- Create React App (react-scripts 5)
- 외부 백엔드 없음 — 모든 JWT 처리는 브라우저에서 동작

---

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

브라우저에서 `http://localhost:3000` 접속

---

## 테스트 계정

| 아이디 | 비밀번호 | 역할 |
|---|---|---|
| `user` | `user123` | 일반 유저 |
| `admin` | `admin123` | 관리자 |

---

## 프로젝트 구조

```
src/
├── App.js                  # 뷰 라우팅 (login / user / admin / cve)
├── pages/
│   ├── LoginPage.jsx       # 로그인 + JWT 발급 시각화
│   ├── DashboardPage.jsx   # 사용자 대시보드 + alg:none 공격 시연
│   ├── AdminPage.jsx       # 관리자 페이지 + 침입 분석
│   └── CVESimulator.jsx    # CVE-2026-29000 단계별 시뮬레이터
├── components/
│   └── UI.jsx              # 공통 컴포넌트 (Navbar, Card, TokenVisualizer 등)
└── utils/
    ├── jwt.js              # JWT 생성 · 파싱 유틸 (데모용)
    └── data.js             # 테스트 계정 및 주문 더미 데이터
```

---

## 핵심 교훈

1. **alg:none**: 서버는 허용할 알고리즘을 명시적으로 지정해야 합니다. `none`을 허용하면 서명이 완전히 무력화됩니다.
2. **CVE-2026-29000**: 암호화(JWE)와 서명(JWT)은 별개입니다. 암호화가 됐다고 서명이 검증된 게 아닙니다. 라이브러리가 정상 동작해도 로직 한 줄(null 체크)이 빠지면 뚫립니다.

---

## 참고 자료

- [JWT.io](https://jwt.io) — JWT 디버거
- [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519) — JWT 스펙
- [OWASP: JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
