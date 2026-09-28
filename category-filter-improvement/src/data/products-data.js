// 프로토타입 전용 Mock 데이터 (file:// 환경에서 fetch 제약 없이 동작하도록 JS로 내장)
// appliedValues[filterId] = 적용된 filterValueId 배열 (한 필터에 여러 값 동시 적용 가능한 구조로 가정 — 06_Data-API 참조)
window.MOCK_PRODUCTS = [
  { productId: 11502377, name: "MA-1 항공점퍼", displayStatus: "진열", regDate: "2026-07-01", appliedValues: { 1: [102], 2: [204] } },
  { productId: 11502383, name: "경량 숏패딩 조끼", displayStatus: "진열", regDate: "2026-07-02", appliedValues: { 1: [103] } },
  { productId: 11502382, name: "구스다운 롱패딩", displayStatus: "진열", regDate: "2026-07-02", appliedValues: { 2: [202], 3: [305] } },
  { productId: 11502381, name: "플리스 집업 자켓", displayStatus: "진열", regDate: "2026-07-03", appliedValues: { 1: [101], 2: [207] } },
  { productId: 11502380, name: "울 블렌드 코트", displayStatus: "진열", regDate: "2026-07-03", appliedValues: { 2: [208], 3: [305] } },
  { productId: 11502379, name: "데님 트러커 자켓", displayStatus: "진열", regDate: "2026-07-04", appliedValues: { 1: [102], 2: [204] } },
  { productId: 11502378, name: "코듀로이 셔츠", displayStatus: "미진열", regDate: "2026-07-04", appliedValues: { 1: [103], 2: [209] } },
  { productId: 11502376, name: "니트 가디건", displayStatus: "진열", regDate: "2026-07-05", appliedValues: { 2: [219] } },
  { productId: 11502375, name: "트위드 자켓", displayStatus: "진열", regDate: "2026-07-05", appliedValues: { 2: [220], 3: [304] } },
  { productId: 11502374, name: "라이더스 자켓", displayStatus: "진열", regDate: "2026-07-06", appliedValues: { 1: [102], 2: [202] } },
  { productId: 11502373, name: "후드 집업", displayStatus: "진열", regDate: "2026-07-06", appliedValues: { 1: [104], 2: [208] } },
  { productId: 11502372, name: "맨투맨 스웨트셔츠", displayStatus: "진열", regDate: "2026-07-07", appliedValues: { 1: [103], 2: [201], 3: [302] } },
  { productId: 11502371, name: "체크 셔츠", displayStatus: "진열", regDate: "2026-07-07", appliedValues: { 1: [102] } },
  { productId: 11502370, name: "카고 팬츠", displayStatus: "미진열", regDate: "2026-07-08", appliedValues: {} },
  { productId: 11502369, name: "와이드 슬랙스", displayStatus: "진열", regDate: "2026-07-08", appliedValues: { 1: [103], 2: [205] } },
  { productId: 11502368, name: "니트 베스트", displayStatus: "진열", regDate: "2026-07-09", appliedValues: { 2: [206] } },
  { productId: 11502367, name: "트레이닝 팬츠", displayStatus: "진열", regDate: "2026-07-09", appliedValues: { 1: [107], 2: [208] } },
  { productId: 11502366, name: "플란넬 셔츠", displayStatus: "진열", regDate: "2026-07-10", appliedValues: { 1: [102], 2: [203] } },
  { productId: 11502365, name: "다운 베스트", displayStatus: "진열", regDate: "2026-07-10", appliedValues: { 2: [207], 3: [303] } },
  { productId: 11502364, name: "집업 후드티", displayStatus: "진열", regDate: "2026-07-11", appliedValues: { 1: [106] } }
];
