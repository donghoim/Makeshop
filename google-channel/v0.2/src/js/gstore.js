/* ==========================================================================
   Google 채널 상태 저장소 + 상품 상태 판정 (사양 정의서 POL-035부터 POL-076)
   - 상품·쇼핑몰 카테고리·공통 GPC(catMap, 상품 gpc)는 Meta Store와 같은 데이터를 쓴다(POL-071).
   - 사용여부·성별·연령대·Google 판정 결과는 Google 채널 값으로 따로 저장한다.
   - 판정 순서: 사용안함 → 노출제한 → 반영대기 → 미승인 → 검토중 → 활동중 (POL-052)
   ========================================================================== */
const GStore = (function () {
  const KEY = "mktProto.google.v1";
  const G = window.GMOCK;
  const STATES = ["활동중", "검토중", "미승인", "노출제한", "사용안함", "반영대기"];
  const GOOGLE_STATES = ["활동중", "검토중", "미승인"];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function nowStr(offsetDays) {
    const d = new Date(Date.now() + (offsetDays || 0) * 86400000);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  /* ---------------- 프리셋 ---------------- */
  function baseState() {
    return {
      account: "none", // none | connected | reauth (Google 계정, POL-037)
      mc: "none", // none | connected | reauth (Merchant Center, POL-038)
      mcSuspended: false, // 계정 정지됨 (POL-051)
      mcAccount: null,
      domain: "none", // none | verifying | done | fail
      shipping: false,
      firstMatchDone: false, // 최초 카테고리 매칭 모달 1회 자동 노출 (POL-063)
      ads: "none", // none | connected | reauth
      adsAccount: null,
      mcLink: "linked", // Google Ads 기준 MC 연결 단계: none(Google Ads만 연결) | detected | linked
      measure: { tag: true, enhanced: true, conv: true },
      catUse: {},
      prod: {},
      lastFull: null,
      lastAuto: null,
      lastResult: null,
      history: [],
      queueAuto: true,
      syncing: false,
      // 통합 화면·권한 시나리오
      apiFail: { meta: false, google: false },
      noPerm: false,
    };
  }
  function seedProducts(s) {
    window.MOCK.products.forEach((p) => {
      const g = { use: null, status: null, issue: null, dirty: false, gender: null, age: null };
      if (p.id % 9 === 0) { g.status = "미승인"; g.issue = G.issueCodes[p.id % G.issueCodes.length]; }
      else if (p.id % 10 === 0) g.status = "검토중";
      else g.status = "활동중";
      if (p.id % 14 === 0) g.dirty = true;
      s.prod[p.id] = g;
    });
    s.prod[24].use = false;
    s.catUse.c16 = false;
  }
  function presetFull() {
    const s = baseState();
    Object.assign(s, {
      account: "connected", mc: "connected", mcAccount: clone(G.merchantCandidates[0]), domain: "done", shipping: true, firstMatchDone: true, autoMatchShown: true,
      ads: "connected", adsAccount: clone(G.adsAccounts[0]), mcLink: "linked",
      lastFull: nowStr(-3), lastAuto: nowStr(-0.1), lastResult: "일부 실패",
    });
    s.history = clone(G.syncHistory).map((h) => Object.assign(h, { atStr: nowStr(h.at) }));
    seedProducts(s);
    return s;
  }
  function presetAccountOnly() {
    const s = baseState();
    s.account = "connected";
    seedEmpty(s);
    return s;
  }
  function seedEmpty(s) {
    window.MOCK.products.forEach((p) => (s.prod[p.id] = { use: null, status: null, issue: null, dirty: false, gender: null, age: null }));
  }

  let state = load() || presetFull();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장 불가 환경 무시 */ }
  }

  /* ---------------- 연동 상태 ---------------- */
  const accountOk = () => state.account === "connected";
  const mcState = () => (state.account === "reauth" && state.mc !== "none" ? "reauth" : state.mc);
  const adsState = () => (state.account === "reauth" && state.ads !== "none" ? "reauth" : state.ads);
  const feedConnected = () => state.mc !== "none"; // 상품 피드 연동 = Merchant Center 연결
  const queueBlocked = () => state.account === "reauth" || state.mc === "reauth"; // POL-059

  /* ---------------- 판정 ---------------- */
  const gp = (p) => state.prod[p.id] || (state.prod[p.id] = { use: null, status: null, issue: null, dirty: false, gender: null, age: null });
  const validGpc = (id) => !!id && !!Store.gpc(id); // Google 택소노미 현재 버전에 있는지 (POL-073)
  function effUse(p) {
    const g = gp(p);
    if (g.use != null) return g.use; // 상품 단위 설정 우선 (POL-066)
    return !(p.cat && state.catUse[p.cat] === false);
  }
  function restriction(p) {
    const r = p.r || {};
    if (r.display) return "display";
    if (r.sale) return "sale";
    if (p.price === 0) return "price0";
    if (r.priceText) return "priceText";
    if (/개인\s?결제/.test(p.name)) return "privatePay";
    if (r.noImage) return "noImage";
    if (r.noDesc) return "noDesc";
    if (!validGpc(Store.effGpc(p))) return "noGpc";
    return null; // 품절은 노출제한 사유가 아님 (POL-054)
  }
  function status(p) {
    if (!effUse(p)) return "사용안함";
    if (restriction(p)) return "노출제한";
    const g = gp(p);
    if (g.dirty || !g.status) return "반영대기";
    return g.status;
  }
  function counts(list) {
    const c = { 전체: list.length };
    STATES.forEach((s) => (c[s] = 0));
    list.forEach((p) => c[status(p)]++);
    return c;
  }
  const products = () => Store.s.products;
  /** 판정 주체 (SCR-GOOGLE-FEED-003) */
  const judge = (st) => (GOOGLE_STATES.includes(st) ? "Google" : "메이크샵");

  /* ---------------- 전송 큐 (자동 처리 시뮬레이션) ---------------- */
  let qTimer = null;
  function scheduleQueue() {
    if (!state.queueAuto || !feedConnected()) return;
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      const n = api.processQueue();
      if (n && window.UI) UI.toast(`전송 큐 처리 완료 — 반영대기 상품 ${n}건이 Merchant Center로 전송되어 검토중으로 바뀌었습니다.`, "info");
      if (n && window.App && !document.querySelector(".modal-overlay")) App.render();
    }, 5000);
  }
  function markDirty(cats, ids) {
    products().forEach((p) => {
      if (ids.includes(p.id) || (!p.gpc && cats.includes(p.cat))) gp(p).dirty = true;
    });
  }

  const api = {
    STATES,
    GOOGLE_STATES,
    get s() { return state; },
    save,
    nowStr,
    accountOk, mcState, adsState, feedConnected, queueBlocked,
    gp, validGpc, effUse, restriction, status, counts, judge, products,
    scheduleQueue,

    reset(preset) {
      state = preset === "full" ? presetFull() : preset === "account" ? presetAccountOnly() : (() => { const s = baseState(); seedEmpty(s); return s; })();
      save();
    },

    /* ---------- 연결 ---------- */
    connectAccount() {
      state.account = "connected";
      save();
    },
    disconnectAll() {
      const keep = { apiFail: state.apiFail, noPerm: state.noPerm, catUse: state.catUse };
      state = Object.assign(baseState(), keep);
      seedEmpty(state);
      save();
    },
    connectMc(acc) {
      state.mc = "connected";
      state.mcAccount = clone(acc);
      state.mcSuspended = false;
      state.domain = "none";
      state.shipping = false;
      state.firstMatchDone = false;
      state.autoMatchShown = false;
      seedEmpty(state);
      state.lastFull = state.lastAuto = state.lastResult = null;
      state.history = [];
      save();
    },
    /** Merchant Center 계정 변경 — 상품 피드 정보 초기화 후 전송 대상 반영대기 (POL-048) */
    changeMc(acc) {
      state.mcAccount = clone(acc);
      products().forEach((p) => Object.assign(gp(p), { status: null, issue: null, dirty: true }));
      save();
      scheduleQueue();
    },
    /** Merchant Center만 해제 — 자동 전송 중단, 큐 비움, Google Ads 유지 (POL-049) */
    disconnectMc() {
      state.mc = "none";
      state.mcAccount = null;
      state.domain = "none";
      state.shipping = false;
      state.firstMatchDone = false;
      state.autoMatchShown = false;
      seedEmpty(state);
      if (state.mcLink === "linked") state.mcLink = "none";
      save();
    },
    connectAds(acc) {
      state.ads = "connected";
      state.adsAccount = clone(acc);
      state.mcLink = state.mc !== "none" ? "linked" : "none";
      save();
    },
    disconnectAds() {
      state.ads = "none";
      state.adsAccount = null;
      save();
    },

    /* ---------- 공통 GPC 변경 ---------- */
    /** Meta 쪽에서 공통 GPC를 바꾼 경우 호출된다 (Store.saveCategoryMap / saveProductSettings) */
    onGpcChanged(cats, ids) {
      if (!feedConnected()) return;
      markDirty(cats, ids);
      save();
      scheduleQueue();
    },
    /** 카테고리 매칭 모달 [상품 피드 반영] — 공통 GPC·사용여부 저장, 두 채널 재판정 (POL-065, POL-072) */
    saveCategoryMatch(rows) {
      const changedCats = [];
      rows.forEach((r) => {
        const before = Store.s.catMap[r.cat] || null;
        if (r.gpc !== before) {
          if (r.gpc) Store.s.catMap[r.cat] = r.gpc;
          else delete Store.s.catMap[r.cat];
          changedCats.push(r.cat);
        }
        const wasUse = state.catUse[r.cat] !== false;
        state.catUse[r.cat] = r.use;
        if (wasUse !== r.use) changedCats.push(r.cat);
      });
      // 매칭된 카테고리 상품 중 전송 조건 충족 상품을 반영대기로 큐 등록 (최초 동기화 포함)
      products().forEach((p) => {
        if (changedCats.includes(p.cat) || !state.firstMatchDone) gp(p).dirty = true;
      });
      if (!state.firstMatchDone) {
        state.firstMatchDone = true;
        state.history.unshift({ atStr: nowStr(), type: "최초 동기화", result: "진행 중", target: products().filter((p) => status(p) === "반영대기").length, ok: 0, fail: 0 });
      }
      Store.save();
      Store.applyCommonGpc(changedCats, []);
      save();
      scheduleQueue();
    },
    /** 상품 상세·선택 수정 [상품 피드 반영] (POL-065, POL-066, POL-070) */
    saveProducts(rows) {
      const gpcChanged = [];
      const res = { queued: 0, restricted: 0, unused: 0 };
      rows.forEach((row) => {
        const p = products().find((x) => x.id === row.id);
        const g = gp(p);
        if ((row.gpc || null) !== (Store.effGpc(p) || null)) {
          p.gpc = row.gpc || null;
          gpcChanged.push(p.id);
        }
        g.use = row.use;
        g.gender = row.gender || null;
        g.age = row.age || null;
        g.dirty = true;
        const st = status(p);
        if (st === "반영대기") res.queued++;
        else if (st === "노출제한") res.restricted++;
        else if (st === "사용안함") res.unused++;
      });
      Store.save();
      if (gpcChanged.length) Store.applyCommonGpc([], gpcChanged);
      save();
      scheduleQueue();
      return res;
    },

    /* ---------- 전송·동기화 ---------- */
    queueSize: () => products().filter((p) => status(p) === "반영대기").length,
    processQueue() {
      if (queueBlocked()) return 0;
      let n = 0;
      products().forEach((p) => {
        if (status(p) === "반영대기") {
          Object.assign(gp(p), { status: "검토중", issue: null, dirty: false });
          n++;
        }
      });
      if (n) {
        state.lastAuto = nowStr();
        state.lastResult = "성공";
        const pending = state.history.find((h) => h.result === "진행 중");
        if (pending) Object.assign(pending, { result: "성공", ok: n, target: n });
        else state.history.unshift({ atStr: nowStr(), type: "자동 동기화", result: "성공", target: n, ok: n, fail: 0 });
        state.syncing = false;
      }
      save();
      return n;
    },
    /** Google 심사 결과 반영 시뮬레이션: 검토중 → 활동중/미승인 */
    syncGoogle() {
      let n = 0;
      products().forEach((p) => {
        const g = gp(p);
        if (status(p) === "검토중") {
          n++;
          if (p.id % 8 === 0) { g.status = "미승인"; g.issue = "image_issue"; }
          else g.status = "활동중";
        }
      });
      save();
      return n;
    },
    /** [다시 동기화] — 전송 조건 충족 전체 상품 큐 등록 (POL-060) */
    fullSync() {
      products().forEach((p) => {
        const st = status(p);
        if (st !== "사용안함" && st !== "노출제한") gp(p).dirty = true;
      });
      state.syncing = true;
      state.lastFull = nowStr();
      state.lastResult = "진행 중";
      state.history.unshift({ atStr: nowStr(), type: "전체 동기화", result: "진행 중", target: api.queueSize(), ok: 0, fail: 0 });
      save();
      scheduleQueue();
    },

    /* ---------- 통합 화면 값 ---------- */
    /** 채널 등록 상품 수: 메이크샵이 전송해 채널에 등록된 상품(활동중·검토중·미승인) (POL-018) */
    registeredCount: () => products().filter((p) => GOOGLE_STATES.includes(status(p))).length,
  };
  if (!Object.keys(state.prod).length) seedEmpty(state);
  return api;
})();
