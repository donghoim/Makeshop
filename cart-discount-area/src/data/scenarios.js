/* 목업 데이터: 상품·쿠폰·배송비 설정과 시나리오 프리셋 (Mock JSON) */
(function (g) {
  var ITEMS = {
    hq1: { id: 'hq1', supplier: 'HQ', name: '카라 아이보리 긴팔 니트 가디건', opt: '사이즈 : F, 색상 : 아이보리', price: 39000, listPrice: 59000, optAdd: 0, qty: 1, color: '#efe6d8',
      pd: { first: { kind: '기간 할인', type: 'rate', v: 10 }, group: { type: 'rate', v: 5 } }, reserve: 390 },
    hq2: { id: 'hq2', supplier: 'HQ', name: '울 블렌드 라운드 니트', opt: '사이즈 : F, 색상 : 베이지', price: 49000, listPrice: 69000, optAdd: 0, qty: 2, color: '#e7d8c3',
      pd: { bulk: { minQty: 2, type: 'rate', v: 5 } }, reserve: 490 },
    hq3: { id: 'hq3', supplier: 'HQ', name: '케이블 니트 베스트', opt: '사이즈 : F, 색상 : 소라 (+2,000원)', price: 29000, listPrice: 35000, optAdd: 2000, qty: 1, color: '#dbe6ee',
      pd: { first: { kind: '신상품 할인', type: 'amt', v: 2000 } }, reserve: 290 },
    a1: { id: 'a1', supplier: 'A', name: '린넨 와이드 슬랙스', opt: '사이즈 : M, 색상 : 블랙', price: 45000, listPrice: 52000, optAdd: 0, qty: 1, color: '#d9d9d9', pd: {}, reserve: 450 },
    a2: { id: 'a2', supplier: 'A', name: '데일리 코튼 셔츠', opt: '사이즈 : L, 색상 : 화이트', price: 32000, listPrice: 38000, optAdd: 0, qty: 1, color: '#f3f3f3',
      pd: { first: { kind: '기간 할인', type: 'rate', v: 5 } }, reserve: 320 },
    n1: { id: 'n1', supplier: 'HQ', name: '베이직 코튼 반팔 티셔츠', opt: '사이즈 : M, 색상 : 화이트', price: 19000, listPrice: 19000, optAdd: 0, qty: 2, color: '#f1f1ee', pd: {}, reserve: 190 },
    n2: { id: 'n2', supplier: 'HQ', name: '스트링 밴딩 조거 팬츠', opt: '사이즈 : L, 색상 : 차콜', price: 35000, listPrice: 35000, optAdd: 0, qty: 1, color: '#cfcfd2', pd: {}, reserve: 350 }
  };

  /* kind P=상품 쿠폰, C=장바구니 쿠폰 / dupType=true 이면 중복 쿠폰 / dupAllowed=쿠폰 중복 사용 가능 설정
     issuer: HQ(본사 전용), A(A업체 발행), HQSUP(본사+공급사) */
  var COUPONS = [
    { id: 'P1', kind: 'P', dupType: false, dupAllowed: true, name: '신규 회원 10% 상품 쿠폰', desc: '회원 가입 감사 쿠폰입니다.', type: 'rate', v: 10, max: 5000, min: 0, issuer: 'HQ', expire: '무제한' },
    { id: 'P2', kind: 'P', dupType: false, dupAllowed: false, name: '가을 시즌 5,000원 할인', desc: '다른 쿠폰과 함께 쓸 수 없습니다.', type: 'amt', v: 5000, min: 40000, issuer: 'HQ', expire: '26/11/30 23:59' },
    { id: 'P3', kind: 'P', dupType: false, dupAllowed: true, name: '[A업체] 셔츠 3,000원 쿠폰', desc: 'A업체 상품 전용 쿠폰입니다.', type: 'amt', v: 3000, min: 0, issuer: 'A', targets: ['a2'], expire: '26/12/31 23:59' },
    { id: 'PD1', kind: 'P', dupType: true, dupAllowed: true, name: '상품 중복 3% 쿠폰', desc: '중복으로 사용 가능한 쿠폰입니다.', type: 'rate', v: 3, min: 0, issuer: 'HQ', expire: '무제한' },
    { id: 'C1', kind: 'C', dupType: false, dupAllowed: true, name: '장바구니 7% 할인 (5만원 이상)', desc: '최대 10,000원 할인', type: 'rate', v: 7, max: 10000, min: 50000, issuer: 'HQSUP', expire: '26/11/30 23:59' },
    { id: 'C2', kind: 'C', dupType: false, dupAllowed: false, name: '장바구니 8,000원 할인', desc: '다른 쿠폰과 함께 쓸 수 없습니다.', type: 'amt', v: 8000, min: 30000, issuer: 'HQ', expire: '26/11/15 23:59' },
    { id: 'CA', kind: 'C', dupType: false, dupAllowed: true, name: '[A업체] 장바구니 2,000원', desc: 'A업체 상품 전용 쿠폰입니다.', type: 'amt', v: 2000, min: 30000, issuer: 'A', expire: '26/12/31 23:59' },
    { id: 'CD1', kind: 'C', dupType: true, dupAllowed: true, name: '장바구니 중복 2% 쿠폰', desc: '중복으로 사용 가능한 쿠폰입니다.', type: 'rate', v: 2, min: 0, issuer: 'HQ', expire: '무제한' },
    { id: 'CX', kind: 'C', dupType: false, dupAllowed: true, name: 'VIP 15% 할인 (30만원 이상)', desc: '상품 금액 합계 300,000원 이상 구매 시', type: 'rate', v: 15, max: 30000, min: 300000, issuer: 'HQ', expire: '26/12/31 23:59' }
  ];

  var SHIPPING = {
    HQ: { label: '본사배송', fee: 3000, freeOver: 300000 },
    A: { label: 'A업체배송', fee: 2500, freeOver: 100000 }
  };

  var CART_TYPES = {
    single: { label: '개별 장바구니', unit: 'all', groups: false },
    int1: { label: '통합 장바구니1', unit: 'supplier', groups: true },
    int2all: { label: '통합 장바구니2(통합쿠폰)', unit: 'all', groups: true },
    int2each: { label: '통합 장바구니2(개별쿠폰)', unit: 'supplier', groups: true }
  };

  var PRESETS = {
    base: { label: '할인·쿠폰 있음', items: ['hq1', 'hq2', 'hq3'], intItems: ['hq1', 'hq2', 'hq3', 'a1', 'a2'], coupons: 'all' },
    productOnly: { label: '상품 할인만 (쿠폰 0건)', items: ['hq1', 'hq2', 'hq3'], intItems: ['hq1', 'hq2', 'hq3', 'a1', 'a2'], coupons: [] },
    noDiscount: { label: '할인 0건', items: ['n1', 'n2'], intItems: ['n1', 'n2', 'a1'], coupons: [] },
    empty: { label: '담긴 상품 없음', items: [], intItems: [], coupons: 'all' }
  };

  g.CART_DATA = { ITEMS: ITEMS, COUPONS: COUPONS, SHIPPING: SHIPPING, CART_TYPES: CART_TYPES, PRESETS: PRESETS };
})(window);
