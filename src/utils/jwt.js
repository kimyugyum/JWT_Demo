// ─── JWT 유틸 (데모용) ───────────────────────────────────────

export const b64url = (obj) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
    .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');

export const b64decode = (str) => {
  str = str.replace(/-/g,'+').replace(/_/g,'/');
  while (str.length % 4) str += '=';
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); }
  catch { return str; }
};

// 토큰 생성
export function createToken(payload, alg = 'HS256') {
  const header = { alg, typ: 'JWT' };
  const h = b64url(header);
  const p = b64url(payload);
  const sig = alg === 'none' ? '' : 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  return `${h}.${p}.${sig}`;
}

// 토큰 파싱
export function parseToken(token) {
  try {
    const [h, p, s] = token.split('.');
    return { header: b64decode(h), payload: b64decode(p), sig: s, parts: [h, p, s] };
  } catch { return null; }
}
