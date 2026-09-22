/* Google Ads 탭 — 렌더링 로직
   근거: 04_Screen-Spec/03. 구글애즈 탭/*.svg, 05_Policy/03. 구글애즈 탭/3-1(연결 상태)·3-2(광고 측정)·3-3(광고 캠페인)·
         3-4(항목 노출 및 설정)·3-5(광고 운영 상태) 정책.pdf */

(function () {
  const M = () => window.MOCK_ADS;

  function fmtMetric(m) {
    let v;
    if (m.fmt === "won") v = GC.fmtWon(m.value);
    else if (m.fmt === "num") v = GC.fmtNumber(m.value);
    else if (m.fmt === "pct") v = m.value.toFixed(2) + "%";
    else if (m.fmt === "roas") v = m.value.toFixed(1) + "%";
    else v = m.value;
    let delta = "";
    if (m.delta !== null && m.delta !== undefined) {
      const arrow = m.dir === "up" ? "▲" : "▼";
      const unit = m.unit || "%";
      delta = `<div class="delta ${m.dir}">${arrow} ${Math.abs(m.delta)}${unit}</div>`;
    }
    return `<div class="gc-metric"><div class="lbl">${m.label}</div><div class="val">${v}</div>${delta}</div>`;
  }

  function metricGrid(obj) {
    return `<div class="gc-metric-grid">${Object.values(obj).map(fmtMetric).join("")}</div>`;
  }

  function calcCampaignRow(c) {
    const ctr = c.impressions ? (c.clicks / c.impressions * 100) : 0;
    const avgCpc = c.clicks ? Math.round(c.cost / c.clicks) : 0;
    const cpa = c.conversions ? Math.round(c.cost / c.conversions) : 0;
    const roas = c.cost ? (c.conversionValue / c.cost * 100) : 0;
    return { ...c, ctr, avgCpc, cpa, roas };
  }

  const CAMPAIGN_SUBTABS = [
    { key: "basic", label: "기본 정보" },
    { key: "perf", label: "광고 성과" },
    { key: "conv", label: "전환 성과" },
    { key: "ops", label: "캠페인 운영" },
    { key: "shopping", label: "쇼핑 광고" }
  ];

  function campaignCols(key) {
    switch (key) {
      case "basic": return [
        { h: "캠페인명", r: (c) => `<b>${GC.esc(c.name)}</b>` },
        { h: "캠페인 유형", r: (c) => c.type },
        { h: "상태", r: (c) => statusBadge(c.status) },
        { h: "일 예산", r: (c) => GC.fmtWon(c.dailyBudget) },
        { h: "시작일", r: (c) => c.startDate },
        { h: "종료일", r: (c) => c.endDate || "-" }
      ];
      case "perf": return [
        { h: "캠페인명", r: (c) => `<b>${GC.esc(c.name)}</b>` },
        { h: "노출수", r: (c) => GC.fmtNumber(c.impressions) },
        { h: "클릭수", r: (c) => GC.fmtNumber(c.clicks) },
        { h: "CTR", r: (c) => c.ctr.toFixed(2) + "%" },
        { h: "평균 CPC", r: (c) => GC.fmtWon(c.avgCpc) },
        { h: "광고비", r: (c) => GC.fmtWon(c.cost) }
      ];
      case "conv": return [
        { h: "캠페인명", r: (c) => `<b>${GC.esc(c.name)}</b>` },
        { h: "전환수", r: (c) => GC.fmtNumber(c.conversions) },
        { h: "클릭수", r: (c) => GC.fmtNumber(c.clicks) },
        { h: "구매 전환가치", r: (c) => GC.fmtWon(c.conversionValue) },
        { h: "전환율", r: (c) => (c.clicks ? (c.conversions / c.clicks * 100).toFixed(2) : "0.00") + "%" },
        { h: "CPA", r: (c) => GC.fmtWon(c.cpa) },
        { h: "ROAS", r: (c) => c.roas.toFixed(0) + "%" }
      ];
      case "ops": return [
        { h: "캠페인명", r: (c) => `<b>${GC.esc(c.name)}</b>` },
        { h: "일 예산", r: (c) => GC.fmtWon(c.dailyBudget) },
        { h: "입찰 전략", r: (c) => c.biddingStrategy },
        { h: "최적화 점수", r: (c) => c.optimizationScore + "%" }
      ];
      case "shopping": return [
        { h: "캠페인명", r: (c) => `<b>${GC.esc(c.name)}</b>` },
        { h: "캠페인 유형", r: (c) => c.type },
        { h: "상품 광고 사용 여부", r: (c) => (c.shoppingAdsUsed ? '<span class="gc-badge gc-badge-success">사용</span>' : '<span class="gc-badge gc-badge-neutral">미사용</span>') },
        { h: "상품 기반 P-Max 여부", r: (c) => (c.productPmax ? '<span class="gc-badge gc-badge-success">해당</span>' : '<span class="gc-badge gc-badge-neutral">해당없음</span>') }
      ];
    }
  }

  function statusBadge(s) {
    if (s === "운영 중") return '<span class="gc-badge gc-badge-success">운영 중</span>';
    if (s === "일시중지") return '<span class="gc-badge gc-badge-warning">일시중지</span>';
    return `<span class="gc-badge gc-badge-neutral">${s}</span>`;
  }

  let campaignState = { subtab: "basic", search: "", page: 1 };
  let productState = { sort: "conv_value_desc", search: "", page: 1 };

  function renderCampaignTable(container) {
    const rows = M().campaigns.map(calcCampaignRow).filter((c) => c.name.includes(campaignState.search));
    const pageSize = 5;
    const start = (campaignState.page - 1) * pageSize;
    const pageRows = rows.slice(start, start + pageSize);
    const cols = campaignCols(campaignState.subtab);

    container.innerHTML = `
      <div class="gc-flex-between gc-mt-16">
        <div class="gc-subtabs" data-tab-group="campaign-subtabs" style="border-bottom:none; margin-bottom:0;">
          ${CAMPAIGN_SUBTABS.map((t) => `<button class="gc-subtab ${t.key === campaignState.subtab ? "active" : ""}" data-tab-target="${t.key}">${t.label}</button>`).join("")}
        </div>
        <div class="gc-flex gc-gap-8">
          <input type="text" class="gc-input" id="campaign-search" placeholder="캠페인명으로 검색" value="${GC.esc(campaignState.search)}" style="width:180px;">
          <button class="gc-btn gc-btn-sm" id="btn-ads-ops">광고 운영 상태</button>
          <button class="gc-btn gc-btn-sm" id="btn-ads-item-basic">항목 설정</button>
        </div>
      </div>
      <div class="gc-table-wrap gc-mt-12">
        <table class="gc-table">
          <thead><tr>${cols.map((c) => `<th>${c.h}</th>`).join("")}</tr></thead>
          <tbody>${pageRows.length ? pageRows.map((c) => `<tr>${cols.map((col) => `<td>${col.r(c)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="gc-muted" style="text-align:center; padding:30px;">검색 결과가 없습니다.</td></tr>`}</tbody>
        </table>
      </div>
      <div class="gc-pagination" id="campaign-pagination"></div>
    `;

    container.querySelectorAll("[data-tab-target]").forEach((btn) => {
      btn.addEventListener("click", () => { campaignState.subtab = btn.dataset.tabTarget; campaignState.page = 1; renderCampaignTable(container); });
    });
    container.querySelector("#campaign-search").addEventListener("input", (e) => { campaignState.search = e.target.value; campaignState.page = 1; renderCampaignTable(container); });
    container.querySelector("#btn-ads-ops").addEventListener("click", openOpsModal);
    container.querySelector("#btn-ads-item-basic").addEventListener("click", () => openItemFieldsModal("ads"));
    GC.renderPagination(container.querySelector("#campaign-pagination"), {
      total: rows.length, pageSize, current: campaignState.page,
      onChange: (p) => { campaignState.page = p; renderCampaignTable(container); }
    });
  }

  function renderProductTable(container) {
    let rows = M().products.map((p) => {
      const ctr = p.impressions ? (p.clicks / p.impressions * 100) : 0;
      const roas = p.cost ? (p.conversionValue / p.cost * 100) : 0;
      return { ...p, ctr, roas };
    }).filter((p) => p.name.includes(productState.search));

    const sorters = {
      conv_value_desc: (a, b) => b.conversionValue - a.conversionValue,
      roas_desc: (a, b) => b.roas - a.roas,
      impressions_desc: (a, b) => b.impressions - a.impressions
    };
    rows.sort(sorters[productState.sort]);

    const pageSize = 6;
    const start = (productState.page - 1) * pageSize;
    const pageRows = rows.slice(start, start + pageSize);

    container.innerHTML = `
      ${metricGrid(M().summaryProducts)}
      <div class="gc-flex-between gc-mt-16">
        <input type="text" class="gc-input" id="product-search" placeholder="상품명으로 검색" value="${GC.esc(productState.search)}" style="width:200px;">
        <div class="gc-flex gc-gap-8">
          <div class="gc-dropdown">
            <button class="gc-btn gc-btn-sm" data-dropdown-toggle>정렬: ${sortLabel(productState.sort)} ▾</button>
            <div class="gc-dropdown-menu">
              <button data-sort="conv_value_desc" class="${productState.sort === "conv_value_desc" ? "active" : ""}">전환가치 높은순</button>
              <button data-sort="roas_desc" class="${productState.sort === "roas_desc" ? "active" : ""}">ROAS 높은순</button>
              <button data-sort="impressions_desc" class="${productState.sort === "impressions_desc" ? "active" : ""}">노출수 높은순</button>
            </div>
          </div>
          <button class="gc-btn gc-btn-sm" id="btn-ads-item-product">항목 설정</button>
        </div>
      </div>
      <div class="gc-table-wrap gc-mt-12">
        <table class="gc-table">
          <thead><tr><th>상품 정보</th><th>캠페인명</th><th>노출수</th><th>클릭수</th><th>CTR</th><th>전환수</th><th>광고비</th><th>전환가치</th><th>ROAS</th></tr></thead>
          <tbody>${pageRows.map((p) => `
            <tr>
              <td><div class="gc-product-cell"><div class="gc-product-thumb"></div><div><div class="gc-product-name">${GC.esc(p.name)}</div><div class="gc-product-cat">${GC.esc(p.category)}</div></div></div></td>
              <td>${GC.esc(p.campaignName)}</td>
              <td>${GC.fmtNumber(p.impressions)}</td>
              <td>${GC.fmtNumber(p.clicks)}</td>
              <td>${p.ctr.toFixed(2)}%</td>
              <td>${GC.fmtNumber(p.conversions)}</td>
              <td>${GC.fmtWon(p.cost)}</td>
              <td>${GC.fmtWon(p.conversionValue)}</td>
              <td>${p.roas.toFixed(0)}%</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
      <div class="gc-pagination" id="product-pagination"></div>
    `;

    container.querySelector("#product-search").addEventListener("input", (e) => { productState.search = e.target.value; productState.page = 1; renderProductTable(container); });
    container.querySelector("#btn-ads-item-product").addEventListener("click", () => openItemFieldsModal("product"));
    GC.initDropdowns(container);
    container.querySelectorAll("[data-sort]").forEach((b) => b.addEventListener("click", () => { productState.sort = b.dataset.sort; renderProductTable(container); }));
    GC.renderPagination(container.querySelector("#product-pagination"), {
      total: rows.length, pageSize, current: productState.page,
      onChange: (p) => { productState.page = p; renderProductTable(container); }
    });
  }

  function sortLabel(key) {
    return { conv_value_desc: "전환가치 높은순", roas_desc: "ROAS 높은순", impressions_desc: "노출수 높은순" }[key];
  }

  function openOpsModal() {
    const d = M();
    const avgScore = Math.round(d.campaigns.reduce((s, c) => s + c.optimizationScore, 0) / d.campaigns.length);

    const html = `
      <div class="gc-modal-header">
        <div><h3 class="gc-modal-title">광고 운영 상태</h3><p class="gc-modal-sub">Google Ads 계정 및 캠페인의 운영 상태를 한눈에 확인하고, 광고 성과 개선을 위한 권장사항과 Merchant Center 진단 정보를 확인할 수 있습니다.</p></div>
        <button class="gc-modal-close" data-close-modal>✕</button>
      </div>
      <div class="gc-modal-body">
        <div class="gc-flex gc-gap-8" style="margin-bottom:16px;">
          <div class="gc-card" style="flex:1; display:flex; align-items:center; gap:10px;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; border:1.5px solid var(--gc-primary); color:var(--gc-primary); font-size:11px;">%</span>
            <div><span class="gc-muted small">최적화 점수</span><br><b style="font-size:18px;">${avgScore}%</b></div>
          </div>
          <div class="gc-card" style="flex:1; display:flex; align-items:center; gap:10px;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; border:1.5px solid var(--gc-primary); color:var(--gc-primary); font-size:11px;">i</span>
            <div><span class="gc-muted small">권장사항</span><br><b style="font-size:18px;">${d.recommendations.length}건</b></div>
          </div>
          <div class="gc-card" style="flex:1; display:flex; align-items:center; gap:10px;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; border:1.5px solid var(--gc-warning); color:var(--gc-warning); font-size:11px;">!</span>
            <div><span class="gc-muted small">진단 및 알림</span><br><b style="font-size:18px;">${d.diagnostics.length}건</b></div>
          </div>
        </div>
        <div class="gc-subtabs" data-tab-group="ops-tabs">
          <button class="gc-subtab active" data-tab-target="rec">광고 개선 권장사항</button>
          <button class="gc-subtab" data-tab-target="diag">진단 및 알림</button>
        </div>
        <div data-tab-panel="rec">
          ${d.recommendations.map((r) => `
            <div class="gc-card">
              <div class="gc-flex gc-gap-8" style="margin-bottom:6px;"><span class="gc-badge gc-badge-info">${r.category}</span><span class="gc-muted small">대상: ${GC.esc(r.target)}</span></div>
              <div style="font-weight:700; margin-bottom:4px;">${GC.esc(r.title)}</div>
              <div class="gc-muted small">${GC.esc(r.description)}</div>
              ${r.impact ? `<div class="gc-small" style="color:var(--gc-success); margin-top:6px;">예상 효과: ${GC.esc(r.impact)}</div>` : ""}
              <div class="gc-mt-12"><button class="gc-btn gc-btn-sm">Google Ads에서 확인</button></div>
            </div>`).join("")}
          <p class="gc-faint small" style="margin-top:8px;">권장사항은 Google Ads API 결과를 기반으로 제공됩니다.</p>
        </div>
        <div data-tab-panel="diag" class="gc-hidden">
          ${d.diagnostics.map((x) => `
            <div class="gc-card">
              <div class="gc-flex gc-gap-8" style="margin-bottom:6px;">
                <span class="gc-badge ${x.severity === "조치 필요" ? "gc-badge-danger" : "gc-badge-warning"}">${x.severity}</span>
                <span class="gc-muted small">${x.source}</span>
              </div>
              <div style="font-weight:700; margin-bottom:4px;">${GC.esc(x.title)}</div>
              <div class="gc-muted small">${GC.esc(x.description)}</div>
              ${x.lastChecked ? `<div class="gc-faint small gc-mt-8">마지막 확인 ${x.lastChecked}</div>` : ""}
              <div class="gc-mt-12"><button class="gc-btn gc-btn-sm">${x.buttonLabel}</button></div>
            </div>`).join("")}
        </div>
      </div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>닫기</button></div>
    `;
    const backdrop = GC.openModal(html, { size: "wide" });
    GC.initTabs(backdrop);
  }

  function openItemFieldsModal(kind) {
    const src = kind === "ads" ? M().adsItemFields : M().productItemFields;
    let selected = JSON.parse(JSON.stringify(src.selectedDefault));
    let available = JSON.parse(JSON.stringify(src.available));
    const title = kind === "ads" ? "광고 캠페인 현황 타이틀 양식 관리" : "상품 광고 현황 타이틀 양식 관리";

    function body() {
      return `
        <div class="gc-modal-header">
          <div><h3 class="gc-modal-title">${title}</h3><p class="gc-modal-sub">SCR-GOOGLE-ADS-001 / 연동 완료 시 — 항목(컬럼) 설정 모달</p></div>
          <button class="gc-modal-close" data-close-modal>✕</button>
        </div>
        <div class="gc-modal-body">
          <div class="gc-grid-2">
            <div>
              <div class="gc-small gc-muted gc-mt-8" style="margin-bottom:6px;">선택 가능한 타이틀 목록</div>
              <input type="text" class="gc-input" id="avail-search" placeholder="검색" style="width:100%; margin-bottom:8px;">
              <div id="avail-list" style="border:1px solid var(--gc-border); border-radius:6px; max-height:320px; overflow-y:auto;"></div>
            </div>
            <div>
              <div class="gc-small gc-muted gc-mt-8" style="margin-bottom:6px;">선택한 타이틀 목록</div>
              <input type="text" class="gc-input" id="sel-search" placeholder="검색" style="width:100%; margin-bottom:8px;">
              <div id="sel-list" style="border:1px solid var(--gc-border); border-radius:6px; max-height:320px; overflow-y:auto;"></div>
            </div>
          </div>
        </div>
        <div class="gc-modal-footer spread">
          <button class="gc-btn" id="btn-reset-fields">기본값으로 초기화</button>
          <div class="gc-flex gc-gap-8"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-primary" id="btn-save-fields">저장</button></div>
        </div>
      `;
    }

    function rowHtml(item, mode) {
      const lockIcon = item.fixed ? '<span style="color:var(--gc-danger); font-weight:700;">*</span> ' : "";
      const btn = mode === "avail"
        ? `<button class="gc-btn gc-btn-sm" data-add="${item.key}">추가 ▸</button>`
        : (item.fixed ? "" : `<button class="gc-btn gc-btn-sm" data-remove="${item.key}">◂ 제거</button>`);
      const move = mode === "sel" && !item.fixed ? `<span class="gc-flex gc-gap-8"><button class="gc-btn gc-btn-sm" data-up="${item.key}">▲</button><button class="gc-btn gc-btn-sm" data-down="${item.key}">▼</button></span>` : "";
      return `<div class="gc-flex-between" style="padding:8px 10px; border-bottom:1px solid var(--gc-border);">
        <div><div>${lockIcon}${GC.esc(item.label)}</div><div class="gc-faint" style="font-size:11px;">${GC.esc(item.desc)}</div></div>
        <div class="gc-flex gc-gap-8">${move}${btn}</div>
      </div>`;
    }

    function refreshLists(backdrop, availFilter = "", selFilter = "") {
      backdrop.querySelector("#avail-list").innerHTML = available.filter((i) => i.label.includes(availFilter)).map((i) => rowHtml(i, "avail")).join("") || `<div class="gc-muted small" style="padding:12px;">항목 없음</div>`;
      backdrop.querySelector("#sel-list").innerHTML = selected.map((i) => rowHtml(i, "sel")).join("");
      backdrop.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
        const idx = available.findIndex((i) => i.key === b.dataset.add);
        selected.push(available[idx]); available.splice(idx, 1);
        refreshLists(backdrop);
      }));
      backdrop.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => {
        const idx = selected.findIndex((i) => i.key === b.dataset.remove);
        available.push(selected[idx]); selected.splice(idx, 1);
        refreshLists(backdrop);
      }));
      backdrop.querySelectorAll("[data-up]").forEach((b) => b.addEventListener("click", () => {
        const idx = selected.findIndex((i) => i.key === b.dataset.up);
        if (idx > 0) { [selected[idx - 1], selected[idx]] = [selected[idx], selected[idx - 1]]; refreshLists(backdrop); }
      }));
      backdrop.querySelectorAll("[data-down]").forEach((b) => b.addEventListener("click", () => {
        const idx = selected.findIndex((i) => i.key === b.dataset.down);
        if (idx < selected.length - 1) { [selected[idx + 1], selected[idx]] = [selected[idx], selected[idx + 1]]; refreshLists(backdrop); }
      }));
    }

    const backdrop = GC.openModal(body(), {
      size: "wide",
      onOpen: (bd) => {
        refreshLists(bd);
        bd.querySelector("#avail-search").addEventListener("input", (e) => refreshLists(bd, e.target.value));
        bd.querySelector("#btn-reset-fields").addEventListener("click", () => {
          selected = JSON.parse(JSON.stringify(src.selectedDefault));
          available = JSON.parse(JSON.stringify(src.available));
          refreshLists(bd);
          GC.toast("기본값으로 초기화되었습니다.", "info");
        });
        bd.querySelector("#btn-save-fields").addEventListener("click", () => {
          GC.toast("항목 설정이 저장되었습니다.", "success");
          GC.closeModal(bd);
        });
      }
    });
  }

  function renderConnected(container) {
    const d = M();
    container.innerHTML = `
      <div class="gc-box gc-mt-16" style="margin-bottom:28px;">
        <div class="gc-box-title" style="font-size:15px;">Google Ads</div>
        <div class="gc-box-desc" style="margin-bottom:0;">Google Ads 기능 사용을 위해 필요한 Google Ads 계정을 연결하는 공간입니다. Google Ads 계정을 연동하면 광고 캠페인 운영에 필요한 계정 정보와 광고 성과, 전환 측정 현황 등을 메이크샵에서 통합 관리할 수 있습니다.<br>Merchant Center와 함께 연결하면 상품 기반 광고 운영 및 상품별 광고 성과까지 함께 확인할 수 있습니다.</div>
      </div>

      ${d.account.status === "reauth_required" ? `
      <div class="gc-consent-box" style="background:#fffbeb;border-color:#fde68a;margin-bottom:16px;">
        <div class="gc-small" style="font-weight:700;color:#b45309;">■ Google 계정 인증이 만료되어 최신 데이터를 불러오지 못하고 있어요.</div>
        <div class="gc-small" style="color:#b45309;">아래는 마지막으로 확인된 정보이며, Google 계정을 다시 연결하면 최신 데이터로 갱신돼요.</div>
      </div>` : ""}

      <div class="gc-section">
        <div class="gc-section-title">Google Ads 설정</div>
        <div class="gc-box">
          <div class="gc-flex-between">
            <div class="gc-box-title" style="margin-bottom:0;">Google Ads 계정 정보</div>
            <a href="#" class="gc-btn-link gc-small">Google Ads 바로가기</a>
          </div>
          <div class="gc-field-grid gc-mt-16">
            <div class="gc-field"><div class="lbl">계정명</div><div class="val gc-flex gc-gap-8" style="align-items:center;">${GC.esc(d.account.name)} <span class="gc-badge ${d.account.status === "reauth_required" ? "gc-badge-warning" : "gc-badge-success"}">${d.account.status === "reauth_required" ? "재인증 필요" : "연결됨"}</span></div></div>
            <div class="gc-field"><div class="lbl">고객 ID</div><div class="val">${d.account.customerId}</div></div>
            <div class="gc-field"><div class="lbl">연결한 Google 계정</div><div class="val">${GC.esc(d.account.linkedGoogleAccount)}</div></div>
            <div class="gc-field"><div class="lbl">결제통화</div><div class="val">${d.account.currency}</div></div>
            <div class="gc-field"><div class="lbl">시간대</div><div class="val">${d.account.timezone}</div></div>
          </div>
          <hr class="gc-subbox-divider">
          <div class="gc-flex gc-gap-8" style="justify-content:flex-end;">
            <button class="gc-btn gc-btn-sm" id="btn-ads-change">계정 변경</button>
            <button class="gc-btn gc-btn-sm gc-btn-danger" id="btn-ads-disconnect">연결 해제</button>
          </div>
        </div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">광고 측정</div>
        <div class="gc-box">
          <div class="gc-box-title">전환 측정 상태</div>
          <hr class="gc-subbox-divider">
          <div class="gc-field-grid">
            ${d.measurement.items.map((m) => `
              <div class="gc-field"><div class="lbl">${GC.esc(m.label)}</div><div class="val ${m.status === "정상" ? "ok" : "warn"}">${m.status}</div></div>`).join("")}
            <div class="gc-field"><div class="lbl">최근 수집 일시(메이크샵 자체 로그)</div><div class="val muted">${d.measurement.lastCollectedAt}</div></div>
          </div>
        </div>
      </div>

      ${d.mcLink.detected ? `
      <div class="gc-section">
        <div class="gc-box" style="background:var(--gc-info-bg); border-color:var(--gc-info);">
          <div style="font-weight:700; margin-bottom:4px;">이 Google Ads 계정에 이미 연결된 Merchant Center 계정이 있어요</div>
          <div class="gc-small gc-muted">메이크샵에는 아직 연동돼 있지 않아요. 지금 연결하면 새 계정을 만들 필요 없이 바로 상품 광고 성과 기능을 연동하여 사용할 수 있어요.</div>
          <div class="gc-small gc-mt-8">Merchant Center 계정명: <b>${GC.esc(d.mcLink.accountName)}</b> · ID: ${d.mcLink.accountId}</div>
          <div class="gc-mt-12"><button class="gc-btn gc-btn-primary gc-btn-sm" id="btn-mc-link-connect">이 Merchant Center를 메이크샵에 연결</button></div>
        </div>
      </div>` : ""}

      <div class="gc-section">
        <div class="gc-section-title">광고 캠페인</div>
        <div class="gc-box">
          <div class="gc-subtabs" data-tab-group="campaign-type-tabs">
            <button class="gc-subtab active" data-tab-target="type-ads">광고 기준</button>
            <button class="gc-subtab" data-tab-target="type-products">상품 기준</button>
          </div>
          <div class="gc-flex-between gc-mt-16">
            <div class="gc-box-title" style="margin-bottom:0;">광고 성과 요약</div>
            <div class="gc-flex gc-gap-8">
              <span class="gc-small gc-muted">조회기간</span>
              <div class="gc-seg" id="date-pills">
                ${["오늘", "어제", "최근 7일", "최근 30일", "이번 달", "직접 설정"].map((l, i) => `<button class="${i === 1 ? "active" : ""}" data-pill>${l}</button>`).join("")}
              </div>
            </div>
          </div>
          <div data-tab-panel="type-ads">
            ${metricGrid(d.summaryAds)}
            <div class="gc-faint small gc-mt-12">성과 데이터는 Google Ads API 기준이며 반영까지 최대 1일 이상 소요될 수 있습니다. 정확한 데이터는 Google Ads 관리자에서 확인하세요.</div>
            <hr class="gc-subbox-divider">
            <div class="gc-box-title">캠페인 현황</div>
            <div id="campaign-table-mount"></div>
          </div>
          <div data-tab-panel="type-products" class="gc-hidden">
            <hr class="gc-subbox-divider">
            <div id="product-table-mount"></div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-pill]").forEach((b) => b.addEventListener("click", () => {
      container.querySelectorAll("[data-pill]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
    }));

    GC.initTabs(container);
    renderCampaignTable(container.querySelector("#campaign-table-mount"));
    renderProductTable(container.querySelector("#product-table-mount"));

    container.querySelector("#btn-ads-disconnect").addEventListener("click", () => {
      const html = `
        <div class="gc-modal-header"><h3 class="gc-modal-title">Google Ads 연결을 해제할까요?</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
        <div class="gc-modal-body gc-muted small">연결을 해제하면 광고 캠페인 조회·전환 측정 기능이 즉시 비활성화됩니다. 이 작업은 언제든 다시 연결하여 되돌릴 수 있습니다.</div>
        <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-danger" id="confirm-disconnect">연결 해제</button></div>`;
      const bd = GC.openModal(html);
      bd.querySelector("#confirm-disconnect").addEventListener("click", () => {
        GC.closeModal(bd);
        GC.toast("Google Ads 연결이 해제되었습니다.", "success");
        const sel = document.getElementById("dev-ads-state");
        sel.value = "Ads계정미연동";
        window.GC_ADS.render(document.getElementById("panel-ads"), "Ads계정미연동");
      });
    });
    container.querySelector("#btn-ads-change").addEventListener("click", () => GC.toast("계정 변경 화면으로 이동합니다.", "info"));
    const mcBtn = container.querySelector("#btn-mc-link-connect");
    if (mcBtn) mcBtn.addEventListener("click", () => GC.toast("Merchant Center가 연결되었습니다.", "success"));
  }

  // 근거(Source of Truth): SCR-GOOGLE-ADS-001-구글계정미연동.svg / -Ads계정미연동.svg
  // 상단 "Google Ads" 안내 박스 + 점선 테두리 Empty State(아이콘/헤드라인/설명/CTA/안내박스), 중앙 정렬.
  const ADS_EMPTY_CFG = {
    구글계정미연동: { title: "Google 계정 연동 후 Google 애즈를 사용할 수 있어요", sub: "계정을 연동하면 상품 피드가 자동으로 연결되어 광고 소재로 활용돼요", btn: "Google 계정 연동하기", hint: "버튼을 누르면 연결 관리 탭으로 이동한 뒤 Google 계정 연동 팝업이 자동으로 열려요" },
    Ads계정미연동: { title: "Google Ads 계정을 연결하면 광고를 시작할 수 있어요", sub: "Google 계정에 연결된 Google 애즈 계정을 선택하거나 새로 만들어 쇼핑 광고를 시작해보세요", btn: "Google Ads 연결하기", hint: "버튼을 누르면 연결 관리 탭의 Merchant Center 연결 영역으로 이동해요" }
  };

  function renderEmpty(container, kind) {
    const cfg = ADS_EMPTY_CFG[kind];
    container.innerHTML = `
      <div class="gc-box gc-mt-16" style="margin-bottom:28px;">
        <div class="gc-box-title" style="font-size:15px;">Google Ads</div>
        <div class="gc-box-desc" style="margin-bottom:0;">Google Ads 기능 사용을 위해 필요한 Google Ads 계정을 연결하는 공간입니다. Google Ads 계정을 연동하면 광고 캠페인 운영에 필요한 계정 정보와 광고 성과, 전환 측정 현황 등을 메이크샵에서 통합 관리할 수 있습니다.<br>Merchant Center와 함께 연결하면 상품 기반 광고 운영 및 상품별 광고 성과까지 함께 확인할 수 있습니다.</div>
      </div>
      <div class="gc-empty-wrap">
        <div class="gc-empty">
          <div class="gc-empty-icon">G</div>
          <div class="gc-empty-title">${cfg.title}</div>
          <div class="gc-empty-sub">${cfg.sub}</div>
          <button class="gc-btn gc-btn-primary" id="btn-empty-cta">${cfg.btn}</button>
          <div class="gc-empty-hint">${cfg.hint}</div>
        </div>
      </div>
    `;
    container.querySelector("#btn-empty-cta").addEventListener("click", () => GC.toast("연결 관리 탭으로 이동합니다.", "info"));
  }

  window.GC_ADS = {
    mountId: "panel-ads",
    states: [
      { value: "구글계정미연동", label: "구글 계정 미연동" },
      { value: "Ads계정미연동", label: "Ads 계정 미연동" },
      { value: "연동완료", label: "연동완료" },
      { value: "재인증필요", label: "연동완료 — Google 계정 재인증 필요" },
      { value: "MC계정감지", label: "연동완료 — MC 계정 감지(상품피드 미연동)" }
    ],
    render(container, state) {
      campaignState = { subtab: "basic", search: "", page: 1 };
      productState = { sort: "conv_value_desc", search: "", page: 1 };
      M().account.status = state === "재인증필요" ? "reauth_required" : "connected";
      // "MC 계정 감지" 배너는 상품피드(Merchant Center)가 메이크샵에 아직 연동되지 않은 경우에만 노출된다.
      M().mcLink.detected = state === "MC계정감지";
      if (state === "연동완료" || state === "재인증필요" || state === "MC계정감지") renderConnected(container);
      else renderEmpty(container, state);
    }
  };
})();
