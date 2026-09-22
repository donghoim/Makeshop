/* Google Channel — 연결 관리 탭 Mock 데이터
   근거: 04_Screen-Spec/01. 연결관리 탭/*.svg, 05_Policy/01. 연결관리 탭/1-6. 연결관리 탭 - 카드 화면 정책.pdf */

window.MOCK_DASH = {
  googleAccount: {
    email: "plan@makeshop-merchant.co.kr",
    name: "메이크샵 플래닝",
    status: "connected" // "connected" | "reauth_required" — 1-6장 6-2-1(Google 계정 문제 시 3개 영역 모두 재인증 필요로 전환)
  },

  // Google 로그인 시뮬레이션(계정 선택 화면)에서 보여줄 세션 계정 목록
  googleAccountsForLogin: [
    { email: "plan@makeshop-merchant.co.kr", name: "메이크샵 플래닝" }
  ],

  // 판매자센터 정보 설정 체크리스트(4항목)
  checklistItems: [
    { key: "connect", label: "커넥트 정보 등록", auto: true, desc: "Google 로그인 정보로 자동 등록됩니다. 별도 조치가 필요 없어요." },
    { key: "ssl", label: "SSL 인증 도메인 사용", auto: false,
      desc: "쇼핑몰이 HTTPS(https://)를 사용하는지, 체크아웃 과정이 유효한 SSL 인증서로 보호되는지 확인해 주세요.",
      current: "현재 상태: makeshop-merchant.co.kr — HTTPS 미적용",
      linkLabel: "도메인 설정으로 이동" },
    { key: "policy", label: "쇼핑몰 이용약관·환불정책 등록", auto: false,
      desc: "개인정보처리방침·이용약관·배송정책·환불정책 4가지가 모두 쇼핑몰에 공개돼 있어야 합니다. 누락 시 Merchant Center 이용이 제한될 수 있어요.",
      current: "현재 상태: 환불정책 페이지 미등록",
      linkLabel: "약관 설정으로 이동",
      confirmCheckbox: "개인정보처리방침·이용약관·배송정책·환불정책이 모두 정상적으로 공개된 쇼핑몰임을 확인하였습니다" },
    { key: "payment", label: "결제 수단 등록", auto: false,
      desc: "쇼핑몰 체크아웃에서 결제가 정상적으로 완료될 수 있는 결제 수단이 등록돼 있어야 합니다.",
      current: "현재 상태: 전자결제(PG) 미등록",
      linkLabel: "전자결제(PG) 신청·관리로 이동",
      confirmCheckbox: "결제서비스가 정상적으로 등록된 쇼핑몰임을 확인하였습니다" }
  ],

  // Merchant Center 계정 선택(5-1)
  mcAccountsExisting: [
    { id: "5849302617", name: "makeshop-merchant.co.kr 판매자센터" }
  ],

  mc: {
    businessName: "makeshop-merchant.co.kr 판매자센터",
    accountId: "5849302617",
    // "connected"(연결 완료) | "issue"(확인 필요) | "error"(연결 오류) | "reauth_required"(재인증 필요 — Google 계정 자체 문제로 전파된 경우) | "suspended"(정지됨)
    // 근거: 1-6. 카드 화면 정책 6-3-2(Merchant Center 계정 영역 상태 3종) · 6-7(연결 이상 상태 전파 규칙). 결정 주체는 항상 Google(Merchant API 조회 결과) — 메이크샵 자체 판단 아님.
    status: "connected",
    statusReason: "", // status가 issue/error일 때만 사용 — 화면에 노출할 대표 사유 문구
    businessCountry: "대한민국",
    phone: "010-****-5678",
    domain: {
      host: "makeshop-merchant.co.kr",
      https: true
    },
    shipping: {
      fee: 3000,
      freeThreshold: 70000,
      leadTime: "1~3영업일",
      country: "대한민국" // 판매 국가는 대한민국 고정(비활성화 노출) — 05_Policy/01_연결관리_탭/03_연결_중_정책.md 3장
    }
  },

  ads: {
    accountName: "MakeShop 운영계정",
    customerId: "342-118-5590",
    status: "connected", // "connected" | "reauth_required" — 1-6장 6-4-3 배지, 결정 주체 Google
    billingProfile: "메이크샵 주식회사 (신용카드 등록됨)"
  },

  // Google Ads 연결 실패 대표 사유 4종(1-6장 6-4-4 오류 매핑 표 축약) — 후속 처리 유형별 1건씩 대표 사례만 선택
  adsFailureReasons: [
    { code: "OAUTH_TOKEN_REVOKED", label: "Google 계정 인증이 만료되었어요.", action: "reauth", actionLabel: "Google 계정 다시 연결하기" },
    { code: "CUSTOMER_NOT_ENABLED", label: "선택한 Google Ads 계정이 아직 활성화되지 않았어요.", action: "check_account", actionLabel: "Google Ads에서 계정 확인하기" },
    { code: "PERMISSION_DENIED", label: "이 Google Ads 계정에 대한 접근 권한이 없어요.", action: "check_permission", actionLabel: "Google Ads 계정 권한 확인하기" },
    { code: "INTERNAL_ERROR", label: "일시적인 오류로 연결에 실패했어요.", action: "retry", actionLabel: "다시 시도" }
  ],

  adsAccountsList: [
    { id: "342-118-5590", name: "MakeShop 운영계정" },
    { id: "118-224-7701", name: "MakeShop 테스트계정" }
  ],

  // Google Ads 연결 정보 확인(Step4) 10개 항목
  adsConfirmItems: [
    { label: "Google Ads 계정 연결", required: true },
    { label: "전환 추적 설정 확인", required: false },
    { label: "구매 전환 설정 확인", required: false },
    { label: "장바구니 추가 전환 설정 확인", required: false },
    { label: "결제 시작 전환 설정 확인", required: false },
    { label: "향상된 전환 설정 확인", required: false },
    { label: "광고 성과 조회 권한 확인", required: true },
    { label: "Merchant Center 연동 여부 확인", required: false },
    { label: "광고 캠페인 운영 여부 확인", required: false },
    { label: "연결 정보 저장", required: true }
  ],

  feed: {
    productCount: 1204,
    lastSync: "2026-08-10 07:00",
    statusCounts: { active: 1122, review: 48, disapproved: 12, limited: 15, disabled: 7 }
  }
};
