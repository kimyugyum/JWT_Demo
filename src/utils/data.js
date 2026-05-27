export const ACCOUNTS = {
  user:  { pw: 'user123',  role: 'user',  name: '김철수' },
  admin: { pw: 'admin123', role: 'admin', name: '관리자' },
};

export const ALL_ORDERS = [
  { id:'#ORD-001', user:'김철수', product:'무선 블루투스 이어폰',  price:'₩89,000',  status:'shipping',  date:'2024.12.18' },
  { id:'#ORD-002', user:'이영희', product:'맥북 파우치 + 마우스',   price:'₩155,000', status:'delivered', date:'2024.12.17' },
  { id:'#ORD-003', user:'박민준', product:'USB-C 허브 7포트',       price:'₩42,000',  status:'ordered',   date:'2024.12.18' },
  { id:'#ORD-004', user:'최수진', product:'무선 충전 패드 듀얼',    price:'₩67,500',  status:'shipping',  date:'2024.12.16' },
  { id:'#ORD-005', user:'정호성', product:'게이밍 키보드 TKL',      price:'₩189,000', status:'delivered', date:'2024.12.15' },
];

export const MY_ORDERS = ALL_ORDERS.filter(o => o.user === '김철수');
