/* 목업 데이터 — 상품 상세 최대할인가(원본 요청). 금액·이름은 예시 값입니다. */
window.MOCK = {
  product: {
    tags: ["신상품", "베스트", "오늘출발"],
    name: "카라 아이보리 긴팔 니트 가디건",
    eng: "Loose Fit Collar Knit Cardigan",
    price: 100000,
    replaceText: "가격 문의",
  },
  /* 상품 할인(POL-016): 리바이 > 기간 > 신상품 중 최상위 1건 */
  productDc: { name: "26년 1월 20% 할인", type: "기간 할인", rate: 0.2 },
  bulkDc: { name: "대량 구매 할인", tiers: ["3개 이상 구매 시 3% 할인", "5개 이상 구매 시 5% 할인", "10개 이상 구매 시 10% 할인"] },
  /* 상품 추가 할인(POL-020): 상품별 그룹할인 */
  groupDc: { name: "일반회원", rate: 0.1 },
  /* 쿠폰(POL-022부터 POL-037까지). area: product | order, dup: 중복 쿠폰, noDup: 중복 불가 */
  coupons: [
    { id: "c1", area: "product", name: "상품 쿠폰 10% 할인", rate: 0.1, owned: true, cond: "상품 금액 30,000원 이상 시 구매 가능" },
    { id: "c2", area: "product", name: "신규 가입 상품 쿠폰 5% 할인", rate: 0.05, owned: false, noDup: true },
    { id: "c3", area: "product", name: "가디건 기획전 3,000원 할인", amount: 3000, owned: false, dup: true },
    { id: "c4", area: "product", name: "앱 전용 상품 중복 쿠폰 2,000원", amount: 2000, owned: false, dup: true, appOnly: true },
    { id: "c5", area: "order", name: "장바구니 쿠폰 10% 할인", rate: 0.1, owned: true },
    { id: "c6", area: "order", name: "적립금 함께 사용 불가 장바구니 쿠폰 5,000원", amount: 5000, owned: false, noReserve: true, noDup: true },
    { id: "c7", area: "order", name: "장바구니 중복 쿠폰 1,000원 할인", amount: 1000, owned: false, dup: true },
  ],
  /* 적립금 즉시 할인(POL-038, POL-039) */
  reserveSale: { name: "사용 적립금 즉시 할인", rate: 0.02 },
  /* 회원 등급 할인(POL-040, POL-041) */
  gradeDc: { name: "일반회원 결제 시 5% 추가 할인", rate: 0.05 },
  /* 앱 전용 할인(POL-042, POL-043) */
  appDc: { name: "앱 구매 할인", amount: 500 },
  /* 보유 적립금(POL-044부터 POL-052까지): 상품 구매액 30%까지 사용 */
  reserve: { owned: 15000, limitRate: 0.3 },
  /* 결제수단별 프로모션(POL-053부터 POL-058까지) */
  payments: [
    { id: "p1", name: "무통장 입금 시 5% 할인", rate: 0.05 },
    { id: "p2", name: "네이버페이 결제 시 2,000원 할인", amount: 2000 },
    { id: "p3", name: "카드 결제 시 3% 할인", rate: 0.03, memberOnly: true },
    { id: "p4", name: "휴대폰 결제 시 적립금 1% 적립", rate: 0.01, rewardOnly: true },
  ],
};
