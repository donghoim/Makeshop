/* ==========================================================================
   Google 구글애즈 탭 — v0.1 화면설계서 6-1부터 6-7 기준, 화면 틀만 Meta 디자인으로 변경
   - 계정 정보·Merchant Center 연결 단계(POL-077), 광고 측정(POL-079), 광고 기준·상품 기준 성과(POL-080부터 POL-085),
     광고 운영 상태 모달(POL-086부터 POL-089)
   ========================================================================== */
const GAds = (function () {
  const C = () => GCommon;
  const SIZES = [20, 30, 50, 70, 100];
  const PERIODS = [["today", "오늘"], ["yesterday", "어제"], ["7d", "7일"], ["30d", "1개월"], ["month", "이번 달"], ["custom", "직접설정"]];
  /** 광고 기준 서브탭: 보는 관점별로 기본 항목을 다르게 둔다 (POL-085). 캠페인 유형으로 나누지 않는다 */
  const SUBS = [["basic", "기본 정보"], ["perf", "광고 성과"], ["conv", "전환 성과"], ["ops", "캠페인 운영"], ["shopping", "쇼핑 광고"]];
  const view = { mode: "ad", period: "7d", sub: "basic", from: null, to: null, q: "", page: 1, size: 20 };

  /* ---------------- 항목 카탈로그와 서브탭별 기본값 ---------------- */
  const BID = { "실적 최대화": "전환 가치 극대화", 쇼핑: "타깃 광고 투자수익(ROAS)", 검색: "클릭수 최대화", 디스플레이: "전환수 최대화", 동영상: "타깃 CPM" };
  const won = (n) => UI.fmt(Math.round(n)) + "원";
  const pct = (a, b) => (b ? ((a / b) * 100).toFixed(2) + "%" : "-");
  const dstr = (n) => { const d = Perf.addDays(Perf.today0(), n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const AD_COLS = {
    name: { label: "캠페인명", desc: "캠페인 이름", fixed: true, left: true, r: (a) => `<span class="camp-name">${UI.esc(a.name)}</span>` },
    type: { label: "캠페인 유형", desc: "광고 캠페인 유형", r: (a) => a.type },
    status: { label: "상태", desc: "캠페인 운영 상태", r: (a) => (a.c.e != null && a.c.e < 0 ? C().pill("종료", "gray") : C().pill("운영 중")) },
    budget: { label: "일 예산", desc: "일일 광고 예산", r: (a) => won(Math.round((a.c.cost * 1.1) / 1000) * 1000) },
    start: { label: "시작일", desc: "광고 시작일", r: (a) => dstr(a.c.s) },
    end: { label: "종료일", desc: "광고 종료일", r: (a) => (a.c.e == null ? "-" : dstr(a.c.e)) },
    imp: { label: "노출수", desc: "광고 노출 횟수", r: (a) => UI.fmt(a.imp) },
    clk: { label: "클릭수", desc: "광고 클릭 횟수", r: (a) => UI.fmt(a.clk) },
    ctr: { label: "CTR", desc: "광고 클릭률", r: (a) => pct(a.clk, a.imp) },
    cpc: { label: "평균 CPC", desc: "평균 클릭당 비용", r: (a) => (a.clk ? won(a.spend / a.clk) : "-") },
    cpm: { label: "CPM", desc: "1,000회 노출당 비용", r: (a) => (a.imp ? won((a.spend / a.imp) * 1000) : "-") },
    spend: { label: "광고비", desc: "광고 집행 비용", r: (a) => won(a.spend) },
    conv: { label: "전환수", desc: "전체 전환 횟수", r: (a) => UI.fmt(a.conv) },
    rev: { label: "전환가치", desc: "전환 금액", r: (a) => won(a.rev) },
    cvr: { label: "전환율", desc: "클릭 대비 전환 비율", r: (a) => pct(a.conv, a.clk) },
    cpa: { label: "CPA", desc: "전환당 광고비", r: (a) => (a.conv ? won(a.spend / a.conv) : "-") },
    roas: { label: "ROAS", desc: "광고 수익률", r: (a) => (a.spend ? Math.round((a.rev / a.spend) * 100) + "%" : "-") },
    vpc: { label: "전환당 가치", desc: "전환 1건당 평균 전환가치", r: (a) => (a.conv ? won(a.rev / a.conv) : "-") },
    allConv: { label: "전체 전환수", desc: "주 전환 액션 외 전체 전환 횟수", r: (a) => UI.fmt(Math.round(a.conv * 1.3)) },
    allRev: { label: "전체 전환가치", desc: "전체 전환 액션 기준 전환가치", r: (a) => won(a.rev * 1.15) },
    bid: { label: "입찰 전략", desc: "광고 입찰 방식", r: (a) => BID[a.type] || "-" },
    opt: { label: "최적화 점수", desc: "Google 최적화 점수", r: (a) => 62 + ((a.name.length * 7) % 33) + "%" },
    shopUse: { label: "상품 광고 사용 여부", desc: "Merchant Center 상품을 쓰는 캠페인인지", needMc: true, r: (a) => (a.c.shopping ? C().pill("사용") : C().pill("미사용", "gray")) },
    pmax: { label: "상품 기반 P-Max 여부", desc: "상품을 쓰는 실적 최대화 캠페인인지", needMc: true, r: (a) => (a.c.shopping && a.type === "실적 최대화" ? C().pill("해당") : C().pill("해당없음", "gray")) },
  };
  const AD_DEFAULT = {
    basic: ["name", "type", "status", "start", "end"],
    perf: ["name", "imp", "clk", "ctr", "cpc", "spend"],
    conv: ["name", "conv", "clk", "rev", "cvr", "cpa", "roas"],
    ops: ["name", "budget", "bid", "opt"],
    shopping: ["name", "type", "shopUse", "pmax"],
  };
  const PR_COLS = {
    info: { label: "상품정보", desc: "상품명·Google 상품 ID", fixed: true, left: true, r: (r) => `${r.name ? UI.esc(r.name) : '<span class="muted">삭제된 상품</span>'}<div class="muted small">${r.id}</div>` },
    camp: { label: "캠페인명", desc: "상품이 노출된 캠페인", fixed: true, r: (r) => UI.esc(r.camp) },
    imp: { label: "노출수", desc: "광고 노출 횟수", r: (r) => UI.fmt(r.imp) },
    clk: { label: "클릭수", desc: "광고 클릭 횟수", r: (r) => UI.fmt(r.clk) },
    ctr: { label: "CTR", desc: "광고 클릭률", r: (r) => pct(r.clk, r.imp) },
    spend: { label: "광고비", desc: "광고 집행 비용", r: (r) => won(r.spend) },
    conv: { label: "전환수", desc: "전체 전환 횟수", r: (r) => UI.fmt(r.conv) },
    rev: { label: "전환가치", desc: "전환 금액", r: (r) => won(r.rev) },
    roas: { label: "ROAS", desc: "광고 수익률", r: (r) => (r.spend ? Math.round((r.rev / r.spend) * 100) + "%" : "-") },
    cpc: { label: "평균 CPC", desc: "평균 클릭당 비용", r: (r) => (r.clk ? won(r.spend / r.clk) : "-") },
    cvr: { label: "전환율", desc: "클릭 대비 전환 비율", r: (r) => pct(r.conv, r.clk) },
    cpa: { label: "CPA", desc: "전환 1건당 평균 광고비", r: (r) => (r.conv ? won(r.spend / r.conv) : "-") },
    vpc: { label: "전환당 가치", desc: "전환 1건당 평균 전환가치", r: (r) => (r.conv ? won(r.rev / r.conv) : "-") },
    allConv: { label: "전체 전환수", desc: "주 전환 액션 외 전체 전환 횟수", r: (r) => UI.fmt(Math.round(r.conv * 1.3)) },
    allRev: { label: "전체 전환가치", desc: "전체 전환 액션 기준 전환가치", r: (r) => won(r.rev * 1.15) },
    pid: { label: "상품 ID", desc: "Google 상품 ID", r: (r) => r.id },
    gpc: { label: "Google 상품 카테고리", desc: "메이크샵이 전송한 Google 상품 카테고리", r: (r) => (r.p ? C().gpcLabel(Store.effGpc(r.p)) || "-" : "-") },
  };
  const PR_DEFAULT = ["info", "camp", "imp", "clk", "ctr", "conv", "spend", "rev", "roas"];
  const colKey = () => (view.mode === "product" ? "product" : "ad:" + view.sub);
  const catalog = () => (view.mode === "product" ? PR_COLS : AD_COLS);
  const defaults = () => (view.mode === "product" ? PR_DEFAULT : AD_DEFAULT[view.sub]);
  const mcOff = () => GStore.s.mc === "none";
  /** 사용 불가 항목: Merchant Center 연결이 필요한 항목은 미연결이면 고를 수 없고 표에도 나오지 않는다 (POL-085) */
  const unusable = (k) => !!catalog()[k].needMc && mcOff();
  /** 고정 항목은 저장값과 관계없이 항상 맨 앞에 둔다 */
  function withFixed(list) {
    const cat = catalog();
    const fixed = Object.keys(cat).filter((k) => cat[k].fixed);
    return fixed.concat(list.filter((k) => cat[k] && !cat[k].fixed));
  }
  const curCols = () => withFixed(GStore.cols()[colKey()] || defaults()).filter((k) => !unusable(k));

  const productMode = () => GStore.s.mc !== "none" && GStore.s.mcLink === "linked"; // 상품 기준 탭 노출 (POL-080)
  function range(period) {
    const t = Perf.today0();
    const a = Perf.addDays;
    switch (period) {
      case "today": return [t, t, [a(t, -1), a(t, -1)]];
      case "yesterday": return [a(t, -1), a(t, -1), [a(t, -2), a(t, -2)]];
      case "7d": return [a(t, -7), a(t, -1), [a(t, -14), a(t, -8)]];
      case "30d": return [a(t, -30), a(t, -1), [a(t, -60), a(t, -31)]];
      case "month": { const f = new Date(t.getFullYear(), t.getMonth(), 1); const n = Math.round((t - f) / 86400000) + 1; return [f, t, [a(f, -n), a(f, -1)]]; }
      case "custom": {
        if (!view.from || !view.to) return range("yesterday");
        const f = parse(view.from);
        const e = parse(view.to);
        const n = Math.round((e - f) / 86400000) + 1;
        return [f, e, [a(f, -n), a(f, -1)]];
      }
    }
  }

  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parse = (x) => { const [y, m, d] = x.split("-").map(Number); return new Date(y, m - 1, d); };

  function render(root) {
    const s = GStore.s;
    const st = GStore.adsState();
    root.appendChild(App.banner("구글애즈", "Google Ads 광고 측정 상태와 캠페인·상품 광고 성과를 확인하는 공간입니다.<br>광고 운영 상태와 Google이 제안하는 개선 권장사항을 함께 확인할 수 있습니다."));
    if (st === "reauth") {
      const n = document.createElement("p");
      n.className = "note note--warn";
      n.innerHTML = `${UI.icon.info}<span>Google Ads 재인증이 필요합니다. 아래는 마지막으로 확인된 정보입니다.</span><a class="lnk" href="#/google/connect">연결관리로 이동</a>`;
      root.appendChild(n);
    }
    root.appendChild(accountSection());
    root.appendChild(measureSection());
    if (!productMode() && view.mode === "product") view.mode = "ad"; // 조회 중 MC 연동이 해제되면 광고 기준으로 전환
    const perf = App.section("광고 성과", `<select class="select select--sm" id="gads-size" aria-label="페이지당 노출 개수">${SIZES.map((n) => `<option value="${n}" ${n === view.size ? "selected" : ""}>${n}개씩 보기</option>`).join("")}</select><button type="button" class="btn btn--line btn--sm" data-act="cols">${UI.icon.gear} 항목</button>`, '<div id="gads-perf"></div>');
    root.appendChild(perf);
    const box = perf.querySelector("#gads-perf");
    perf.querySelector("#gads-size").addEventListener("change", (e) => { view.size = +e.target.value; view.page = 1; paintPerf(box); });
    perf.querySelector('[data-act="cols"]').addEventListener("click", () => openColumns(() => paintPerf(box)));
    paintPerf(box);
  }

  /* ---------------- 계정 정보 ---------------- */
  function accountSection() {
    const s = GStore.s;
    const a = s.adsAccount || window.GMOCK.adsAccounts[0];
    const stage = s.mc !== "none" && s.mcLink === "linked" ? "MC 연동 완료" : s.mcLink === "detected" && s.mc === "none" ? "MC 연결 감지" : "Google Ads만 연결";
    const body = `<dl class="kv">
      <div class="kv__row"><dt>광고 계정</dt><dd>${UI.esc(a.name)} (${a.id}) ${GStore.adsState() === "reauth" ? C().pill("재인증 필요", "red") : C().pill("연결됨")}</dd><dd class="kv__link"><a class="ext" data-ext="Google Ads 바로가기" data-url="https://ads.google.com/aw/overview">Google Ads 바로가기 ${UI.icon.ext}</a></dd></div>
      <div class="kv__row"><dt>Merchant Center 연결</dt><dd>${C().pill(stage, stage === "MC 연동 완료" ? "blue" : "gray")}</dd></div>
      ${stage === "MC 연결 감지" ? `<div class="kv__row"><dt></dt><dd class="kv__wide"><div class="infobox">${UI.icon.info}<div>이 Google Ads 계정에 이미 연결된 Merchant Center 계정이 있습니다(${window.GMOCK.merchantCandidates[0].id}).<br>메이크샵에 연결하면 쇼핑 광고와 상품 기준 성과를 확인할 수 있습니다.<div style="margin-top:10px"><button type="button" class="btn btn--primary btn--sm" data-act="link-mc">이 Merchant Center를 메이크샵에 연결</button></div></div></div></dd></div>` : ""}
      ${stage === "Google Ads만 연결" ? `<div class="kv__row"><dt></dt><dd class="kv__wide"><p class="note">${UI.icon.info}<span>Merchant Center가 연결되지 않아 쇼핑 광고 성과는 확인할 수 없습니다. 오류가 아닙니다.</span></p></dd></div>` : ""}
    </dl>`;
    const el = App.section("광고 계정 정보", '<button type="button" class="btn btn--line btn--sm" data-act="status">광고 운영 상태</button>', body);
    C().bindExt(el);
    el.querySelector('[data-act="status"]').addEventListener("click", openStatus);
    const lk = el.querySelector('[data-act="link-mc"]');
    if (lk) lk.addEventListener("click", linkDetected);
    return el;
  }
  /** 감지된 MC 연결: 계정 선택 생략, 동의 → 전화번호 인증 → 약관 동의 (POL-078) */
  async function linkDetected() {
    if (!(await UI.confirm("감지된 Merchant Center 계정을 메이크샵에 연결합니다.\n사업자 정보 제공 동의, 대표 전화번호 인증, 판매자 약관 동의를 진행합니다."))) return;
    GStore.connectMc(window.GMOCK.merchantCandidates[0]);
    GStore.s.mcLink = "linked";
    GStore.save();
    UI.toast("Merchant Center가 연결되었습니다. 연결관리에서 도메인 인증과 판매국가·배송 설정을 진행해 주세요.", "success");
    App.render();
  }

  /* ---------------- 광고 측정 ---------------- */
  function measureSection() {
    const m = GStore.s.measure;
    const row = (label, ok, desc) => `<div class="kv__row"><dt>${label}</dt><dd>${ok ? C().pill("정상") : C().pill("설정 필요", "gray")} <span class="muted">${desc}</span></dd></div>`;
    const body = `<dl class="kv">${row("Google Tag", m.tag, "메이크샵이 설치한 연동 계정 기준 태그")}${row("향상된 전환", m.enhanced, "메이크샵 설정 완료 여부")}${row("전환 상태", m.conv, "전환 액션 존재 + 활성")}</dl>
      <p class="note">${UI.icon.info}<span>'정상'은 설정이 완료되었다는 뜻이며 전환 수집을 보장하지는 않습니다.</span></p>`;
    return App.section("광고 측정", "", body);
  }

  /* ---------------- 광고 성과 (Meta 광고 관리 탭 캠페인 목록과 같은 틀: 조회기간·검색·성과 카드·표·페이지) ---------------- */
  function paintPerf(box) {
    const pm = productMode();
    const shoppingOk = GStore.s.mc !== "none";
    const t = Perf.today0();
    const [f, to, prev] = range(view.period);
    if (view.sub === "shopping" && !shoppingOk) view.sub = "basic"; // MC 미연결이면 쇼핑 광고 서브탭 사용 불가 (POL-083)
    const filter = (c) => (view.mode === "product" ? c.shopping : true);
    const cur = Perf.rows("google", f, to, filter);
    const before = Perf.sum(Perf.rows("google", prev[0], prev[1], filter));
    const tot = Perf.sum(cur);
    const q = view.q.trim().toLowerCase();
    const list = (view.mode === "ad" ? cur : productRows(cur)).filter((r) => !q || (r.name || "").toLowerCase().includes(q)).sort((x, y) => y.spend - x.spend);
    const pages = Math.max(1, Math.ceil(list.length / view.size));
    if (view.page > pages) view.page = pages;
    const rows = list.slice((view.page - 1) * view.size, view.page * view.size);
    const pct = (a, b) => (b ? ((a - b) / b) * 100 : null);
    const roas = tot.spend ? (tot.rev / tot.spend) * 100 : null;
    const card = (label, val, diff, extra) => `
      <div class="kpi"><div class="kpi__label">${label}</div><div class="kpi__val">${val}</div>
      <div class="kpi__sub">${diff == null ? '<span class="muted">비교 데이터 없음</span>' : `<span class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "↑" : "↓"} ${Math.abs(diff).toFixed(1)}%</span> <span class="muted">직전 동일 기간 대비</span>`}</div>${extra || ""}</div>`;
    const custom = view.period === "custom";
    const unit = view.mode === "ad" ? "캠페인" : "상품";
    box.innerHTML = `
      ${pm ? `<div class="perf-top"><div class="seg">${[["ad", "광고 기준"], ["product", "상품 기준"]].map((x) => `<button type="button" data-mode="${x[0]}" class="${view.mode === x[0] ? "is-active" : ""}">${x[1]}</button>`).join("")}</div></div>` : ""}
      <div class="period-bar">
        <div class="seg" role="group" aria-label="조회기간">${PERIODS.map((p) => `<button type="button" class="${view.period === p[0] ? "is-active" : ""}" data-p="${p[0]}">${p[1]}</button>`).join("")}</div>
        <div class="dates"><input type="date" id="g-from" value="${ymd(f)}" max="${ymd(t)}" ${custom ? "" : "disabled"} aria-label="시작일"/><span>~</span><input type="date" id="g-to" value="${custom && !view.to ? "" : ymd(to)}" min="${ymd(f)}" max="${ymd(t)}" ${custom ? "" : "disabled"} aria-label="종료일"/></div>
        <form class="search search--sm" id="g-search"><button type="submit" aria-label="검색">${UI.icon.search}</button><input type="search" placeholder="${unit}명으로 검색" value="${UI.esc(view.q)}" aria-label="${unit}명 검색"/></form>
      </div>
      <div class="kpis">
        ${card("광고비", UI.fmt(tot.spend), pct(tot.spend, before.spend))}
        ${card("노출수", UI.fmt(tot.imp), pct(tot.imp, before.imp))}
        ${card("클릭수", UI.fmt(tot.clk), pct(tot.clk, before.clk))}
        ${card("전환수", UI.fmt(tot.conv), pct(tot.conv, before.conv))}
        ${card("전환가치", UI.fmt(tot.rev), pct(tot.rev, before.rev), `<div class="kpi__roas">ROAS <b class="${roas == null ? "" : roas >= 300 ? "up" : "down"}">${roas == null ? "-" : Math.round(roas) + "%"}</b></div>`)}
      </div>
      <p class="note note--right">${UI.icon.info}<span>성과 데이터는 Google Ads API 기준이며 반영까지 최대 1일 이상 소요될 수 있습니다.</span><a class="ext" data-ext="Google Ads 바로가기" data-url="https://ads.google.com/aw/campaigns">Google Ads 바로가기 ${UI.icon.ext}</a></p>
      ${view.mode === "ad" ? `<div class="stabs stabs--sub">${SUBS.map((x) => { const dis = x[0] === "shopping" && !shoppingOk; return `<button type="button" class="stab ${x[0] === view.sub ? "is-active" : ""}" data-sub="${x[0]}" ${dis ? 'disabled title="Merchant Center 연결이 필요합니다."' : ""}>${x[1]}</button>`; }).join("")}</div>` : ""}
      <div class="table-wrap">${table(curCols(), rows, catalog(), unit)}</div>
      <div class="list-foot"><div class="list-foot__left muted small">조회기간 ${ymd(f)} ~ ${ymd(to)} · 총 ${list.length}개 ${unit} · 광고 비용 높은 순</div><div id="g-pager"></div><div></div></div>`;
    box.querySelector("#g-pager").appendChild(UI.pagination(list.length, view.page, view.size, (p) => { view.page = p; paintPerf(box); }));
    box.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { view.mode = b.dataset.mode; view.q = ""; view.page = 1; paintPerf(box); }));
    box.querySelectorAll("[data-sub]").forEach((b) => b.addEventListener("click", () => { view.sub = b.dataset.sub; paintPerf(box); }));
    box.querySelectorAll("[data-p]").forEach((b) =>
      b.addEventListener("click", () => {
        view.period = b.dataset.p;
        if (view.period === "custom") { const [a, z] = range("yesterday"); view.from = view.from || ymd(a); view.to = view.to || ymd(z); }
        view.page = 1;
        paintPerf(box);
      })
    );
    const fromEl = box.querySelector("#g-from");
    const toEl = box.querySelector("#g-to");
    fromEl.addEventListener("change", () => {
      if (!fromEl.value) return;
      if (fromEl.value > ymd(t)) { fromEl.value = view.from; return UI.alert("미래 날짜는 조회기간으로 선택할 수 없습니다."); }
      view.from = fromEl.value;
      if (view.to && view.to < view.from) { view.to = null; UI.toast("시작일이 종료일보다 이후로 변경되어 종료일이 초기화되었습니다. 종료일을 다시 선택해 주세요.", "warn"); }
      if (view.from && view.to) { view.page = 1; paintPerf(box); } else { toEl.value = ""; toEl.min = view.from; }
    });
    toEl.addEventListener("change", () => {
      if (!toEl.value) return;
      if (toEl.value < view.from) { toEl.value = view.to || ""; return UI.alert("종료일은 시작일 이전 날짜로 선택할 수 없습니다."); }
      if (toEl.value > ymd(t)) { toEl.value = view.to || ""; return UI.alert("미래 날짜는 조회기간으로 선택할 수 없습니다."); }
      view.to = toEl.value;
      view.page = 1;
      paintPerf(box);
    });
    box.querySelector("#g-search").addEventListener("submit", (e) => { e.preventDefault(); view.q = e.target.querySelector("input").value; view.page = 1; paintPerf(box); });
    box.querySelector("#g-search input").addEventListener("search", (e) => { if (!e.target.value) { view.q = ""; view.page = 1; paintPerf(box); } });
    C().bindExt(box);
  }
  function table(cols, rows, cat, unit) {
    return `<table class="table table--camp"><thead><tr>${cols.map((k) => `<th class="${cat[k].left ? "th-left" : ""}">${cat[k].label}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr>${cols.map((k) => `<td class="${cat[k].left ? "td-left" : ""}">${cat[k].r(r)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="table__empty">표시할 ${unit}이 없습니다.</td></tr>`}</tbody></table>`;
  }
  /** 상품 기준: segments.product_item_id로 메이크샵 상품과 매칭, 없으면 '삭제된 상품' (POL-084) */
  function productRows(list) {
    const tot = Perf.sum(list);
    const ps = GStore.products().filter((p) => GStore.status(p) === "활동중").slice(0, 8);
    const weights = ps.map((p, i) => 1 / (i + 2));
    const wsum = weights.reduce((a, b) => a + b, 0) + 0.2;
    const camps = window.GMOCK.campaigns.filter((c) => c.shopping).map((c) => c.name);
    const rows = ps.map((p, i) => ({ p, name: p.name, id: `online:ko:KR:${p.no}`, camp: camps[i % camps.length], k: weights[i] / wsum }));
    rows.push({ p: null, name: null, id: "online:ko:KR:1000190", camp: camps[0], k: 0.2 / wsum });
    rows.forEach((r) => ["imp", "clk", "conv", "rev", "spend"].forEach((x) => (r[x] = Math.round(tot[x] * r.k))));
    return rows;
  }

  /* ---------------- 항목 설정 모달 (광고 기준 서브탭별·상품 기준 따로 저장, POL-085) ---------------- */
  function openColumns(onSaved) {
    /* Meta 3-5-2 항목 설정 모달과 같은 구조·동작(MKT-REQ-039 통일). 저장 단위만 서브탭·상품 기준별(POL-085). */
    const cat = catalog();
    const st = { sel: curCols().slice(), pickL: null, pickR: null, qL: "", qR: "" };
    const nFixed = Object.keys(cat).filter((k) => cat[k].fixed).length; // 고정 항목 수(광고 기준 1, 상품 기준 2)
    const josa = (w) => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? "은" : "는");
    const body = `<div class="dual">
      <div class="dual__box"><div class="dual__title">선택 가능한 타이틀 목록</div><label class="dual__search">${UI.icon.search}<input type="text" placeholder="검색어를 입력해 주세요." data-q="L"/></label><ul class="dual__list" data-list="L"></ul></div>
      <div class="dual__mid"><button type="button" class="btn btn--dark btn--icon" data-mv="add" aria-label="추가">»</button><button type="button" class="btn btn--dark btn--icon" data-mv="del" aria-label="제외">«</button></div>
      <div class="dual__box"><div class="dual__title">선택한 타이틀 목록</div><label class="dual__search">${UI.icon.search}<input type="text" placeholder="검색어를 입력해 주세요." data-q="R"/></label><ul class="dual__list" data-list="R"></ul></div>
      <div class="dual__order"><button type="button" class="btn btn--gray btn--icon" data-o="top" aria-label="최상단 이동">⇈</button><button type="button" class="btn btn--gray btn--icon" data-o="up" aria-label="위로 이동">↑</button><button type="button" class="btn btn--gray btn--icon" data-o="down" aria-label="아래로 이동">↓</button><button type="button" class="btn btn--gray btn--icon" data-o="bottom" aria-label="최하단 이동">⇊</button></div>
    </div>`;
    const m = UI.modal({ title: "목록 타이틀 양식 관리", size: "lg", cls: "modal--cols", body, footer: '<button type="button" class="btn btn--line btn--lg" data-act="reset">초기화</button><button type="button" class="btn btn--dark btn--lg" data-act="save">저장</button>' });
    const L = m.el.querySelector('[data-list="L"]');
    const R = m.el.querySelector('[data-list="R"]');
    function li(k, side) {
      const c = cat[k];
      const picked = side === "L" ? st.pickL === k : st.pickR === k;
      if (side === "L" && unusable(k)) return `<li data-off="${k}" class="is-disabled" title="Merchant Center 연결 후 사용할 수 있습니다."><span>${c.label}</span><em>Merchant Center 연결 필요</em></li>`;
      return `<li data-k="${k}" class="${picked ? "is-picked" : ""} ${c.fixed ? "is-fixed" : ""}"><span>${c.fixed ? "*" : ""}${c.label}</span><em>${c.desc}</em></li>`;
    }
    function paint() {
      const avail = Object.keys(cat).filter((k) => !st.sel.includes(k) && (!st.qL || cat[k].label.includes(st.qL)));
      const chosen = st.sel.filter((k) => !st.qR || cat[k].label.includes(st.qR));
      L.innerHTML = avail.length ? avail.map((k) => li(k, "L")).join("") : '<li class="dual__empty">항목이 없습니다.</li>';
      R.innerHTML = chosen.map((k) => li(k, "R")).join("") || '<li class="dual__empty">항목이 없습니다.</li>';
      L.querySelectorAll("[data-k]").forEach((x) => x.addEventListener("click", () => { st.pickL = x.dataset.k; paint(); }));
      L.querySelectorAll("[data-k]").forEach((x) => x.addEventListener("dblclick", () => { st.pickL = x.dataset.k; move("add"); }));
      R.querySelectorAll("[data-k]").forEach((x) => x.addEventListener("click", () => { st.pickR = x.dataset.k; paint(); }));
      R.querySelectorAll("[data-k]").forEach((x) => x.addEventListener("dblclick", () => { st.pickR = x.dataset.k; move("del"); }));
      const i = st.sel.indexOf(st.pickR);
      const movable = st.pickR && !cat[st.pickR].fixed;
      m.el.querySelector('[data-o="top"]').disabled = m.el.querySelector('[data-o="up"]').disabled = !movable || i <= nFixed;
      m.el.querySelector('[data-o="down"]').disabled = m.el.querySelector('[data-o="bottom"]').disabled = !movable || i === st.sel.length - 1;
      m.el.querySelector('[data-mv="add"]').disabled = !st.pickL;
      m.el.querySelector('[data-mv="del"]').disabled = !st.pickR || cat[st.pickR].fixed;
    }
    function move(dir) {
      if (dir === "add" && st.pickL) { st.sel.push(st.pickL); st.pickR = st.pickL; st.pickL = null; }
      if (dir === "del" && st.pickR) {
        if (cat[st.pickR].fixed) return UI.alert(`${cat[st.pickR].label}${josa(cat[st.pickR].label)} 필수 항목으로 제외할 수 없습니다.`);
        st.sel = st.sel.filter((k) => k !== st.pickR); st.pickL = st.pickR; st.pickR = null;
      }
      paint();
    }
    m.el.querySelectorAll("[data-mv]").forEach((b) => b.addEventListener("click", () => move(b.dataset.mv)));
    m.el.querySelectorAll("[data-o]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = st.sel.indexOf(st.pickR);
        const arr = st.sel.filter((k) => k !== st.pickR);
        const pos = { top: nFixed, up: Math.max(nFixed, i - 1), down: Math.min(arr.length, i + 1), bottom: arr.length }[b.dataset.o];
        arr.splice(pos, 0, st.pickR);
        st.sel = arr;
        paint();
      })
    );
    m.el.querySelectorAll("[data-q]").forEach((x) => x.addEventListener("input", () => { st["q" + x.dataset.q] = x.value.trim(); paint(); }));
    m.el.querySelector('[data-act="reset"]').addEventListener("click", () => { st.sel = withFixed(defaults()).filter((k) => !unusable(k)); st.pickL = st.pickR = null; paint(); UI.toast("기본 항목 구성으로 초기화되었습니다. [저장]을 눌러야 적용됩니다.", "info"); });
    m.el.querySelector('[data-act="save"]').addEventListener("click", () => {
      GStore.cols()[colKey()] = st.sel.slice();
      GStore.save();
      m.close(true);
      onSaved();
      UI.toast(`${view.mode === "product" ? "상품 성과 목록" : "캠페인 목록"} 항목 설정이 저장되었습니다.`, "success");
    });
    paint();
  }

  /* ---------------- 광고 운영 상태 모달 (권장사항·진단) ---------------- */
  function openStatus() {
    const s = GStore.s;
    const mcOk = s.mc !== "none";
    const recs = window.GMOCK.recommendations;
    const body = `
      <div class="stabs" id="st-tabs"><button type="button" class="stab is-active" data-t="rec">권장사항 <b>${recs.length}</b></button><button type="button" class="stab" data-t="diag">진단</button></div>
      <div id="st-body" style="margin-top:14px"></div>`;
    const m = UI.modal({ title: "광고 운영 상태", size: "lg", body, footer: '<button type="button" class="btn btn--dark btn--lg" data-act="close">닫기</button>' });
    const sb = m.el.querySelector("#st-body");
    function paint(t) {
      m.el.querySelectorAll("[data-t]").forEach((b) => b.classList.toggle("is-active", b.dataset.t === t));
      if (t === "rec") sb.innerHTML = `<p class="muted small" style="margin-bottom:10px">최적화 점수 87.4% · Google Ads API가 반환한 권장사항만 표시합니다. 적용은 Google Ads에서 진행합니다.</p>${recs.map((r) => `<div class="rec"><b>${r.type}</b><p>${r.text}</p><a class="ext" data-ext="Google Ads에서 확인" data-url="https://ads.google.com/aw/recommendations">Google Ads에서 확인 ${UI.icon.ext}</a></div>`).join("")}`;
      else sb.innerHTML = mcOk ? `<div class="rec"><b>계정 문제</b><p>표시할 계정 문제가 없습니다.</p></div><div class="rec rec--warn"><b>상품 문제 · 쇼핑 광고</b><p>미승인 상품이 있어 일부 상품이 쇼핑 광고에 노출되지 않습니다. 개별 상품은 상품피드에서 확인하세요.</p><a class="lnk" href="#/google/feed?tab=미승인">상품피드 미승인 탭으로 이동</a></div>` : '<p class="table__empty">Merchant Center가 연결되지 않아 진단 정보가 없습니다.</p>';
      C().bindExt(sb);
      sb.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", () => m.close(true)));
    }
    m.el.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => paint(b.dataset.t)));
    m.el.querySelector('[data-act="close"]').addEventListener("click", () => m.close(true));
    paint("rec");
  }

  return { render };
})();
