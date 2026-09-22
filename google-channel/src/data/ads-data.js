/* Google Ads 탭 — Mock 데이터
   근거: 04_Screen-Spec/03. 구글애즈 탭/*.svg, 05_Policy/03. 구글애즈 탭/3-1~3-5 정책.pdf
   ※ 프로토타입용 정적 데이터. 실제 API 응답이 아님. */

window.MOCK_ADS = {
  account: {
    name: "메이크샵 데모스토어",
    customerId: "123-456-7890",
    linkedGoogleAccount: "planner@makeshop-demo.co.kr",
    currency: "KRW (₩)",
    timezone: "Asia/Seoul (GMT+9)",
    status: "connected" // "connected" | "reauth_required" — 05_Policy/03. 구글애즈 탭/3-1. 구글 애즈 탭 - 연결 상태 정책.pdf, 결정 주체는 항상 Google
  },

  measurement: {
    items: [
      { key: "googleTag", label: "Google Tag", status: "정상" },
      { key: "purchase", label: "구매 전환", status: "정상" },
      { key: "addToCart", label: "장바구니 추가 전환", status: "정상" },
      { key: "checkoutStart", label: "결제 시작 전환", status: "설정 필요" },
      { key: "enhanced", label: "향상된 전환", status: "설정 필요" }
    ],
    lastCollectedAt: "2026-08-10 09:12"
  },

  // "이 Google Ads 계정에 이미 연결된 Merchant Center 계정이 있어요" 배너.
  // 근거: 04_Screen-Spec/03. 구글애즈 탭/6-4. 구글애즈 탭, 계정 연동 완료 (머천트 센터 계정 감지).svg
  // 이 배너는 상품피드(Merchant Center)가 메이크샵에 아직 연동되지 않은 상태에서만 나타나는 별도 화면 상태다.
  // Merchant Center가 이미 메이크샵에 연동돼 있으면(정상적인 "연동완료" 상태) 이 배너는 노출되지 않는다 —
  // detected 기본값은 false, dev 툴바의 "MC 계정 감지" 상태에서만 true로 전환된다.
  mcLink: {
    detected: false,
    accountName: "데모스토어 Merchant Center",
    accountId: "MC-9931204"
  },

  // 광고 기준 탭 — 8개 요약 카드 (증감은 광고비 제외 7개 지표에만 표시, CTR·전환율은 %p 단위)
  summaryAds: {
    cost:            { label: "광고비",       value: 5824000,  fmt: "won",    delta: null, dir: null },
    impressions:     { label: "노출수",       value: 1284500,  fmt: "num",    delta: 4.1,  dir: "up" },
    clicks:          { label: "클릭수",       value: 38210,    fmt: "num",    delta: -2.3, dir: "down" },
    ctr:             { label: "CTR",         value: 2.97,     fmt: "pct",    delta: 0.3,  dir: "up",  unit: "%p" },
    conversions:     { label: "전환수",       value: 912,      fmt: "num",    delta: 15.6, dir: "up" },
    conversionValue: { label: "전환가치",     value: 68420000, fmt: "won",    delta: 11.4, dir: "up" },
    conversionRate:  { label: "전환율",       value: 2.39,     fmt: "pct",    delta: -0.2, dir: "down", unit: "%p" },
    roas:            { label: "ROAS",        value: 11.75,    fmt: "roas",   delta: 6.0,  dir: "up" }
  },

  // 상품 기준 탭 — 8개 요약 카드 (노출수/클릭수/CTR/광고비/전환수/전환율/전환가치/ROAS)
  summaryProducts: {
    impressions:     { label: "노출수",   value: 486200,   fmt: "num", delta: 6.8,  dir: "up" },
    clicks:          { label: "클릭수",   value: 14380,    fmt: "num", delta: 3.2,  dir: "up" },
    ctr:             { label: "CTR",     value: 2.96,     fmt: "pct", delta: -0.1, dir: "down", unit: "%p" },
    cost:            { label: "광고비",   value: 2224000,  fmt: "won", delta: 5.5,  dir: "up" },
    conversions:     { label: "전환수",   value: 580,      fmt: "num", delta: 12.1, dir: "up" },
    conversionRate:  { label: "전환율",   value: 4.03,     fmt: "pct", delta: 0.4,  dir: "up",  unit: "%p" },
    conversionValue: { label: "전환가치", value: 51520000, fmt: "won", delta: 9.7,  dir: "up" },
    roas:            { label: "ROAS",    value: 23.17,    fmt: "roas", delta: 3.9, dir: "up" }
  },

  campaigns: [
    {
      id: "CMP-001", name: "여름 시즌 프로모션", type: "검색", status: "운영 중",
      dailyBudget: 150000, startDate: "2026-06-01", endDate: "2026-08-31",
      impressions: 412000, clicks: 12850, cost: 2380000,
      conversions: 305, conversionValue: 24800000,
      biddingStrategy: "타겟 ROAS", optimizationScore: 88,
      shoppingAdsUsed: false, productPmax: false
    },
    {
      id: "CMP-002", name: "브랜드 검색", type: "검색", status: "운영 중",
      dailyBudget: 80000, startDate: "2026-01-15", endDate: null,
      impressions: 198000, clicks: 9400, cost: 612000,
      conversions: 410, conversionValue: 31200000,
      biddingStrategy: "타겟 CPA", optimizationScore: 94,
      shoppingAdsUsed: false, productPmax: false
    },
    {
      id: "CMP-003", name: "리타겟팅 - 장바구니 이탈", type: "디스플레이", status: "운영 중",
      dailyBudget: 60000, startDate: "2026-03-10", endDate: null,
      impressions: 356000, clicks: 4120, cost: 498000,
      conversions: 88, conversionValue: 5240000,
      biddingStrategy: "전환수 최대화", optimizationScore: 76,
      shoppingAdsUsed: false, productPmax: false
    },
    {
      id: "CMP-004", name: "신규 고객 확보 - PMax", type: "실적 최대화(PMax)", status: "일시중지",
      dailyBudget: 100000, startDate: "2026-05-01", endDate: "2026-09-30",
      impressions: 289000, clicks: 6800, cost: 812000,
      conversions: 54, conversionValue: 3120000,
      biddingStrategy: "전환수 최대화", optimizationScore: 61,
      shoppingAdsUsed: false, productPmax: false
    },
    {
      id: "CMP-005", name: "브랜드 인지도 - 동영상", type: "동영상", status: "운영 중",
      dailyBudget: 50000, startDate: "2026-07-01", endDate: null,
      impressions: 890000, clicks: 15200, cost: 298000,
      conversions: 12, conversionValue: 640000,
      biddingStrategy: "타겟 CPM", optimizationScore: 70,
      shoppingAdsUsed: false, productPmax: false
    },
    {
      id: "CMP-006", name: "쇼핑 - 베스트셀러", type: "쇼핑", status: "운영 중",
      dailyBudget: 120000, startDate: "2026-02-01", endDate: null,
      impressions: 275000, clicks: 8100, cost: 1040000,
      conversions: 260, conversionValue: 22600000,
      biddingStrategy: "타겟 ROAS", optimizationScore: 91,
      shoppingAdsUsed: true, productPmax: false
    },
    {
      id: "CMP-007", name: "상품 기반 PMax - 전체 카탈로그", type: "상품 기반 실적 최대화", status: "운영 중",
      dailyBudget: 200000, startDate: "2026-04-01", endDate: null,
      impressions: 512000, clicks: 14200, cost: 1184000,
      conversions: 320, conversionValue: 28900000,
      biddingStrategy: "전환가치 극대화", optimizationScore: 85,
      shoppingAdsUsed: true, productPmax: true
    }
  ],

  products: [
    { id: "PRD-1001", name: "오가닉 코튼 반팔 티셔츠 - 화이트", category: "패션 > 상의 > 티셔츠",
      campaignName: "쇼핑 - 베스트셀러", impressions: 64200, clicks: 2380, conversions: 94, cost: 312000, conversionValue: 6580000 },
    { id: "PRD-1002", name: "와이드 데님 팬츠", category: "패션 > 하의 > 데님",
      campaignName: "쇼핑 - 베스트셀러", impressions: 51800, clicks: 1920, conversions: 61, cost: 268000, conversionValue: 5490000 },
    { id: "PRD-1003", name: "리넨 블렌드 셔츠 - 베이지", category: "패션 > 상의 > 셔츠",
      campaignName: "상품 기반 PMax - 전체 카탈로그", impressions: 47500, clicks: 1540, conversions: 48, cost: 219000, conversionValue: 4120000 },
    { id: "PRD-1004", name: "미니멀 크로스백", category: "패션잡화 > 가방 > 크로스백",
      campaignName: "상품 기반 PMax - 전체 카탈로그", impressions: 68300, clicks: 2510, conversions: 77, cost: 358000, conversionValue: 8920000 },
    { id: "PRD-1005", name: "수분크림 라이트 50ml", category: "뷰티 > 스킨케어 > 크림",
      campaignName: "쇼핑 - 베스트셀러", impressions: 39200, clicks: 1180, conversions: 52, cost: 156000, conversionValue: 3640000 },
    { id: "PRD-1006", name: "릴렉스핏 후드 집업", category: "패션 > 아우터 > 후드집업",
      campaignName: "상품 기반 PMax - 전체 카탈로그", impressions: 58900, clicks: 2040, conversions: 66, cost: 298000, conversionValue: 7210000 },
    { id: "PRD-1007", name: "스니커즈 로우탑", category: "패션잡화 > 신발 > 스니커즈",
      campaignName: "쇼핑 - 베스트셀러", impressions: 72100, clicks: 2790, conversions: 88, cost: 341000, conversionValue: 9480000 },
    { id: "PRD-1008", name: "선크림 SPF50+", category: "뷰티 > 스킨케어 > 선케어",
      campaignName: "쇼핑 - 베스트셀러", impressions: 44600, clicks: 1350, conversions: 59, cost: 178000, conversionValue: 4010000 },
    { id: "PRD-1009", name: "캔버스 에코백", category: "패션잡화 > 가방 > 에코백",
      campaignName: "상품 기반 PMax - 전체 카탈로그", impressions: 39400, clicks: 1090, conversions: 35, cost: 94000, conversionValue: 2070000 }
  ],

  // 광고 개선 권장사항 4건 (04_광고_운영_상태_정책.md 4장) — Google Ads Recommendation만, 심각도 배지 없음
  recommendations: [
    {
      category: "결제 수단", target: "계정 전체",
      title: "결제 수단 정보를 확인해 주세요.",
      description: "결제 수단에 문제가 있어 광고 게재가 중단될 수 있어요.",
      impact: null
    },
    {
      category: "캠페인 운영", target: "동영상 캠페인 - 브랜드 인지도",
      title: "일시중지된 캠페인의 예산을 확인해 주세요.",
      description: "캠페인이 일시중지 상태입니다. 예산을 조정하면 다시 운영할 수 있습니다.",
      impact: "주간 노출 수 약 8,200 ~ 11,400회 증가 예상"
    },
    {
      category: "예산", target: "쇼핑 캠페인 - 전체상품",
      title: "캠페인 예산을 늘리면 더 많은 클릭을 받을 수 있어요.",
      description: "현재 예산으로는 하루 중 일부 시간대에 노출 기회를 놓치고 있습니다.",
      impact: "주간 클릭 수 약 620 ~ 820회 증가 예상"
    },
    {
      category: "광고 소재", target: "검색 캠페인 - 브랜드 / 기본 광고그룹",
      title: "반응형 검색 광고 자산을 추가해 보세요.",
      description: "제목·설명 자산을 더 추가하면 다양한 조합으로 광고가 게재되어 성과 개선에 도움이 될 수 있습니다.",
      impact: null
    }
  ],

  // 진단 및 알림 2건 (04_광고_운영_상태_정책.md 5·6장) — Merchant Center 계정·상품 문제만, Google Ads 전환 측정 항목은 포함하지 않음
  diagnostics: [
    {
      severity: "조치 필요", source: "Merchant Center",
      title: "Merchant Center 계정에 조치가 필요한 문제가 있습니다.",
      description: "웹사이트 소유권 확인 등 계정 설정을 완료해야 광고 게재가 재개돼요.",
      lastChecked: "2026-08-27 09:00", buttonLabel: "Merchant Center에서 확인"
    },
    {
      severity: "주의", source: "Merchant Center",
      title: "일부 상품의 광고 노출에 영향을 주는 문제가 있습니다.",
      description: "일부 상품의 승인 상태를 다시 확인해야 해요. Merchant Center에서 상세 사유를 확인할 수 있어요.",
      lastChecked: "2026-08-27 09:00", buttonLabel: "Merchant Center에서 확인"
    }
  ],

  // 항목 설정 모달 — 광고 기준 (선택됨 6개[고정 1: 캠페인명] + 선택 가능 16개 = 22개)
  adsItemFields: {
    selectedDefault: [
      { key: "name", label: "캠페인명", desc: "캠페인 이름", fixed: true },
      { key: "status", label: "상태", desc: "캠페인 운영 상태" },
      { key: "dailyBudget", label: "일 예산", desc: "일일 광고 예산" },
      { key: "impressions", label: "노출수", desc: "광고 노출 횟수" },
      { key: "clicks", label: "클릭수", desc: "광고 클릭 횟수" },
      { key: "cost", label: "광고비", desc: "광고 집행 비용" }
    ],
    available: [
      { key: "type", label: "캠페인 유형", desc: "광고 캠페인 유형" },
      { key: "startDate", label: "시작일", desc: "광고 시작일" },
      { key: "endDate", label: "종료일", desc: "광고 종료일" },
      { key: "ctr", label: "CTR", desc: "광고 클릭률" },
      { key: "avgCpc", label: "평균 CPC", desc: "평균 클릭당 비용" },
      { key: "cpm", label: "CPM", desc: "1,000회 노출당 비용" },
      { key: "conversions", label: "전환수", desc: "전체 전환 횟수" },
      { key: "purchases", label: "구매수", desc: "구매 전환 횟수" },
      { key: "conversionValue", label: "구매 전환가치", desc: "구매 전환 금액" },
      { key: "conversionRate", label: "전환율", desc: "구매 전환율" },
      { key: "cpa", label: "CPA", desc: "구매당 광고비" },
      { key: "roas", label: "ROAS", desc: "광고 수익률" },
      { key: "bidStrategy", label: "입찰 전략", desc: "광고 입찰 방식" },
      { key: "optScore", label: "최적화 점수", desc: "Google 최적화 점수" },
      { key: "shoppingAdsUsed", label: "상품 광고 사용 여부", desc: "상품 광고 사용 여부" },
      { key: "productPmax", label: "상품 기반 Performance Max", desc: "상품 기반 P-Max 여부" }
    ]
  },

  // 항목 설정 모달 — 상품 기준 (선택됨 9개[고정 2: 상품정보·캠페인명] + 선택 가능 11개 = 20개)
  productItemFields: {
    selectedDefault: [
      { key: "productInfo", label: "상품정보", desc: "이미지·상품명·카테고리", fixed: true },
      { key: "campaignName", label: "캠페인명", desc: "연결된 캠페인 이름", fixed: true },
      { key: "impressions", label: "노출수", desc: "광고 노출 횟수" },
      { key: "clicks", label: "클릭수", desc: "광고 클릭 횟수" },
      { key: "ctr", label: "CTR", desc: "광고 클릭률" },
      { key: "conversions", label: "전환수", desc: "전체 전환 횟수" },
      { key: "cost", label: "광고비", desc: "광고 집행 비용" },
      { key: "conversionValue", label: "전환가치", desc: "전환 금액" },
      { key: "roas", label: "ROAS", desc: "광고 수익률" }
    ],
    available: [
      { key: "avgCpc", label: "평균 CPC", desc: "평균 클릭당 비용" },
      { key: "conversionRate", label: "전환율", desc: "구매 전환율" },
      { key: "costPerConversion", label: "전환당 비용", desc: "전환 1건당 평균 광고비" },
      { key: "valuePerConversion", label: "전환당 가치", desc: "전환 1건당 평균 전환가치" },
      { key: "allConversions", label: "전체 전환수", desc: "주 전환 액션 외 전체 전환 횟수" },
      { key: "allConversionValue", label: "전체 전환가치", desc: "전체 전환 액션 기준 전환가치" },
      { key: "brand", label: "브랜드", desc: "상품 브랜드" },
      { key: "googleCategory", label: "Google 상품 카테고리", desc: "Google 표준 상품 분류" },
      { key: "productType", label: "상품 유형", desc: "메이크샵 상품 분류" },
      { key: "productId", label: "상품 ID", desc: "Google 측 원본 상품 식별자" },
      { key: "feedLabel", label: "피드 라벨", desc: "상품 피드 라벨" }
    ]
  }
};
