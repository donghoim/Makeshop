/* ==========================================================================
   상태 저장소 + 상품 피드 판정 로직 (05_Policy 5장 기준)
   - 상태는 localStorage 에 저장되어 새로고침 후에도 유지된다(시나리오 패널에서 초기화).
   - 상태 판정 우선순위: 사용안함 → 노출제한 → 반영대기 → Meta 상태(활동중/검토중/미승인)
   - 반영대기: 전송 조건을 충족해 전송 큐에 등록된 상태. 큐가 자동으로 Meta 전송(검토중)하며 운영자 수동 전송은 없다.
   ========================================================================== */
const Store = (function () {
  const KEY = "metaProto.v3"; // v3: 반영대기·전송 큐, 커머스 계정 제외 (2026-10-20)
  const M = window.MOCK;
  const FEED_STATES = ["활동중", "검토중", "미승인", "노출제한", "사용안함", "반영대기"];
  const META_STATES = ["활동중", "검토중", "미승인"];
  const DEFAULT_COLUMNS = ["campaign_name", "objective", "impressions", "clicks", "purchases", "roas", "revenue", "spend"];

  function nowStr() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------------- 프리셋 ---------------- */
  function baseState() {
    return {
      connected: false,
      legacy: false, migrationComplete: false, legacyConnection: null, consentHistory: [],
      ig: true,               // Instagram 연결 여부 (FBE 위저드에서 스킵 시 false)
      assetError: "none",     // 'none' | 'page' | 'pixel' — 자산 조회 실패(확인불가) 시뮬레이션
      domainVerified: false,
      unlinkResult: "success", // 'success' | 'network' | 'auth' — 연결 해제 결과 시뮬레이션
      categorySaved: false,
      catMap: {},
      lastUpdate: null,
      products: clone(M.products).map((p) => Object.assign(p, { meta: null, reject: null, dirty: false })),
      ads: { status: "활성", billing: "선불", capi: "off", naver: "off", kakao: "off" },
      queueAuto: true,        // 전송 큐 자동 처리 (시나리오 패널에서 일시정지 가능)
      prereq: { naver: true, kakao: false },
      columns: DEFAULT_COLUMNS.slice(),
    };
  }
  function presetConnected() {
    const s = baseState();
    s.connected = true;
    s.categorySaved = true;
    s.lastUpdate = nowStr();
    M.categories.forEach((c) => {
      if (!["c16"].includes(c.id)) s.catMap[c.id] = c.googleGpc || defaultGpcFor(c.id);
    });
    s.products = clone(M.products).map((p) => Object.assign(p, { dirty: false }));
    return s;
  }
  function defaultGpcFor(catId) {
    return { c02: "5506", c04: "2271", c05: "212", c06: "5388", c08: "6551", c09: "100", c10: "1933", c11: "201", c12: "2169", c13: "4171", c14: "2660", c15: "2660" }[catId] || null;
  }

  let state = load() || baseState();
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
    listeners.forEach((fn) => fn());
  }
  const listeners = [];

  /* ---------------- 판정 ---------------- */
  const cat = (id) => M.categories.find((c) => c.id === id) || null;
  const catPath = (id) => (cat(id) ? cat(id).path.join(" > ") : null);
  const gpc = (id) => M.gpcList.find((g) => g.id === id) || null;
  const isApparel = (gpcId) => !!gpcId && (gpc(gpcId) || { path: "" }).path.startsWith(M.APPAREL);
  const effGpc = (p) => p.gpc || (p.cat ? state.catMap[p.cat] : null) || null;

  function restriction(p) {
    const r = p.r || {};
    if (!effGpc(p)) return "noGpc";
    if (r.display) return "display";
    if (r.sale) return "sale";
    if (r.soldout) return "soldout";
    if (p.price === 0) return "price0";
    if (r.priceText) return "priceText";
    if (!p.cat) return "noCategory";
    if (p.name.includes("개인결")) return "privatePay";
    if (r.noImage) return "noImage";
    if (r.noDesc) return "noDesc";
    if (r.memberOnly) return "memberOnly";
    if (r.loginPrice) return "loginPrice";
    if (p.options > 300 || r.editionOver) return "editionOver";
    return null;
  }
  function status(p) {
    if (!p.useFeed) return "사용안함";
    if (restriction(p)) return "노출제한";
    if (p.meta && !p.dirty) return p.meta;
    return "반영대기";
  }
  function reason(p) {
    const st = status(p);
    if (st === "노출제한") return M.restrictReasons.find((x) => x.key === restriction(p)).text;
    if (st === "미승인") return M.rejectReasons[p.reject] || M.rejectReasons.COMMERCE_POLICY_VIOLATION;
    return "";
  }
  /** 연동 상품 수: Meta Catalog 에 실제 등록된 item(옵션 조합) 수. 미반영·제외 상품은 0 */
  function linkedCount(p) {
    return META_STATES.includes(status(p)) ? Math.max(1, p.options) : 0;
  }
  function counts(list) {
    const c = { 전체: list.length };
    FEED_STATES.forEach((s) => (c[s] = 0));
    list.forEach((p) => c[status(p)]++);
    return c;
  }

  /* ---------------- 전송 큐 (자동 처리 시뮬레이션) ---------------- */
  let qTimer = null;
  function scheduleQueue() {
    if (!state.queueAuto || !state.connected) return;
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      const n = api.processQueue();
      if (n && window.UI) UI.toast(`전송 큐 처리 완료 — 반영대기 상품 ${n}건이 Meta로 전송되어 검토중으로 바뀌었습니다.`, "info");
      if (n && window.App && !document.querySelector(".modal-overlay")) App.render();
    }, 5000);
  }

  /* ---------------- 액션 ---------------- */
  const api = {
    FEED_STATES,
    META_STATES,
    DEFAULT_COLUMNS,
    get s() { return state; },
    onChange(fn) { listeners.push(fn); },
    save,
    scheduleQueue,
    cat, catPath, gpc, isApparel, effGpc, restriction, status, reason, linkedCount, counts,
    leafCategories: () => M.categories,

    reset(preset) {
      clearTimeout(qTimer);
      state = preset === "connected" || preset === "legacy" ? presetConnected() : baseState();
      if (preset === "legacy") {
        state.legacy = true; state.connected = false;
        state.legacyConnection = { active: true, pixel: M.account.pixelId || "existing-pixel", domainCode: "existing-domain", naver: "on" };
        state.ads.naver = "on";
      }
      save();
    },

    migrationPending() { return !!state.legacy && !state.migrationComplete; },
    completeMigration(sel) {
      state.connected = true;
      state.migrationComplete = true;
      state.categorySaved = false;
      api.reconfigure(sel);
      save(); scheduleQueue();
    },
    /** FBE 연동 완료 (최초) */
    connect(sel) {
      state.connected = true;
      state.ig = sel ? sel.igChoice !== "skip" : true;
      state.categorySaved = false;
      state.catMap = {};
      state.lastUpdate = null;
      state.products = clone(M.products).map((p) => Object.assign(p, { meta: null, reject: null, dirty: false }));
      save();
      scheduleQueue();
    },
    /** [설정] 재연동 — 변경된 자산 반영 */
    reconfigure(sel) {
      if (sel) state.ig = sel.igChoice !== "skip";
      state.assetError = "none";
      save();
      if (sel && sel.catalogChanged) api.changeCatalog();
    },
    disconnect() {
      const keep = { domainVerified: state.domainVerified, unlinkResult: state.unlinkResult, prereq: state.prereq, columns: state.columns };
      state = Object.assign(baseState(), keep);
      save();
    },
    /** 카테고리 단위 매칭 [상품 피드 반영] → 매칭값 저장 + 전송 대상 상품 큐 등록(반영대기) */
    saveCategoryMap(map) {
      Object.keys(map).forEach((cid) => {
        const before = state.catMap[cid] || null;
        const after = map[cid] || null;
        if (after) state.catMap[cid] = after;
        else delete state.catMap[cid];
        if (before !== after) {
          state.products.forEach((p) => {
            if (p.cat === cid && !p.gpc) p.dirty = true;
          });
        }
      });
      state.categorySaved = true;
      state.lastUpdate = nowStr();
      save();
      scheduleQueue();
    },
    /** 전송 큐 처리 — 전송 시점 최신 정보로 재판정, 통과 상품만 최신 1건 Meta 전송(검토중) */
    processQueue() {
      if (!state.connected || api.migrationPending()) return 0;
      let n = 0;
      state.products.forEach((p) => {
        if (status(p) === "반영대기") {
          p.meta = "검토중";
          p.reject = null;
          p.dirty = false;
          n++;
        }
      });
      if (n) state.lastUpdate = nowStr();
      save();
      return n;
    },
    queueSize: () => state.products.filter((p) => status(p) === "반영대기").length,
    /** 상품 단위 설정 [상품 피드 반영] — 상품 단위 저장 + 전송 대상 상품 큐 등록(반영대기) */
    saveProductSettings(rows) {
      const res = { queued: 0, restricted: 0, unused: 0 };
      rows.forEach((row) => {
        const p = state.products.find((x) => x.id === row.id);
        p.useFeed = row.useFeed;
        if (row.useFeed) {
          if (row.gpc !== effGpc(p)) p.dirty = true;
          p.gpc = row.gpc || null;
          p.gender = isApparel(p.gpc || effGpc(p)) ? row.gender : null;
          p.age = isApparel(p.gpc || effGpc(p)) ? row.age : null;
          p.dirty = true; // 반영 = 큐 등록
        }
        const st = status(p);
        if (st === "반영대기") res.queued++;
        else if (st === "노출제한") res.restricted++;
        else if (st === "사용안함") res.unused++;
      });
      state.lastUpdate = nowStr();
      save();
      scheduleQueue();
      return res;
    },
    /** Meta 심사 결과 동기화 시뮬레이션: 검토중 → 활동중/미승인 */
    syncMeta() {
      let n = 0;
      state.products.forEach((p) => {
        if (p.meta === "검토중" && !p.dirty && status(p) === "검토중") {
          n++;
          if (p.id % 7 === 0) {
            p.meta = "미승인";
            p.reject = "INVALID_IMAGE";
          } else p.meta = "활동중";
        }
      });
      state.lastUpdate = nowStr();
      save();
      return n;
    },
    /** 카탈로그 변경(재설정) — 내부 피드 정보 초기화 → 전송 대상 상품 큐 재등록(반영대기) */
    changeCatalog() {
      state.products.forEach((p) => {
        p.meta = null;
        p.reject = null;
        p.dirty = false;
      });
      state.lastUpdate = nowStr();
      save();
      scheduleQueue();
    },
  };
  return api;
})();
