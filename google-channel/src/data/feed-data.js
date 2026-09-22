// 상품 피드 탭 — Mock 데이터
// 근거: 05_Policy/02. 상품피드 탭/2-1(운영 화면)·2-2(상품 피드 반영)·2-3(카테고리 매칭) 정책.pdf
// 04_Screen-Spec/02. 상품피드 탭/*.svg
// 백엔드/DB 없음 — 프로토타입 전용 목업 데이터
// apparel 필드: 매칭된 Google 카테고리가 의류 및 액세서리(GPC 166) 하위인지 여부 — true인 상품·카테고리에만 성별·연령대 입력 항목을 노출한다(2-3장 3-4장)

window.MOCK_FEED = {
  // AREA-FEED-SYNC-STATUS (Sync-History-Policy.md 0장) — 메이크샵 동기화 처리 상태 축
  syncStatus: {
    autoApply: true, // 자동 반영 상태(상품 자동 동기화)
    lastResult: "일부 실패", // 성공 / 일부 실패 / 실패 / 진행 중
    lastFullSyncAt: "2026-08-09 14:41",
    lastAutoSyncAt: "2026-08-10 03:12",
    pendingCount: 12,
    failedCount: 16
  },

  // AREA-FEED-CATEGORY-SUMMARY (05_Policy/02_상품피드_탭/04_카테고리_매칭_정책.md 1장)
  categorySummary: { total: 42, manual: 15, auto: 27 },

  // AREA-FEED-SUMMARY — 5단계 막대그래프 (Google 상품 상태 축, 5장)
  statusBar: { active: 1178, review: 42, disapproved: 16, limited: 6, disabled: 9 },

  // AREA-FEED-PROGRAMS (5-2장 확정 — 활동중/검토중/미승인/노출제한 4열)
  programs: [
    { name: "무료 목록", active: 1178, review: 4, disapproved: 10, limited: 2 },
    { name: "쇼핑 광고", active: 1162, review: 6, disapproved: 14, limited: 4 }
  ],

  genders: [
    { value: "", label: "미설정" },
    { value: "male", label: "남성" },
    { value: "female", label: "여성" },
    { value: "unisex", label: "남녀공용" }
  ],
  ageGroups: [
    { value: "", label: "미설정" },
    { value: "newborn", label: "신생아(0~3개월)" },
    { value: "infant", label: "영아(3~12개월)" },
    { value: "toddler", label: "유아(만 1~5세)" },
    { value: "kids", label: "아동(만 5~13세)" },
    { value: "adult", label: "성인(만 13세 이상)" }
  ],

  // 미승인 사유 4종 (Feed-Rejection-Reason-Policy.md 3-3장, 배송 사유 제외)
  disapprovalReasons: [
    "피드 가격과 방문 페이지 가격 불일치",
    "피드 재고와 방문 페이지 재고 불일치",
    "금지·제한 상품, 허위 표시 등",
    "부적절한 카테고리 또는 카테고리별 속성 부족"
  ],

  // 노출제한 사유 7종(1장, 순위순)
  limitedReasons: [
    "진열 안 함",
    "판매 안 함",
    "판매가 0원",
    "판매가 대체문구 체크",
    "상품명에 '개인결제' 포함",
    "상세이미지 없음",
    "상품상세설명 없음"
  ],

  // 구글 카테고리 목록(MANAGE 모달) — 메이크샵 카테고리(메인 분류, 리프) : Google 상품 카테고리 매칭
  categories: [
    { id: "C-1001", shopCategory: "여성의류 > 상의 > 셔츠", enabled: true, googleCategory: "Apparel & Accessories > Clothing > Shirts & Tops", mode: "직접 매칭", apparel: true },
    { id: "C-1002", shopCategory: "여성의류 > 상의 > 니트", enabled: true, googleCategory: "", mode: "자동 분류", apparel: true },
    { id: "C-1003", shopCategory: "여성의류 > 하의 > 팬츠", enabled: true, googleCategory: "Apparel & Accessories > Clothing > Pants", mode: "직접 매칭", apparel: true },
    { id: "C-1004", shopCategory: "남성의류 > 아우터 > 재킷", enabled: true, googleCategory: "", mode: "자동 분류", apparel: true },
    { id: "C-1005", shopCategory: "디지털 > 이어폰", enabled: true, googleCategory: "Electronics > Audio > Headphones", mode: "직접 매칭", apparel: false },
    { id: "C-1006", shopCategory: "리빙 > 주방용품", enabled: true, googleCategory: "", mode: "자동 분류", apparel: false },
    { id: "C-1007", shopCategory: "뷰티 > 스킨케어", enabled: false, googleCategory: "", mode: "매칭 제외", apparel: false },
    { id: "C-1008", shopCategory: "식품 > 건강식품", enabled: true, googleCategory: "Food, Beverages & Tobacco > Health & Beauty > Vitamins & Supplements", mode: "직접 매칭", apparel: false }
  ],

  // 상품 목록 (AREA-FEED-PRODUCTLIST) — 13건, 상태별 분포: 활동중5/검토중2/미승인2/노출제한2/사용안함2
  products: [
    { id: "P00019284", code: "P00019284", name: "여름 린넨 오버핏 셔츠 (아이보리)", price: 39000, googleCategory: "Apparel & Accessories > Clothing > Shirts & Tops", mode: "직접 매칭", gender: "female", age: "adult", apparel: true, status: "활동중", lastSyncAt: "2026-08-09 14:41", enabled: true },
    { id: "P00019301", code: "P00019301", name: "와이드 데님 팬츠", price: 45000, googleCategory: "Apparel & Accessories > Clothing > Pants", mode: "직접 매칭", gender: "female", age: "adult", apparel: true, status: "활동중", lastSyncAt: "2026-08-09 14:41", enabled: true },
    { id: "P00019355", code: "P00019355", name: "베이직 코튼 반팔 티셔츠", price: 15900, googleCategory: "Apparel & Accessories > Clothing > Shirts & Tops", mode: "자동 분류", gender: "", age: "", apparel: true, status: "활동중", lastSyncAt: "2026-08-09 14:41", enabled: true },
    { id: "P00021044", code: "P00021044", name: "Apple 정품 라이트닝 이어폰", price: 29000, googleCategory: "Electronics > Audio > Headphones", mode: "직접 매칭", gender: "", age: "", apparel: false, status: "활동중", lastSyncAt: "2026-08-10 03:12", enabled: true },
    { id: "P00021200", code: "P00021200", name: "휴대용 미니 가습기", price: 25000, googleCategory: "Electronics > Household Appliances", mode: "자동 분류", gender: "", age: "", apparel: false, status: "활동중", lastSyncAt: "2026-08-10 03:12", enabled: true },

    { id: "P00021102", code: "P00021102", name: "무선 블루투스 이어폰 케이스", price: 12000, googleCategory: "Electronics > Accessories", mode: "자동 분류", gender: "", age: "", apparel: false, status: "검토중", lastSyncAt: "-", enabled: true },
    { id: "P00021155", code: "P00021155", name: "스테인리스 텀블러 500ml", price: 18000, googleCategory: "", mode: "자동 분류", gender: "", age: "", apparel: false, status: "검토중", lastSyncAt: "-", enabled: true },

    { id: "P00019402", code: "P00019402", name: "니트 가디건 (베이지)", price: 52000, googleCategory: "Apparel & Accessories > Clothing > Outerwear", mode: "직접 매칭", gender: "female", age: "adult", apparel: true, status: "미승인", reason: "피드 가격과 방문 페이지 가격 불일치", lastSyncAt: "2026-08-09 14:41", enabled: true },
    { id: "P00019488", code: "P00019488", name: "남성 스트레이트 데님", price: 42000, googleCategory: "Apparel & Accessories > Clothing > Pants", mode: "자동 분류", gender: "male", age: "adult", apparel: true, status: "미승인", reason: "피드 재고와 방문 페이지 재고 불일치", lastSyncAt: "2026-08-09 14:41", enabled: true },

    { id: "P00019520", code: "P00019520", name: "여성 셔츠 블라우스", price: 0, googleCategory: "Apparel & Accessories > Clothing > Blouses", mode: "직접 매칭", gender: "female", age: "adult", apparel: true, status: "노출제한", reason: "판매가 0원", lastSyncAt: "-", enabled: true },
    { id: "P00019567", code: "P00019567", name: "겨울 패딩 롱코트", price: 128000, googleCategory: "Apparel & Accessories > Clothing > Outerwear", mode: "직접 매칭", gender: "female", age: "adult", apparel: true, status: "노출제한", reason: "상세이미지 없음", lastSyncAt: "-", enabled: true },

    { id: "P00019610", code: "P00019610", name: "리빙 수납 정리함 3종 세트", price: 22000, googleCategory: "", mode: "매칭 제외", gender: "", age: "", apparel: false, status: "사용안함", disabledAt: "2026-08-05 10:20", enabled: false },
    { id: "P00019650", code: "P00019650", name: "여성 니트 원피스", price: 58000, googleCategory: "Apparel & Accessories > Clothing > Dresses", mode: "직접 매칭", gender: "female", age: "adult", apparel: true, status: "사용안함", disabledAt: "2026-08-07 15:00", enabled: false }
  ],

  // 동기화 이력 (Sync-History-Policy.md 4장, 8컬럼) — SCR-GOOGLE-FEED-001-동기화이력모달.svg 예시값 재사용 + 추가 2건
  syncHistory: [
    { start: "2026-08-10 03:00", end: "2026-08-10 03:12", type: "자동 동기화", target: 84, success: 84, fail: 0, result: "성공" },
    {
      start: "2026-08-09 14:20", end: "2026-08-09 14:41", type: "전체 동기화", target: 1178, success: 1162, fail: 16, result: "일부 실패",
      failedItems: [
        { code: "P00019284", name: "여름 린넨 오버핏 셔츠 (아이보리)", reason: "API 오류" },
        { code: "P00019301", name: "와이드 데님 팬츠", reason: "필수 필드 누락" },
        { code: "P00019355", name: "베이직 코튼 반팔 티셔츠", reason: "이미지 URL 접근 불가" }
      ]
    },
    { start: "2026-08-09 03:00", end: "2026-08-09 03:09", type: "자동 동기화", target: 32, success: 32, fail: 0, result: "성공" },
    { start: "2026-08-08 09:00", end: "2026-08-08 09:00", type: "자동 동기화", target: 150, success: 150, fail: 0, result: "성공" },
    { start: "2026-08-07 21:10", end: "-", type: "전체 동기화", target: 210, success: 0, fail: 0, result: "진행 중" },
    { start: "2026-08-06 03:00", end: "2026-08-06 03:07", type: "자동 동기화", target: 45, success: 45, fail: 0, result: "성공" },
    { start: "2026-08-04 03:00", end: "2026-08-04 03:11", type: "자동 동기화", target: 60, success: 57, fail: 3, result: "일부 실패",
      failedItems: [
        { code: "P00021102", name: "무선 블루투스 이어폰 케이스", reason: "API 오류" },
        { code: "P00021155", name: "스테인리스 텀블러 500ml", reason: "필수 필드 누락" },
        { code: "P00019610", name: "리빙 수납 정리함 3종 세트", reason: "카테고리 taxonomy 오류" }
      ]
    },
    {
      start: "2026-07-30 10:02", end: "2026-07-30 10:03", type: "최초 동기화", target: 1178, success: 0, fail: 1178, result: "실패",
      failedItems: [
        { code: "-", name: "전체 상품(1,178건)", reason: "Merchant Center 초기 인증 오류" }
      ]
    }
  ]
};
