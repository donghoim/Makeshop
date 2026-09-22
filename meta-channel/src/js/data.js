/* ==========================================================================
   Mock 데이터 — 실 서비스 API 연동 없이 화면 시연을 위한 정적 데이터
   (10_Prototype/src/data/*.json 에 동일 내용의 참고용 사본이 있음)
   ========================================================================== */

window.MOCK = {

  /* ---------------- 연결 관리 : 비즈니스 자산 연동 정보 ---------------- */
  account: {
    fbAccountLabel: "테스트 (test@test.com)",
    businessManagerName: "neotest17",
    pageName: "neotest17 공식스토어",
    pixelId: "1234567890",
    commerceAccountName: "neotest17",
    catalogName: "neotest17 카탈로그",
    instagramUsername: "neotest17",
    instagramConnected: true,
  },

  /* ---------------- 광고 관리 : 광고 계정 정보 ---------------- */
  adAccount: {
    name: "neotest17",
    id: "act_123456789012345",
    status: "활성", // 활성 | 차단 | 비활성 | 미결제 | 펜딩
    monthSpend: 1247500,
    remainingCredit: 482300,
    creditType: "후불",
  },

  /* ---------------- 쇼핑몰 카테고리 (최하위 분류만 매칭 대상) ---------------- */
  shopCategories: [
    { id: "sc1", path: "과실/견과류 > 국내산 과일" },
    { id: "sc2", path: "과실/견과류 > 수입 과일" },
    { id: "sc3", path: "과실/견과류 > 냉동/말린 과일" },
    { id: "sc4", path: "과실/견과류 > 견과류" },
    { id: "sc5", path: "채소류 > 고구마/감자/뿌리채소" },
    { id: "sc6", path: "의류 > 여성 > 아우터 > 코트" },
    { id: "sc7", path: "의류 > 여성 > 아우터 > 자켓" },
  ],

  /* 최초 자동 카테고리 매칭 팝업에서 아직 매칭되지 않은 상태로 시작 */
  categoryMatch: {
    sc1: null, sc2: null, sc3: null, sc4: null, sc5: null, sc6: null, sc7: null,
  },

  /* ---------------- Meta 표준 카테고리(GPC, 일부 발췌) ---------------- */
  gpcOptions: [
    "식품, 음료 및 담배 > 식품 > 과일 및 채소 > 신선 과일",
    "식품, 음료 및 담배 > 식품 > 과일 및 채소 > 신선 채소",
    "식품, 음료 및 담배 > 식품 > 스낵 식품 > 견과류 및 씨앗류",
    "식품, 음료 및 담배 > 식품 > 과일 및 채소 > 뿌리채소",
    "의류 및 액세서리 > 의류 > 겉옷 > 코트",
    "의류 및 액세서리 > 의류 > 겉옷 > 자켓",
    "의류 및 액세서리 > 의류 > 겉옷 > 패딩",
  ],

  reasonMessages: {
    // 미승인 사유
    COMMERCE_POLICY_VIOLATION: "Meta 커머스 정책에 위반되어 거부되었습니다. Meta 커머스 정책을 확인해 주세요.",
    INVALID_PRODUCT_CATEGORY: "페이스북 카테고리가 올바르지 않습니다. 페이스북 카테고리를 다시 매칭해 주세요.",
    MISSING_PRICE: "가격 정보가 누락되었습니다. 판매가를 확인해 주세요.",
    MISSING_BRAND: "브랜드 정보가 누락되었습니다. 브랜드 값을 등록해 주세요.",
    IMAGE_NOT_ACCESSIBLE: "상품 이미지에 접근할 수 없습니다. 이미지 경로를 확인해 주세요.",
    // 노출제한 사유
    NOT_ON_DISPLAY: "노출하지 않은 상품입니다. 상품을 노출함 상태로 변경해 주세요.",
    OUT_OF_STOCK_LOCAL: "품절 상품입니다.",
    ZERO_PRICE: "판매가가 0원입니다. 정상 판매가를 입력해 주세요.",
    NO_CATEGORY: "상품 분류가 지정되지 않았습니다. 기본 분류를 설정해 주세요.",
    NO_IMAGE: "상품 이미지가 없습니다. 이미지를 등록해 주세요.",
  },

  /* ---------------- 상품 피드 목록 (24건, 페이지네이션 확인용) ---------------- */
  products: [
    p("Apple 정품 라이트닝 이어맷", 3, "의류 > 여성 > 아우터 > 코트", 89000, "active", "의류 및 액세서리 > 의류 > 겉옷 > 코트", "unisex", "adult"),
    p("울 블렌드 롱 코트", 4, "의류 > 여성 > 아우터 > 코트", 158000, "active", "의류 및 액세서리 > 의류 > 겉옷 > 코트", "female", "adult"),
    p("캐시미어 숏 자켓", 5, "의류 > 여성 > 아우터 > 자켓", 132000, "active", "의류 및 액세서리 > 의류 > 겉옷 > 자켓", "female", "adult"),
    p("경량 다운 패딩 자켓", 6, "의류 > 여성 > 아우터 > 자켓", 99000, "active", "의류 및 액세서리 > 의류 > 겉옷 > 자켓", "unisex", "adult"),
    p("국내산 부사 사과 5호 (10과)", 1, "과실/견과류 > 국내산 과일", 32900, "active", "식품, 음료 및 담배 > 식품 > 과일 및 채소 > 신선 과일", null, null),
    p("햇밤 고구마 3kg", 1, "채소류 > 고구마/감자/뿌리채소", 21900, "active", "식품, 음료 및 담배 > 식품 > 과일 및 채소 > 뿌리채소", null, null),
    p("무농약 방울토마토 1kg", 1, "과실/견과류 > 국내산 과일", 15900, "active", "식품, 음료 및 담배 > 식품 > 과일 및 채소 > 신선 과일", null, null),
    p("칠레산 냉동 블루베리 500g", 1, "과실/견과류 > 냉동/말린 과일", 12900, "active", "식품, 음료 및 담배 > 식품 > 과일 및 채소 > 신선 과일", null, null),
    p("볶음 아몬드 500g", 1, "과실/견과류 > 견과류", 18900, "active", "식품, 음료 및 담배 > 식품 > 스낵 식품 > 견과류 및 씨앗류", null, null),
    p("호두 1kg (국내산)", 1, "과실/견과류 > 견과류", 27900, "active", "식품, 음료 및 담배 > 식품 > 스낵 식품 > 견과류 및 씨앗류", null, null),
    p("여성 트위드 자켓", 4, "의류 > 여성 > 아우터 > 자켓", 142000, "active", "의류 및 액세서리 > 의류 > 겉옷 > 자켓", "female", "adult"),
    p("남성 방풍 바람막이 자켓", 5, "의류 > 여성 > 아우터 > 자켓", 76000, "active", "의류 및 액세서리 > 의류 > 겉옷 > 자켓", "male", "adult"),

    p("겨울 롱 패딩 코트", 4, "의류 > 여성 > 아우터 > 코트", 219000, "review", null, null, null),
    p("수입 자몽 3kg (특대)", 1, "과실/견과류 > 수입 과일", 24900, "review", null, null, null),

    p("무스탕 페이크 퍼 코트", 3, "의류 > 여성 > 아우터 > 코트", 178000, "rejected", null, null, null, "MISSING_BRAND"),
    p("수입 아보카도 4입", 1, "과실/견과류 > 수입 과일", 8900, "rejected", null, null, null, "INVALID_PRODUCT_CATEGORY"),
    p("프리미엄 캐시미어 100 코트", 2, "의류 > 여성 > 아우터 > 코트", 0, "rejected", null, null, null, "MISSING_PRICE"),

    p("한정판 자수 패딩 자켓", 3, "의류 > 여성 > 아우터 > 자켓", 205000, "limited", null, null, null, "NO_IMAGE"),
    p("겨울 방한 누빔 자켓 (품절)", 4, "의류 > 여성 > 아우터 > 자켓", 87000, "limited", null, null, null, "OUT_OF_STOCK_LOCAL"),
    p("샘플 판매가 미설정 상품", 1, "과실/견과류 > 견과류", 0, "limited", null, null, null, "ZERO_PRICE"),

    p("개인결제 전용 맞춤 코트", 1, "의류 > 여성 > 아우터 > 코트", 250000, "disabled", null, null, null),
    p("도매회원 전용 대량 견과 세트", 1, "과실/견과류 > 견과류", 55000, "disabled", null, null, null),

    p("여성 오버핏 하프 코트", 3, "의류 > 여성 > 아우터 > 코트", 121000, "active", "의류 및 액세서리 > 의류 > 겉옷 > 코트", "female", "adult"),
    p("국내산 견과 혼합 선물세트", 1, "과실/견과류 > 견과류", 39000, "active", "식품, 음료 및 담배 > 식품 > 스낵 식품 > 견과류 및 씨앗류", null, null),
  ],

  /* ---------------- 광고 관리 : 캠페인 성과 요약 (조회기간별) ---------------- */
  perfByPeriod: {
    today:     { impressions: 61234,   clicks: 2210,  ctr: 3.61, purchases: 42,  spend: 18420,  roas: 7.1, deltaImp: 4.1,  deltaClk: 2.0,  deltaCtr: -0.2, deltaPur: 6.5 },
    yesterday: { impressions: 1234567, clicks: 98765, ctr: 2.99, purchases: 842, spend: 312840, roas: 8.4, deltaImp: 12.4, deltaClk: 8.1,  deltaCtr: -0.3, deltaPur: 15.2 },
    last7:     { impressions: 7845210, clicks: 612345,ctr: 3.12, purchases: 5210,spend: 2148000,roas: 7.9, deltaImp: 9.8,  deltaClk: 7.4,  deltaCtr: 0.1,  deltaPur: 11.0 },
    last30:    { impressions: 30452100,clicks: 2354210,ctr:2.95, purchases:19850,spend: 8420500,roas: 8.0, deltaImp: 15.6, deltaClk: 12.1, deltaCtr: -0.4, deltaPur: 9.3 },
    thisMonth: { impressions: 18452100,clicks: 1354210,ctr:3.05, purchases:11850,spend: 5120500,roas: 8.2, deltaImp: 10.2, deltaClk: 8.9,  deltaCtr: 0.2,  deltaPur: 13.7 },
  },

  /* ---------------- 광고 관리 : 캠페인 목록 ---------------- */
  campaigns: [
    { name: "캠페인명1", objective: "카탈로그 판매", impressions: 524810, clicks: 15240, purchases: 342, roas: 9.2, revenue: 1181280, cost: 128400, startDate: "2026-05-01", endDate: "2026-07-31" },
    { name: "캠페인명2", objective: "전환", impressions: 312440, clicks: 9820, purchases: 298, roas: 11.4, revenue: 994280, cost: 87200, startDate: "2026-05-15", endDate: "2026-08-15" },
    { name: "캠페인명3", objective: "트래픽", impressions: 284110, clicks: 8420, purchases: 124, roas: 6.8, revenue: 423480, cost: 62100, startDate: "2026-06-01", endDate: "-" },
    { name: "캠페인명4", objective: "브랜드 인지도", impressions: 108200, clicks: 3840, purchases: 54, roas: 2.7, revenue: 76860, cost: 24800, startDate: "2026-06-20", endDate: "2026-07-20" },
  ],

  campaignColumns: {
    available: [
      { key: "objective", label: "목표", desc: "캠페인 목표 유형" },
      { key: "startDate", label: "시작일시", desc: "광고 시작일" },
      { key: "endDate", label: "종료일시", desc: "광고 종료일" },
      { key: "reach", label: "도달수", desc: "광고를 본 순 사용자 수" },
      { key: "frequency", label: "빈도", desc: "1인당 평균 광고 노출 횟수" },
      { key: "cpm", label: "CPM", desc: "1,000회 노출당 비용" },
      { key: "ctr", label: "CTR", desc: "클릭수 ÷ 노출수 × 100" },
      { key: "cpc", label: "CPC", desc: "클릭 1회당 평균 광고 비용" },
      { key: "cartAdd", label: "장바구니 추가", desc: "광고 클릭 후 장바구니에 담긴 횟수" },
      { key: "checkoutStart", label: "결제 시작", desc: "광고 클릭 후 결제를 시작한 횟수" },
      { key: "cvr", label: "전환율", desc: "구매수 ÷ 클릭수 × 100" },
      { key: "cpa", label: "CPA", desc: "구매 1건당 평균 광고 비용" },
    ],
    selected: [
      { key: "name", label: "캠페인명", desc: "캠페인 제목", fixed: true },
      { key: "objective", label: "목표", desc: "캠페인 목표 유형" },
      { key: "impressions", label: "노출수", desc: "광고가 노출된 총 횟수" },
      { key: "clicks", label: "클릭수", desc: "광고 클릭 총 횟수" },
      { key: "purchases", label: "구매수", desc: "광고 클릭 후 발생한 구매 수" },
      { key: "roas", label: "ROAS", desc: "광고비 1원 대비 발생 매출 비율" },
      { key: "revenue", label: "매출", desc: "광고로 발생한 총 매출액" },
      { key: "cost", label: "광고비용", desc: "해당 기간 총 광고 집행 비용" },
    ],
  },
};

/* helper to build a product record concisely */
function p(name, variantCount, shopCategoryPath, price, status, feedCategory, gender, ageGroup, reasonCode) {
  return {
    id: "PRD-" + Math.random().toString(36).slice(2, 9),
    name, variantCount, shopCategoryPath, price, status,
    feedCategory: feedCategory || null,
    gender: gender || null,
    ageGroup: ageGroup || null,
    useYn: status !== "disabled",
    reasonCode: reasonCode || null,
  };
}
