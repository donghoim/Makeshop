/* ==========================================================================
   SCR 3-5 · 광고 관리 탭 (미연동 / 연동완료) + 3-5-2 항목 설정
   - 성과 데이터: Mock 캠페인의 일 평균 지표 × 조회기간 내 운영일수(날짜별 변동 가중치)로 산출
   ========================================================================== */
const AdsPage = (function () {
  const SIZES = [20, 30, 50, 70, 100];
  const PERIODS = [["today", "오늘"], ["yesterday", "어제"], ["7d", "7일"], ["30d", "1개월"], ["month", "이번 달"], ["custom", "직접설정"]];
  /* 항목 정의 (7-4-7) */
  const COLS = {
    campaign_name: { label: "캠페인명", desc: "Meta 광고 관리자에 등록된 캠페인 이름", fixed: true },
    objective: { label: "목표", desc: "캠페인 목표 유형" },
    impressions: { label: "노출수", desc: "광고가 노출된 총 횟수" },
    clicks: { label: "클릭수", desc: "광고 클릭 총 횟수" },
    purchases: { label: "구매수", desc: "광고를 통해 발생한 구매 건수" },
    roas: { label: "ROAS", desc: "광고비 1원 대비 발생 매출 비율" },
    revenue: { label: "매출", desc: "광고로 발생한 총 매출액" },
    spend: { label: "광고비용", desc: "해당 기간 총 광고 집행 비용" },
    start_time: { label: "시작일시", desc: "광고 시작일" },
    stop_time: { label: "종료일시", desc: "광고 종료일" },
    reach: { label: "도달수", desc: "광고를 본 순 사용자 수" },
    frequency: { label: "빈도", desc: "1인당 평균 광고 노출 횟수" },
    cpm: { label: "CPM", desc: "1,000회 노출당 비용" },
    ctr: { label: "CTR", desc: "클릭수 ÷ 노출수 X 100" },
    cpc: { label: "CPC", desc: "클릭 1회당 평균 광고 비용" },
    add_to_cart: { label: "장바구니 추가", desc: "광고 클릭 후 장바구니에 담긴 횟수" },
    initiate_checkout: { label: "결제 시작", desc: "광고 클릭 후 결제를 시작한 횟수" },
    cvr: { label: "전환율", desc: "구매수 ÷ 클릭수 X 100" },
    cpa: { label: "CPA", desc: "구매 1건당 평균 광고 비용" },
  };
  const ALL_KEYS = Object.keys(COLS);
  const view = { period: "yesterday", from: null, to: null, q: "", page: 1, size: 20, draft: null };

  /* ---------------- 날짜 유틸 ---------------- */
  const DAY = 86400000;
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => new Date(d.getTime() + n * DAY);
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  function range() {
    const t = today0();
    switch (view.period) {
      case "today": return [t, t];
      case "yesterday": return [addDays(t, -1), addDays(t, -1)];
      case "7d": return [addDays(t, -7), addDays(t, -1)];
      case "30d": return [addDays(t, -30), addDays(t, -1)];
      case "month": return [new Date(t.getFullYear(), t.getMonth(), 1), t];
      case "custom": return view.from && view.to ? [parse(view.from), parse(view.to)] : [addDays(t, -1), addDays(t, -1)];
    }
  }
  /** 날짜별 변동 가중치 (결정적 의사난수) */
  const w = (d, i) => 0.75 + ((Math.sin(d.getTime() / DAY * 1.7 + i * 3.1) + 1) / 2) * 0.5;

  function aggregate(from, to) {
    const t = today0();
    return window.MOCK.campaigns
      .map((c, i) => {
        const s = addDays(t, c.s);
        const e = c.e == null ? null : addDays(t, c.e);
        const a = { name: c.name, objective: c.objective, start: s, stop: e, imp: 0, clk: 0, buy: 0, rev: 0, spend: 0, reach: 0, atc: 0, ic: 0, days: 0 };
        for (let d = new Date(Math.max(from, s)); d <= to && (!e || d <= e); d = addDays(d, 1)) {
          if (d > t) break;
          const k = w(d, i) * (d.getTime() === t.getTime() ? 0.45 : 1); // 오늘은 집계 진행 중
          a.imp += c.imp * k; a.clk += c.clk * k; a.buy += c.buy * k; a.rev += c.rev * k; a.spend += c.spend * k; a.atc += c.atc * k; a.ic += c.ic * k;
          a.days++;
        }
        a.reach = a.days ? c.reach * Math.min(2.4, 1 + Math.log(a.days) * 0.35) : 0;
        ["imp", "clk", "buy", "rev", "spend", "reach", "atc", "ic"].forEach((x) => (a[x] = Math.round(a[x])));
        return a;
      })
      .filter((a) => a.days > 0);
  }
  function total(list) {
    return list.reduce((s, a) => { ["imp", "clk", "buy", "rev", "spend"].forEach((k) => (s[k] += a[k])); return s; }, { imp: 0, clk: 0, buy: 0, rev: 0, spend: 0 });
  }
  const div = (a, b) => (b ? a / b : null);
  const roasTxt = (r) => (r == null ? "-" : r.toFixed(1) + "x");
  const roasCls = (r) => (r == null ? "" : r >= 3 ? "up" : "down");

  function value(k, a) {
    switch (k) {
      case "campaign_name": return `<span class="camp-name">${UI.esc(a.name)}</span>`;
      case "objective": return a.objective;
      case "impressions": return UI.fmt(a.imp);
      case "clicks": return UI.fmt(a.clk);
      case "purchases": return UI.fmt(a.buy);
      case "roas": { const r = div(a.rev, a.spend); return `<span class="${roasCls(r)}">${roasTxt(r)}</span>`; }
      case "revenue": return UI.fmt(a.rev);
      case "spend": return UI.fmt(a.spend);
      case "start_time": return ymd(a.start) + " 00:00";
      case "stop_time": return a.stop ? ymd(a.stop) + " 23:59" : "-";
      case "reach": return UI.fmt(a.reach);
      case "frequency": return a.reach ? (a.imp / a.reach).toFixed(2) : "-";
      case "cpm": return a.imp ? UI.fmt((a.spend / a.imp) * 1000) : "-";
      case "ctr": return a.imp ? ((a.clk / a.imp) * 100).toFixed(2) + "%" : "-";
      case "cpc": return a.clk ? UI.fmt(a.spend / a.clk) : "-";
      case "add_to_cart": return UI.fmt(a.atc);
      case "initiate_checkout": return UI.fmt(a.ic);
      case "cvr": return a.clk ? ((a.buy / a.clk) * 100).toFixed(2) + "%" : "-";
      case "cpa": return a.buy ? UI.fmt(a.spend / a.buy) : "-";
    }
  }

  /* ---------------- 렌더 ---------------- */
  function render(root) {
    const s = Store.s;
    if (!s.connected) {
      root.appendChild(
        App.emptyState({
          title: "비즈니스 자산 연동 후 광고 데이터를 확인할 수 있습니다.",
          desc: "페이스북 채널 연동이 완료되면 광고 계정이 연결되고<br>캠페인 성과 데이터를 메이크샵에서 조회할 수 있습니다.",
          btn: "비즈니스 자산 설정하기",
          note: "연결 관리 탭에서 비즈니스 자산 설정하기 버튼을 클릭해 광고 계정, 픽셀 등을 연동하면 광고 관리 기능이 활성화됩니다.",
          onClick: App.gotoConnectAndStart,
        })
      );
      return;
    }
    root.appendChild(
      App.banner(
        "광고 관리",
        "Meta 광고 운영 상태와 주요 정보를 확인하는 공간입니다. 연결된 광고 계정 정보부터 광고 상태, 주요 성과 정보를 확인할 수 있으며, Meta 광고 관리자와 연계하여 광고 운영을 이어갈 수 있습니다.<br>단순 계정 연결 상태가 아닌 실제 광고 운영 현황 중심으로 정보를 제공합니다."
      )
    );
    root.appendChild(accountSection());
    const camp = App.section("캠페인 목록", `<select class="select select--sm" id="ad-size" aria-label="페이지당 노출 개수">${SIZES.map((n) => `<option value="${n}" ${n === view.size ? "selected" : ""}>${n}개씩 보기</option>`).join("")}</select><button type="button" class="btn btn--line btn--sm" id="ad-cols">${UI.icon.gear} 항목</button>`, '<div id="camp"></div>');
    root.appendChild(camp);
    camp.querySelector("#ad-size").addEventListener("change", (e) => { view.size = +e.target.value; view.page = 1; paintCampaign(camp.querySelector("#camp")); });
    camp.querySelector("#ad-cols").addEventListener("click", () => openColumns(() => paintCampaign(camp.querySelector("#camp"))));
    paintCampaign(camp.querySelector("#camp"));
    root.appendChild(conversionSection());
  }

  /* ---------------- 2. 광고 계정 정보 ---------------- */
  function accountSection() {
    const s = Store.s;
    const ad = window.MOCK.adAccount;
    const a = window.MOCK.account;
    const act = ad.id.replace(/^act_/, "");
    const stCls = { 활성: "pill--blue", 비활성: "pill--gray", 차단: "pill--red", 미결제: "pill--line", 펜딩: "pill--dark-line" }[s.ads.status];
    const body = `<dl class="kv">
      <div class="kv__row"><dt>광고 계정명</dt><dd>${UI.esc(ad.name)} (${ad.id})</dd><dd class="kv__link"><a class="ext" data-ext="결제 수단 관리" data-url="https://adsmanager.facebook.com/adsmanager/manage/billing_payments?act=${act}&business_id=${a.businessId}">결제 수단 관리 ${UI.icon.ext}</a></dd></div>
      <div class="kv__row"><dt>계정 상태 ${UI.qmark("adStatus")}</dt><dd><span class="pill ${stCls}">${s.ads.status}</span></dd><dd class="kv__link"><a class="ext" data-ext="계정 상태 확인" data-url="https://adsmanager.facebook.com/adsmanager/manage/accounts?act=${act}&business_id=${a.businessId}">계정 상태 확인 ${UI.icon.ext}</a></dd></div>
      <div class="kv__row"><dt>이번 달 광고 지출</dt><dd>${UI.fmt(ad.monthSpend)}</dd></div>
      <div class="kv__row"><dt>잔여 크레딧 ${UI.qmark("credit")}</dt><dd>${s.ads.billing === "선불" ? UI.fmt(ad.prepaidCredit) : "0(후불)"}</dd></div>
    </dl>`;
    const el = App.section("광고 계정 정보", "", body);
    ConnectPage.bindExt(el);
    return el;
  }

  /* ---------------- 3~4. 캠페인 성과 요약 + 목록 ---------------- */
  function paintCampaign(box) {
    const [from, to] = range();
    const t = today0();
    const q = view.q.trim().toLowerCase();
    const match = (a) => !q || a.name.toLowerCase().includes(q);
    const list = aggregate(from, to).filter(match).sort((x, y) => y.spend - x.spend);
    const span = Math.round((to - from) / DAY) + 1;
    const prev = aggregate(addDays(from, -span), addDays(from, -1)).filter(match);
    const cur = total(list);
    const pv = total(prev);
    const pct = (a, b) => (b ? ((a - b) / b) * 100 : null);
    const ctr = div(cur.clk * 100, cur.imp);
    const pctr = div(pv.clk * 100, pv.imp);
    const card = (label, val, diff, extra) => `
      <div class="kpi"><div class="kpi__label">${label}</div><div class="kpi__val">${val}</div>
      <div class="kpi__sub">${diff == null ? '<span class="muted">비교 데이터 없음</span>' : `<span class="${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "↑" : "↓"} ${Math.abs(diff).toFixed(1)}%</span> <span class="muted">직전 동일 기간 대비</span>`}</div>${extra || ""}</div>`;
    const roas = div(cur.rev, cur.spend);
    const cols = Store.s.columns;
    const pages = Math.max(1, Math.ceil(list.length / view.size));
    if (view.page > pages) view.page = pages;
    const rows = list.slice((view.page - 1) * view.size, view.page * view.size);
    box.innerHTML = `
      <div class="period-bar">
        <div class="seg" role="group" aria-label="조회기간">${PERIODS.map((p) => `<button type="button" class="${view.period === p[0] ? "is-active" : ""}" data-p="${p[0]}">${p[1]}</button>`).join("")}</div>
        <div class="dates"><input type="date" id="d-from" value="${ymd(from)}" max="${ymd(t)}" ${view.period === "custom" ? "" : "disabled"} aria-label="시작일"/><span>~</span><input type="date" id="d-to" value="${view.period === "custom" && !view.to ? "" : ymd(to)}" min="${ymd(from)}" max="${ymd(t)}" ${view.period === "custom" ? "" : "disabled"} aria-label="종료일"/></div>
        <form class="search search--sm" id="camp-search"><button type="submit" aria-label="검색">${UI.icon.search}</button><input type="search" placeholder="캠페인명으로 검색" value="${UI.esc(view.q)}" aria-label="캠페인명 검색"/></form>
      </div>
      <div class="kpis">
        ${card("노출수", UI.fmt(cur.imp), pct(cur.imp, pv.imp))}
        ${card("클릭수", UI.fmt(cur.clk), pct(cur.clk, pv.clk))}
        ${card("CTR", ctr == null ? "-" : ctr.toFixed(2) + "%", ctr != null && pctr ? pct(ctr, pctr) : null)}
        ${card("전환(구매)", UI.fmt(cur.buy), pct(cur.buy, pv.buy))}
        ${card("광고지출", UI.fmt(cur.spend), pct(cur.spend, pv.spend), `<div class="kpi__roas">ROAS <b class="${roasCls(roas)}">${roasTxt(roas)}</b></div>`)}
      </div>
      <p class="note note--right">${UI.icon.info}<span>성과 데이터는 Meta Marketing API 기준이며 반영까지 최대 1일 이상 소요될 수 있습니다.</span><a class="ext" data-ext="광고 관리자 바로가기" data-url="https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${window.MOCK.adAccount.id.replace(/^act_/, "")}&business_id=${window.MOCK.account.businessId}">광고 관리자 바로가기 ${UI.icon.ext}</a></p>
      <div class="table-wrap"><table class="table table--camp">
        <thead><tr>${cols.map((k) => `<th class="${k === "campaign_name" ? "th-left" : ""}">${COLS[k].label}</th>`).join("")}</tr></thead>
        <tbody>${rows.length ? rows.map((a) => `<tr>${cols.map((k) => `<td class="${k === "campaign_name" ? "td-left" : ""}">${value(k, a)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="table__empty">표시할 캠페인이 없습니다.</td></tr>`}</tbody>
      </table></div>
      <div class="list-foot"><div class="list-foot__left muted small">조회기간 ${ymd(from)} ~ ${ymd(to)} · 총 ${list.length}개 캠페인 · 광고 비용 높은 순</div><div id="camp-pager"></div><div></div></div>`;
    box.querySelector("#camp-pager").appendChild(UI.pagination(list.length, view.page, view.size, (p) => { view.page = p; paintCampaign(box); }));
    box.querySelectorAll("[data-p]").forEach((b) =>
      b.addEventListener("click", () => {
        view.period = b.dataset.p;
        if (view.period === "custom") { const [f, tt] = range(); view.from = view.from || ymd(f); view.to = view.to || ymd(tt); }
        view.page = 1;
        paintCampaign(box);
      })
    );
    const fromEl = box.querySelector("#d-from");
    const toEl = box.querySelector("#d-to");
    fromEl.addEventListener("change", () => {
      if (!fromEl.value) return;
      if (fromEl.value > ymd(t)) { fromEl.value = view.from; return UI.alert("미래 날짜는 조회기간으로 선택할 수 없습니다."); }
      view.from = fromEl.value;
      if (view.to && view.to < view.from) { view.to = null; UI.toast("시작일이 종료일보다 이후로 변경되어 종료일이 초기화되었습니다. 종료일을 다시 선택해 주세요.", "warn"); }
      if (view.from && view.to) { view.page = 1; paintCampaign(box); } else { toEl.value = ""; toEl.min = view.from; }
    });
    toEl.addEventListener("change", () => {
      if (!toEl.value) return;
      if (toEl.value < view.from) { toEl.value = view.to || ""; return UI.alert("종료일은 시작일 이전 날짜로 선택할 수 없습니다."); }
      if (toEl.value > ymd(t)) { toEl.value = view.to || ""; return UI.alert("미래 날짜는 조회기간으로 선택할 수 없습니다."); }
      view.to = toEl.value;
      view.page = 1;
      paintCampaign(box);
    });
    box.querySelector("#camp-search").addEventListener("submit", (e) => { e.preventDefault(); view.q = e.target.querySelector("input").value; view.page = 1; paintCampaign(box); });
    box.querySelector("#camp-search input").addEventListener("search", (e) => { if (!e.target.value) { view.q = ""; view.page = 1; paintCampaign(box); } });
    ConnectPage.bindExt(box);
  }

  /* ---------------- 3-5-2 항목 설정 ---------------- */
  function openColumns(onSaved) {
    const st = { sel: Store.s.columns.slice(), pickL: null, pickR: null, qL: "", qR: "" };
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
      const c = COLS[k];
      const picked = side === "L" ? st.pickL === k : st.pickR === k;
      return `<li data-k="${k}" class="${picked ? "is-picked" : ""} ${c.fixed ? "is-fixed" : ""}"><span>${c.fixed ? "*" : ""}${c.label}</span><em>${c.desc}</em></li>`;
    }
    function paint() {
      const avail = ALL_KEYS.filter((k) => !st.sel.includes(k) && (!st.qL || COLS[k].label.includes(st.qL)));
      const chosen = st.sel.filter((k) => !st.qR || COLS[k].label.includes(st.qR));
      L.innerHTML = avail.length ? avail.map((k) => li(k, "L")).join("") : '<li class="dual__empty">항목이 없습니다.</li>';
      R.innerHTML = chosen.map((k) => li(k, "R")).join("") || '<li class="dual__empty">항목이 없습니다.</li>';
      L.querySelectorAll("[data-k]").forEach((x) => x.addEventListener("click", () => { st.pickL = x.dataset.k; paint(); }));
      L.querySelectorAll("[data-k]").forEach((x) => x.addEventListener("dblclick", () => { st.pickL = x.dataset.k; move("add"); }));
      R.querySelectorAll("[data-k]").forEach((x) => x.addEventListener("click", () => { st.pickR = x.dataset.k; paint(); }));
      R.querySelectorAll("[data-k]").forEach((x) => x.addEventListener("dblclick", () => { st.pickR = x.dataset.k; move("del"); }));
      const i = st.sel.indexOf(st.pickR);
      const movable = st.pickR && !COLS[st.pickR].fixed;
      m.el.querySelector('[data-o="top"]').disabled = m.el.querySelector('[data-o="up"]').disabled = !movable || i <= 1;
      m.el.querySelector('[data-o="down"]').disabled = m.el.querySelector('[data-o="bottom"]').disabled = !movable || i === st.sel.length - 1;
      m.el.querySelector('[data-mv="add"]').disabled = !st.pickL;
      m.el.querySelector('[data-mv="del"]').disabled = !st.pickR || COLS[st.pickR].fixed;
    }
    function move(dir) {
      if (dir === "add" && st.pickL) { st.sel.push(st.pickL); st.pickR = st.pickL; st.pickL = null; }
      if (dir === "del" && st.pickR) {
        if (COLS[st.pickR].fixed) return UI.alert("캠페인명은 필수 항목으로 제외할 수 없습니다.");
        st.sel = st.sel.filter((k) => k !== st.pickR); st.pickL = st.pickR; st.pickR = null;
      }
      paint();
    }
    m.el.querySelectorAll("[data-mv]").forEach((b) => b.addEventListener("click", () => move(b.dataset.mv)));
    m.el.querySelectorAll("[data-o]").forEach((b) =>
      b.addEventListener("click", () => {
        const i = st.sel.indexOf(st.pickR);
        const arr = st.sel.filter((k) => k !== st.pickR);
        const pos = { top: 1, up: Math.max(1, i - 1), down: Math.min(arr.length, i + 1), bottom: arr.length }[b.dataset.o];
        arr.splice(pos, 0, st.pickR);
        st.sel = arr;
        paint();
      })
    );
    m.el.querySelectorAll("[data-q]").forEach((x) => x.addEventListener("input", () => { st["q" + x.dataset.q] = x.value.trim(); paint(); }));
    m.el.querySelector('[data-act="reset"]').addEventListener("click", () => { st.sel = Store.DEFAULT_COLUMNS.slice(); st.pickL = st.pickR = null; paint(); UI.toast("기본 항목 구성으로 초기화되었습니다. [저장]을 눌러야 적용됩니다.", "info"); });
    m.el.querySelector('[data-act="save"]').addEventListener("click", () => {
      Store.s.columns = st.sel.slice();
      Store.save();
      m.close(true);
      onSaved();
      UI.toast("캠페인 목록 항목 설정이 저장되었습니다.", "success");
    });
    paint();
  }

  /* ---------------- 5. 전환 추적 설정 ---------------- */
  function conversionSection() {
    const s = Store.s;
    const draft = { capi: s.ads.capi, naver: s.ads.naver, kakao: s.ads.kakao };
    const row = (k, label, info, enabled, hint) => `
      <div class="conv-row"><div class="conv-row__label">${label} ${UI.qmark(info)}</div>
      <div class="seg seg--wide ${enabled ? "" : "is-disabled"}" data-k="${k}"><button type="button" data-v="on" ${enabled ? "" : "disabled"}>사용</button><button type="button" data-v="off" ${enabled ? "" : "disabled"}>사용안함</button></div>
      ${hint ? `<span class="row-hint">${hint}</span>` : ""}</div>`;
    const body = `
      ${row("capi", "Meta 전환 API(CAPI) 연동", "capi", true, "")}
      ${row("naver", "네이버페이 구매 전환", "naver", s.prereq.naver, s.prereq.naver ? "" : "네이버 연동 설정에서 주문형 네이버페이 사용 및 공통 인증키 입력 후 사용할 수 있습니다.")}
      ${row("kakao", "카카오톡 체크아웃 구매 전환", "kakao", s.prereq.kakao, s.prereq.kakao ? "" : "카카오 연동 설정에서 톡 체크아웃 연동 후 사용할 수 있습니다.")}
      <p class="note" id="capi-note" hidden>${UI.icon.info}<span>Meta 전환 API(CAPI) 연동이 '사용안함'이면 네이버페이·카카오톡 체크아웃 구매 전환을 '사용'으로 설정해도 외부 결제 Purchase 이벤트는 전송되지 않습니다.</span></p>
      <div class="conv-foot"><button type="button" class="btn btn--primary btn--lg" data-act="save">확인</button></div>`;
    const el = App.section("전환 추적 설정", "", body);
    function paint() {
      el.querySelectorAll(".seg[data-k]").forEach((g) => g.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", draft[g.dataset.k] === b.dataset.v)));
      el.querySelector("#capi-note").hidden = !(draft.capi === "off" && (draft.naver === "on" || draft.kakao === "on"));
    }
    el.querySelectorAll(".seg[data-k] button").forEach((b) => b.addEventListener("click", () => { draft[b.parentElement.dataset.k] = b.dataset.v; paint(); }));
    el.querySelector('[data-act="save"]').addEventListener("click", async () => {
      Object.assign(s.ads, draft);
      Store.save();
      await UI.alert("전환 추적 설정이 저장되었습니다.");
    });
    paint();
    return el;
  }

  return { render, COLS };
})();
