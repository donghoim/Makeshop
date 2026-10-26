/* ==========================================================================
   Google 채널 Mock 데이터 (Backend/DB 없음 — Prototype 전용)
   - 상품·쇼핑몰 카테고리·GPC 목록은 Meta Mock(window.MOCK)을 함께 쓴다(GPC 공통값, POL-071).
   - 화면설계서 예시값은 실제 커머스 데이터로 치환했다.
   ========================================================================== */
window.GMOCK = (function () {
  const account = {
    email: "admin@noblystudio.kr",
    name: "김민지",
  };
  const merchant = {
    id: "5795095349",
    businessName: "노블리 스튜디오",
    country: "대한민국",
    domain: "https://www.noblystudio.kr",
    phoneMasked: "010-****-5821",
  };
  const merchantCandidates = [
    { id: "5795095349", name: "노블리 스튜디오" },
    { id: "6120448102", name: "노블리 스튜디오 (테스트)" },
  ];
  const adsAccounts = [
    { id: "123-456-7890", name: "노블리 스튜디오 광고" },
    { id: "987-654-3210", name: "노블리 아울렛 광고" },
  ];

  /* ---------------- Merchant API itemLevelIssues → 미승인 사유 그룹 (POL-055) ---------------- */
  const issueGroups = {
    price_mismatch: { group: "가격 불일치", description: "방문 페이지의 가격과 피드의 가격이 다릅니다.", detail: "상품 상세 페이지의 판매가와 전송된 가격이 같은지 확인하세요." },
    availability_mismatch: { group: "재고 불일치", description: "방문 페이지의 재고 상태와 피드의 재고 상태가 다릅니다.", detail: "품절·재고 상태를 상품 상세 페이지와 맞춰 주세요." },
    missing_required: { group: "필수 속성 누락", description: "필수 속성 [brand]가 누락되었습니다.", detail: "브랜드 정보를 등록한 뒤 다시 반영하세요." },
    invalid_value: { group: "잘못된 속성값", description: "속성 [color]의 값이 올바르지 않습니다.", detail: "옵션 값에 허용되지 않는 문자가 포함되어 있습니다." },
    landing_page_error: { group: "방문 페이지 오류", description: "방문 페이지를 열 수 없습니다.", detail: "상품 URL이 정상적으로 열리는지 확인하세요." },
    image_issue: { group: "이미지 문제", description: "이미지에 홍보성 문구가 포함되어 있습니다.", detail: "텍스트·워터마크가 없는 상품 이미지로 변경하세요." },
    policy_violation: { group: "Google 정책 위반", description: "Google 쇼핑 정책에 위반되는 상품입니다.", detail: "Google 쇼핑 광고 정책을 확인하세요." },
    identifier_issue: { group: "상품 식별자 문제", description: "GTIN 값이 올바르지 않습니다.", detail: "바코드(GTIN) 값을 확인하거나 비워 두세요." },
    category_attribute: { group: "카테고리/속성 문제", description: "상품 카테고리와 속성이 맞지 않습니다.", detail: "Google 상품 카테고리를 다시 확인하세요." },
    duplicate: { group: "중복 또는 상품 식별 문제", description: "동일 상품이 중복 등록되었습니다.", detail: "같은 상품이 여러 번 등록되지 않았는지 확인하세요." },
    other: { group: "기타 상품 데이터 문제", description: "상품 데이터에 문제가 있습니다.", detail: "Merchant Center에서 상세 내용을 확인하세요." },
  };
  const issueCodes = Object.keys(issueGroups);

  /* ---------------- 노출제한 사유 (메이크샵 판정, POL-053) ---------------- */
  const restrictReasons = {
    display: { label: "진열 안 함", guide: "상품 노출 여부를 노출함으로 변경" },
    sale: { label: "판매 안 함", guide: "판매 가능 여부를 판매가능으로 변경" },
    price0: { label: "판매가 0원", guide: "판매가 입력" },
    priceText: { label: "판매가 대체문구 사용", guide: "대체문구 해제 후 판매가 입력" },
    privatePay: { label: "개인 결제 문구 포함", guide: "상품명 수정" },
    noImage: { label: "상세이미지 없음", guide: "이미지 등록" },
    noDesc: { label: "상세설명 없음", guide: "상세설명 등록" },
    noGpc: { label: "카테고리 미매칭", guide: "Google 카테고리 매칭 후 [상품 피드 반영]" },
  };

  /* ---------------- Google Ads 캠페인 (일 평균 지표, s/e: 오늘 기준 상대 일수) ---------------- */
  function C(name, type, s, e, imp, clk, conv, value, cost, shopping) {
    return { name, type, s, e, imp, clk, conv, value, cost, shopping: !!shopping };
  }
  const campaigns = [
    C("PMax · F/W 아우터 전체 상품", "실적 최대화", -70, null, 64000, 1320, 19, 3920000, 418000, true),
    C("쇼핑 · 원피스 기획전", "쇼핑", -40, null, 28000, 760, 11, 1180000, 162000, true),
    C("쇼핑 · 가방 베스트", "쇼핑", -55, null, 19000, 540, 7, 806000, 98000, true),
    C("검색 · 브랜드 키워드", "검색", -120, null, 8200, 910, 14, 1460000, 121000),
    C("검색 · 일반 키워드(코트)", "검색", -30, null, 15000, 620, 5, 512000, 143000),
    C("디스플레이 · 리마케팅", "디스플레이", -90, null, 112000, 680, 6, 498000, 87000),
    C("유튜브 · 신상품 런칭 영상", "동영상", -21, -3, 94000, 410, 1, 69000, 76000),
    C("PMax · 리빙 소품", "실적 최대화", -14, null, 21000, 380, 4, 214000, 58000, true),
  ];
  const campaignTypes = ["실적 최대화", "쇼핑", "검색", "디스플레이", "동영상"];

  /* ---------------- 광고 운영 상태 (권장사항·진단) ---------------- */
  const recommendations = [
    { type: "목표 ROAS 조정", text: "목표 광고 투자수익(ROAS)을 조정하면 전환 가치가 늘어날 수 있습니다." },
    { type: "예산 증액", text: "예산이 제한되어 일부 노출 기회를 놓치고 있습니다." },
    { type: "반응형 검색 광고 추가", text: "광고 그룹에 반응형 검색 광고를 추가해 보세요." },
  ];

  /* ---------------- 동기화 이력 ---------------- */
  const syncHistory = [
    { at: -0.1, type: "자동 동기화", result: "일부 실패", target: 18, ok: 15, fail: 3, failIds: [5, 13, 20] },
    { at: -1, type: "정합성 점검", result: "성공", target: 6, ok: 6, fail: 0 },
    { at: -1.2, type: "자동 동기화", result: "성공", target: 22, ok: 22, fail: 0 },
    { at: -2, type: "정합성 점검", result: "성공", target: 3, ok: 3, fail: 0 },
    { at: -3, type: "전체 동기화", result: "성공", target: 39, ok: 39, fail: 0 },
    { at: -12, type: "자동 동기화", result: "실패", target: 4, ok: 0, fail: 4, failIds: [11, 18, 26, 28], cause: "Google 계정 인증 만료" },
    { at: -45, type: "최초 동기화", result: "성공", target: 37, ok: 37, fail: 0 },
  ];
  const failReasons = {
    5: "Merchant API 요청 한도 초과(429). 다음 전송에서 다시 보냅니다.",
    13: "이미지 URL에 접근할 수 없습니다.",
    20: "Merchant API 일시 오류(503). 다음 전송에서 다시 보냅니다.",
  };

  return { account, merchant, merchantCandidates, adsAccounts, issueGroups, issueCodes, restrictReasons, campaigns, campaignTypes, recommendations, syncHistory, failReasons };
})();
