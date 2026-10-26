/* ==========================================================================
   Google 구글애즈 탭 — v0.1 화면설계서 6-1부터 6-7 기준, 화면 틀만 Meta 디자인으로 변경
   - 계정 정보·Merchant Center 연결 단계(POL-077), 광고 측정(POL-079), 광고 기준·상품 기준 성과(POL-080부터 POL-085),
     광고 운영 상태 모달(POL-086부터 POL-089)
   ========================================================================== */
const GAds = (function () {
  const C = () => GCommon;
  const PERIODS = [["today", "오늘"], ["yesterday", "어제"], ["7d", "최근 7일"], ["30d", "최근 30일"], ["month", "이번 달"]];
  const SUBS = ["전체", "실적 최대화", "쇼핑", "검색", "디스플레이", "동영상"];
  const view = { mode: "ad", period: "7d", sub: "전체" };

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
    }
  }

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
    const perf = App.section("광고 성과", "", '<div id="gads-perf"></div>');
    root.appendChild(perf);
    paintPerf(perf.querySelector("#gads-perf"));
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
    const el = App.section("계정 정보", '<button type="button" class="btn btn--line btn--sm" data-act="status">광고 운영 상태</button>', body);
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

  /* ---------------- 광고 성과 ---------------- */
  function paintPerf(box) {
    const pm = productMode();
    const shoppingOk = GStore.s.mc !== "none";
    const [f, t, prev] = range(view.period);
    const filter = (c) => view.mode === "product" ? c.shopping : view.sub === "전체" || c.type === view.sub;
    const cur = Perf.rows("google", f, t, filter);
    const before = Perf.sum(Perf.rows("google", prev[0], prev[1], filter));
    const tot = Perf.sum(cur);
    const kpis = [["비용", tot.spend, before.spend, "원"], ["노출수", tot.imp, before.imp, ""], ["클릭수", tot.clk, before.clk, ""], ["전환수", tot.conv, before.conv, ""], ["전환 가치", tot.rev, before.rev, "원"]];
    const delta = (a, b) => (!b ? '<span class="muted">비교 데이터 없음</span>' : `<span class="${a >= b ? "up" : "down"}">${a >= b ? "▲" : "▼"} ${Math.abs(((a - b) / b) * 100).toFixed(1)}%</span>`);
    const roas = tot.spend ? Math.round((tot.rev / tot.spend) * 100) + "%" : "-";
    box.innerHTML = `
      <div class="perf-top">
        <div class="seg">${[["ad", "광고 기준"], ["product", "상품 기준"]].filter((x) => x[0] === "ad" || pm).map((x) => `<button type="button" data-mode="${x[0]}" class="${view.mode === x[0] ? "is-active" : ""}">${x[1]}</button>`).join("")}</div>
        <div class="seg">${PERIODS.map((p) => `<button type="button" data-p="${p[0]}" class="${view.period === p[0] ? "is-active" : ""}">${p[1]}</button>`).join("")}</div>
      </div>
      ${view.mode === "ad" ? `<div class="stabs stabs--sub">${SUBS.map((x) => { const dis = x === "쇼핑" && !shoppingOk; return `<button type="button" class="stab ${x === view.sub ? "is-active" : ""}" data-sub="${x}" ${dis ? 'disabled title="Merchant Center 연결이 필요합니다."' : ""}>${x}</button>`; }).join("")}</div>` : ""}
      <div class="kpis">${kpis.map((k) => `<div class="kpi"><span class="kpi__label">${k[0]}</span><span class="kpi__val">${UI.fmt(k[1])}${k[3]}</span><span class="kpi__sub">${delta(k[1], k[2])}</span>${k[0] === "전환 가치" ? `<span class="kpi__roas">ROAS ${roas}</span>` : ""}</div>`).join("")}</div>
      <div class="table-wrap" style="margin-top:18px">${view.mode === "ad" ? campTable(cur) : productTable(cur)}</div>`;
    box.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { view.mode = b.dataset.mode; paintPerf(box); }));
    box.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => { view.period = b.dataset.p; paintPerf(box); }));
    box.querySelectorAll("[data-sub]").forEach((b) => b.addEventListener("click", () => { view.sub = b.dataset.sub; paintPerf(box); }));
  }
  function campTable(list) {
    if (!list.length) return '<table class="table"><tbody><tr><td class="table__empty">조회 기간에 성과가 있는 캠페인이 없습니다.</td></tr></tbody></table>';
    return `<table class="table table--camp"><thead><tr><th class="th-left">캠페인명</th><th>유형</th><th>노출수</th><th>클릭수</th><th>CTR</th><th>비용</th><th>전환수</th><th>전환 가치</th><th>ROAS</th></tr></thead><tbody>${list
      .map((a) => `<tr><td class="td-left"><span class="camp-name">${UI.esc(a.name)}</span></td><td>${a.type}</td><td>${UI.fmt(a.imp)}</td><td>${UI.fmt(a.clk)}</td><td>${a.imp ? ((a.clk / a.imp) * 100).toFixed(2) + "%" : "-"}</td><td>${UI.fmt(a.spend)}</td><td>${UI.fmt(a.conv)}</td><td>${UI.fmt(a.rev)}</td><td>${a.spend ? Math.round((a.rev / a.spend) * 100) + "%" : "-"}</td></tr>`)
      .join("")}</tbody></table>`;
  }
  /** 상품 기준: segments.product_item_id로 메이크샵 상품과 매칭, 없으면 '삭제된 상품' (POL-084) */
  function productTable(list) {
    const tot = Perf.sum(list);
    const ps = GStore.products().filter((p) => GStore.status(p) === "활동중").slice(0, 8);
    const weights = ps.map((p, i) => 1 / (i + 2));
    const wsum = weights.reduce((a, b) => a + b, 0) + 0.2;
    const rows = ps.map((p, i) => ({ name: p.name, id: `online:ko:KR:${p.no}`, k: weights[i] / wsum }));
    rows.push({ name: null, id: "online:ko:KR:1000190", k: 0.2 / wsum });
    return `<table class="table table--camp"><thead><tr><th class="th-left">상품정보</th><th>노출수</th><th>클릭수</th><th>비용</th><th>전환수</th><th>전환 가치</th><th>ROAS</th></tr></thead><tbody>${rows
      .map((r) => { const sp = tot.spend * r.k; const rv = tot.rev * r.k; return `<tr><td class="td-left">${r.name ? UI.esc(r.name) : '<span class="muted">삭제된 상품</span>'}<div class="muted small">${r.id}</div></td><td>${UI.fmt(tot.imp * r.k)}</td><td>${UI.fmt(tot.clk * r.k)}</td><td>${UI.fmt(sp)}</td><td>${UI.fmt(tot.conv * r.k)}</td><td>${UI.fmt(rv)}</td><td>${sp ? Math.round((rv / sp) * 100) + "%" : "-"}</td></tr>`; })
      .join("")}</tbody></table>`;
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
