/* 상품 피드 탭 — 렌더링 로직
   근거: 04_Screen-Spec/02. 상품피드 탭/*.svg, 05_Policy/02. 상품피드 탭/2-1(운영 화면)·2-2(상품 피드 반영)·2-3(카테고리 매칭) 정책.pdf */

(function () {
  const M = () => window.MOCK_FEED;

  const STATUS_TABS = [
    { key: "전체", label: "전체" },
    { key: "활동중", label: "활동중" },
    { key: "검토중", label: "검토중" },
    { key: "미승인", label: "미승인" },
    { key: "노출제한", label: "노출제한" },
    { key: "사용안함", label: "사용안함" }
  ];

  let listState = { tab: "전체", search: "", page: 1, selected: new Set() };

  function statusBadge(s) {
    const map = { "활동중": "gc-badge-success", "검토중": "gc-badge-info", "미승인": "gc-badge-danger", "노출제한": "gc-badge-warning", "사용안함": "gc-badge-neutral" };
    return `<span class="gc-badge ${map[s]}">${s}</span>`;
  }

  function productCols(tab) {
    const base = [
      { h: "", w: true },
      { h: "상품정보" }, { h: "가격" }, { h: "연동 상품 수" }
    ];
    if (tab === "전체") return [...base, { h: "상태" }, { h: "Google 상품 카테고리" }, { h: "관리" }];
    if (tab === "미승인") return [...base, { h: "Google 상품 카테고리" }, { h: "미승인 사유" }, { h: "관리" }];
    if (tab === "노출제한") return [...base, { h: "노출제한 사유" }, { h: "관리" }];
    if (tab === "사용안함") return [...base, { h: "피드 제외일시" }, { h: "관리" }];
    return [...base, { h: "Google 상품 카테고리" }, { h: "관리" }]; // 활동중/검토중
  }

  function renderRow(p, tab, cols) {
    let extra = "";
    if (tab === "전체") extra = `<td>${statusBadge(p.status)}</td><td>${p.googleCategory ? GC.esc(p.googleCategory) : '<span class="gc-faint">-</span>'}</td>`;
    else if (tab === "미승인") extra = `<td>${p.googleCategory ? GC.esc(p.googleCategory) : "-"}</td><td class="gc-small" style="color:var(--gc-danger)">${GC.esc(p.reason || "-")}</td>`;
    else if (tab === "노출제한") extra = `<td class="gc-small" style="color:var(--gc-warning)">${GC.esc(p.reason || "-")}</td>`;
    else if (tab === "사용안함") extra = `<td class="gc-small gc-muted">${p.disabledAt || "-"}</td>`;
    else extra = `<td>${p.googleCategory ? GC.esc(p.googleCategory) : '<span class="gc-faint">-</span>'}</td>`;
    return `<tr>
      <td class="gc-td-check"><input type="checkbox" class="gc-checkbox" data-row-check value="${p.id}" ${listState.selected.has(p.id) ? "checked" : ""}></td>
      <td><div class="gc-product-cell"><div class="gc-product-thumb"></div><div><div class="gc-product-name">${GC.esc(p.name)}</div><div class="gc-product-cat">${p.code}</div></div></div></td>
      <td>${GC.fmtWon(p.price)}</td>
      <td>1</td>
      ${extra}
      <td><button class="gc-btn gc-btn-sm" data-detail="${p.id}">관리</button></td>
    </tr>`;
  }

  function renderProductList(container) {
    const d = M();
    const all = d.products;
    const counts = {
      전체: all.length,
      활동중: all.filter((p) => p.status === "활동중").length,
      검토중: all.filter((p) => p.status === "검토중").length,
      미승인: all.filter((p) => p.status === "미승인").length,
      노출제한: all.filter((p) => p.status === "노출제한").length,
      사용안함: all.filter((p) => p.status === "사용안함").length
    };
    const filtered = all.filter((p) => (listState.tab === "전체" || p.status === listState.tab) && p.name.includes(listState.search));
    const pageSize = 6;
    const start = (listState.page - 1) * pageSize;
    const pageRows = filtered.slice(start, start + pageSize);
    const cols = productCols(listState.tab);

    container.innerHTML = `
      <div class="gc-subtabs" data-tab-group="feed-status-tabs">
        ${STATUS_TABS.map((t) => `<button class="gc-subtab ${t.key === listState.tab ? "active" : ""}" data-tab-target="${t.key}">${t.label} <span class="cnt">(${counts[t.key]})</span></button>`).join("")}
      </div>
      <div class="gc-flex-between" style="margin:14px 0;">
        <span class="gc-small gc-muted" id="sel-count">${listState.selected.size > 0 ? listState.selected.size + "개 선택됨" : ""}</span>
        <div class="gc-flex gc-gap-8" id="feed-toolbar">
          <div class="gc-search"><span class="ic">🔍</span><input type="text" id="feed-search" placeholder="상품명으로 검색" value="${GC.esc(listState.search)}"></div>
          <button class="gc-btn gc-btn-sm" id="btn-bulk-edit" ${listState.selected.size === 0 ? "disabled" : ""}>선택수정</button>
        </div>
      </div>
      <div class="gc-table-wrap">
        <table class="gc-table">
          <thead><tr>${cols.map((c) => `<th class="${c.w ? "gc-th-check" : ""}">${c.h}</th>`).join("")}</tr></thead>
          <tbody>${pageRows.length ? pageRows.map((p) => renderRow(p, listState.tab, cols)).join("") : `<tr><td colspan="${cols.length}" style="text-align:center; padding:30px;" class="gc-muted">해당 조건의 상품이 없습니다.</td></tr>`}</tbody>
        </table>
      </div>
      <div class="gc-pagination" id="feed-pagination"></div>
    `;

    container.querySelectorAll("[data-tab-target]").forEach((btn) => {
      btn.addEventListener("click", () => { listState.tab = btn.dataset.tabTarget; listState.page = 1; renderProductList(container); });
    });
    container.querySelector("#feed-search").addEventListener("input", (e) => { listState.search = e.target.value; listState.page = 1; renderProductList(container); });
    container.querySelectorAll("[data-row-check]").forEach((cb) => cb.addEventListener("change", () => {
      if (cb.checked) listState.selected.add(cb.value); else listState.selected.delete(cb.value);
      renderProductList(container);
    }));
    container.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => openProductDetailModal(b.dataset.detail)));
    const bulkBtn = container.querySelector("#btn-bulk-edit");
    if (bulkBtn) bulkBtn.addEventListener("click", () => openBulkEditModal([...listState.selected]));
    GC.renderPagination(container.querySelector("#feed-pagination"), {
      total: filtered.length, pageSize, current: listState.page,
      onChange: (p) => { listState.page = p; renderProductList(container); }
    });
  }

  // 근거: 05_Policy/02. 상품피드 탭/2-3. 상품피드 탭 - 카테고리 매칭 정책.pdf 3-4장 —
  // 성별·연령대는 매칭된 Google 상품 카테고리가 "의류 및 액세서리(GPC 166)" 하위인 상품에만 노출한다(그 외 카테고리는 항목 자체를 숨김).
  // 사용여부 토글이 OFF인 행은 Google 카테고리 선택란과 함께 성별·연령대 선택란도 비활성화된다(3-1-3장).
  function categoryFieldsRow(item, idx, prefix, hideShopCategory, withGenderAge) {
    const showGenderAge = withGenderAge && item.apparel;
    return `
      <tr>
        <td><button class="gc-toggle ${item.enabled ? "on" : ""}" data-toggle-enabled="${idx}"><span class="knob"></span></button></td>
        ${hideShopCategory ? "" : `<td class="gc-muted small">${GC.esc(item.shopCategory)}</td>`}
        <td><select class="gc-select" data-field="googleCategory" data-idx="${idx}" style="width:220px;" ${item.enabled ? "" : "disabled"}><option ${!item.googleCategory ? "selected" : ""} value="">Google 자동 분류</option><option ${item.googleCategory === "Apparel & Accessories > Clothing > Shirts & Tops" ? "selected" : ""} value="Apparel & Accessories > Clothing > Shirts & Tops">의류 &gt; 상의 &gt; 셔츠</option><option ${item.googleCategory === "Electronics > Audio > Headphones" ? "selected" : ""} value="Electronics > Audio > Headphones">전자기기 &gt; 오디오 &gt; 이어폰</option></select></td>
        <td><span class="gc-badge ${item.mode === "직접 매칭" ? "gc-badge-info" : item.mode === "매칭 제외" ? "gc-badge-neutral" : "gc-badge-success"}">${item.mode}</span></td>
        ${withGenderAge ? (showGenderAge ? `
        <td><select class="gc-select" data-field="gender" data-idx="${idx}" ${item.enabled ? "" : "disabled"}>${M().genders.map((g) => `<option value="${g.value}" ${g.value === item.gender ? "selected" : ""}>${g.label}</option>`).join("")}</select></td>
        <td><select class="gc-select" data-field="age" data-idx="${idx}" ${item.enabled ? "" : "disabled"}>${M().ageGroups.map((a) => `<option value="${a.value}" ${a.value === item.age ? "selected" : ""}>${a.label}</option>`).join("")}</select></td>` : `<td class="gc-faint small">해당없음</td><td class="gc-faint small">해당없음</td>`) : ""}
      </tr>`;
  }

  // 근거: FINAL WIREFRAME/3. 상품피드 탭/SCR-GOOGLE-FEED-001-카테고리매칭모달-신규.svg (INITIAL, 미연동 상태 전용)
  // 관리용(MANAGE) 모달과 동일한 4컬럼 구조(사용여부·메이크샵 카테고리·Google 카테고리·적용방식)를 그대로 씀 — 성별·연령대만 없음(상품 단위 전용, 4장).
  function openCategoryMatchingModalInitial(onFullSync) {
    const d = M();
    const items = JSON.parse(JSON.stringify(d.categories));
    const total = items.length;
    const auto = items.filter((c) => c.mode === "자동 분류").length;
    const manual = items.filter((c) => c.mode === "직접 매칭").length;
    const excluded = items.filter((c) => c.mode === "매칭 제외").length;
    const html = `
      <div class="gc-modal-header">
        <div><h3 class="gc-modal-title">구글 카테고리 매칭</h3><p class="gc-modal-sub">상품 카테고리를 Google 상품 카테고리와 연결하는 설정입니다. 원하는 구글 상품 카테고리와 매칭도 가능하며, 직접 매칭하지 않고 자동 분류 설정할 수 있습니다.</p></div>
        <button class="gc-modal-close" data-close-modal>✕</button>
      </div>
      <div class="gc-modal-body">
        <div class="gc-small gc-muted" style="margin-bottom:10px;">전체 ${total}개 | 자동 분류 ${auto}개 | 직접 매칭 ${manual}개 | 사용안함 ${excluded}개</div>
        <div class="gc-table-wrap" style="max-height:360px; overflow-y:auto;">
          <table class="gc-table">
            <thead><tr><th>사용여부</th><th>메이크샵 카테고리</th><th>Google 상품 카테고리</th><th>적용 방식</th></tr></thead>
            <tbody>${items.map((it, i) => categoryFieldsRow(it, i, "cat-initial", false, false)).join("")}</tbody>
          </table>
        </div>
      </div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>나중에 반영</button><button class="gc-btn gc-btn-primary" id="btn-cat-initial-apply">상품 피드 반영</button></div>
    `;
    const backdrop = GC.openModal(html, {
      size: "xwide",
      onOpen: (bd) => {
        bd.querySelectorAll("[data-toggle-enabled]").forEach((btn) => btn.addEventListener("click", () => { GC.toggle(btn); }));
      }
    });
    backdrop.querySelector("#btn-cat-initial-apply").addEventListener("click", () => {
      GC.closeModal(backdrop);
      if (onFullSync) onFullSync();
    });
  }

  function openCategoryMatchingModal() {
    const d = M();
    const items = JSON.parse(JSON.stringify(d.categories));
    const selected = new Set();

    function body() {
      return `
        <div class="gc-modal-header">
          <div><h3 class="gc-modal-title">구글 카테고리 매칭</h3><p class="gc-modal-sub">상품 카테고리를 Google 상품 카테고리와 연결하는 설정입니다. 원하는 구글 상품 카테고리와 매칭도 가능하며, 직접 매칭하지 않고 자동 분류 설정할 수 있습니다.</p></div>
          <button class="gc-modal-close" data-close-modal>✕</button>
        </div>
        <div class="gc-modal-body">
          <div class="gc-small gc-muted" style="margin-bottom:10px;">전체 ${d.categorySummary.total}개 | 자동 분류 ${d.categorySummary.auto}개 | 직접 매칭 ${d.categorySummary.manual}개</div>
          <div class="gc-table-wrap" style="max-height:360px; overflow-y:auto;">
            <table class="gc-table">
              <thead><tr><th>사용여부</th><th>메이크샵 카테고리</th><th>Google 상품 카테고리</th><th>적용 방식</th></tr></thead>
              <tbody id="cat-rows">${items.map((it, i) => categoryFieldsRow(it, i, "cat", false, false)).join("")}</tbody>
            </table>
          </div>
          <div class="gc-mt-12"><button class="gc-btn gc-btn-sm" id="btn-cat-bulk">선택 일괄 수정</button></div>
        </div>
        <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-primary" id="btn-cat-save">저장</button></div>
      `;
    }

    const backdrop = GC.openModal(body(), {
      size: "xwide",
      onOpen: (bd) => {
        bd.querySelectorAll("[data-toggle-enabled]").forEach((btn) => btn.addEventListener("click", () => { GC.toggle(btn); }));
        bd.querySelector("#btn-cat-bulk").addEventListener("click", () => openBulkPopover(bd, false));
        bd.querySelector("#btn-cat-save").addEventListener("click", () => { GC.toast("카테고리 매칭이 저장되었습니다.", "success"); GC.closeModal(bd); });
      }
    });
  }

  function openBulkPopover(hostBackdrop, includeGenderAge) {
    const html = `
      <div class="gc-modal-header"><h3 class="gc-modal-title">${includeGenderAge ? "상품" : "카테고리"} 일괄 수정</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
      <div class="gc-modal-body">
        <div class="gc-mt-8"><label class="gc-small gc-muted">사용여부</label><br><div class="gc-seg gc-mt-8"><button class="active" data-seg="keep">변경 안 함</button><button data-seg="on">사용</button><button data-seg="off">사용안함</button></div></div>
        ${includeGenderAge ? `
        <div class="gc-mt-16"><label class="gc-small gc-muted">성별</label><br><select class="gc-select gc-mt-8" style="width:100%;"><option>변경 안 함</option>${M().genders.map((g) => `<option value="${g.value}">${g.label}</option>`).join("")}</select></div>
        <div class="gc-mt-16"><label class="gc-small gc-muted">연령대</label><br><select class="gc-select gc-mt-8" style="width:100%;"><option>변경 안 함</option>${M().ageGroups.map((a) => `<option value="${a.value}">${a.label}</option>`).join("")}</select></div>` : ""}
      </div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-primary" id="btn-apply-bulk">적용</button></div>
    `;
    const bd = GC.openModal(html, {
      onOpen: (b) => {
        b.querySelectorAll("[data-seg]").forEach((btn) => btn.addEventListener("click", () => { b.querySelectorAll("[data-seg]").forEach((x) => x.classList.remove("active")); btn.classList.add("active"); }));
        b.querySelector("#btn-apply-bulk").addEventListener("click", () => { GC.toast("선택한 항목에 일괄 반영되었습니다.", "success"); GC.closeModal(b); });
      }
    });
  }

  function openProductDetailModal(id) {
    const p = M().products.find((x) => x.id === id);
    if (!p) return;
    const html = `
      <div class="gc-modal-header"><h3 class="gc-modal-title">상품 카테고리 매칭</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
      <div class="gc-modal-body">
        <div class="gc-card">
          <div class="gc-flex-between">
            <div class="gc-small">
              상품코드: ${p.code}<br>상품명: ${GC.esc(p.name)}<br>판매가: ${GC.fmtWon(p.price)}<br>진열상태: 진열함 · 판매상태: 판매함
            </div>
            <a href="#" class="gc-btn-link small">바로가기: 상품 상세 관리</a>
          </div>
          <div class="gc-faint small gc-mt-8">이 화면에서 직접 수정할 수 없고, 값을 바꾸려면 상품관리로 이동해야 해요.</div>
        </div>
        <div class="gc-card">
          <div class="gc-flex gc-gap-8">${statusBadge(p.status)} <span class="gc-badge gc-badge-neutral">판정: Google</span></div>
          <div class="gc-flex-between gc-mt-8">
            <div class="gc-small gc-muted">최근 연동일시: ${p.lastSyncAt}</div>
            <div class="gc-small">최근 전송 결과 <b style="color:${p.lastSyncAt === "-" ? "var(--gc-text-faint)" : "var(--gc-success)"};">${p.lastSyncAt === "-" ? "-" : "전송 완료"}</b></div>
          </div>
          ${p.reason ? `<div class="gc-small gc-muted gc-mt-8">사유: ${GC.esc(p.reason)}</div>` : ""}
        </div>
        <div class="gc-table-wrap">
          <table class="gc-table">
            <thead><tr><th>사용여부</th><th>Google 상품 카테고리</th><th>적용 방식</th><th>성별</th><th>연령대</th></tr></thead>
            <tbody>${categoryFieldsRow({ shopCategory: p.googleCategory || "(미지정)", enabled: p.enabled, googleCategory: p.googleCategory, mode: p.mode, gender: p.gender, age: p.age, apparel: p.apparel }, 0, "detail", true, true)}</tbody>
          </table>
        </div>
      </div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-primary" id="btn-detail-save">저장</button></div>
    `;
    const bd = GC.openModal(html, {
      onOpen: (b) => {
        b.querySelectorAll("[data-toggle-enabled]").forEach((btn) => btn.addEventListener("click", () => GC.toggle(btn)));
        b.querySelector("#btn-detail-save").addEventListener("click", () => { GC.toast("저장되었습니다.", "success"); GC.closeModal(b); });
      }
    });
  }

  function openBulkEditModal(ids) {
    const products = M().products.filter((p) => ids.includes(p.id));
    const html = `
      <div class="gc-modal-header"><h3 class="gc-modal-title">상품 카테고리 매칭</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
      <div class="gc-modal-body">
        <div class="gc-small gc-muted gc-mt-4" style="margin-bottom:10px;">${products.length}개 상품 선택됨 — 상품마다 카테고리·성별·연령대를 각각 다르게 지정할 수 있어요.</div>
        <div class="gc-table-wrap" style="max-height:340px; overflow-y:auto;">
          <table class="gc-table">
            <thead><tr><th>사용여부</th><th>상품 정보</th><th>Google 상품 카테고리</th><th>적용 방식</th><th>성별</th><th>연령대</th></tr></thead>
            <tbody>${products.map((p, i) => `
              <tr>
                <td><button class="gc-toggle ${p.enabled ? "on" : ""}" data-toggle-enabled="${i}"><span class="knob"></span></button></td>
                <td><div class="gc-product-cell"><div class="gc-product-thumb"></div><div class="gc-product-name">${GC.esc(p.name)}</div></div></td>
                <td><select class="gc-select" style="width:200px;"><option ${!p.googleCategory ? "selected" : ""}>Google 자동 분류</option><option ${p.googleCategory ? "selected" : ""}>${GC.esc(p.googleCategory || "")}</option></select></td>
                <td><span class="gc-badge gc-badge-info">${p.mode}</span></td>
                ${p.apparel ? `
                <td><select class="gc-select" ${p.enabled ? "" : "disabled"}>${M().genders.map((g) => `<option ${g.value === p.gender ? "selected" : ""}>${g.label}</option>`).join("")}</select></td>
                <td><select class="gc-select" ${p.enabled ? "" : "disabled"}>${M().ageGroups.map((a) => `<option ${a.value === p.age ? "selected" : ""}>${a.label}</option>`).join("")}</select></td>` : `<td class="gc-faint small">해당없음</td><td class="gc-faint small">해당없음</td>`}
              </tr>`).join("")}</tbody>
          </table>
        </div>
        <div class="gc-mt-12"><button class="gc-btn gc-btn-sm" id="btn-selected-bulk">선택 일괄 수정</button></div>
      </div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-primary" id="btn-selmod-save">저장</button></div>
    `;
    const bd = GC.openModal(html, {
      size: "wide",
      onOpen: (b) => {
        b.querySelectorAll("[data-toggle-enabled]").forEach((btn) => btn.addEventListener("click", () => GC.toggle(btn)));
        b.querySelector("#btn-selected-bulk").addEventListener("click", () => openBulkPopover(b, true));
        b.querySelector("#btn-selmod-save").addEventListener("click", () => { GC.toast("선택한 상품이 일괄 저장되었습니다.", "success"); GC.closeModal(b); });
      }
    });
  }

  let syncFilter = "전체";
  function openSyncHistoryModal() {
    const d = M();
    function rows() {
      const filtered = d.syncHistory.filter((h) => syncFilter === "전체" || h.result === syncFilter);
      return filtered.map((h, i) => `
        <tr>
          <td>${h.start}</td><td>${h.end}</td><td>${h.type}</td>
          <td>${GC.fmtNumber(h.target)}</td><td>${GC.fmtNumber(h.success)}</td><td>${GC.fmtNumber(h.fail)}</td>
          <td><span class="gc-badge ${h.result === "성공" ? "gc-badge-success" : h.result === "일부 실패" ? "gc-badge-warning" : h.result === "진행 중" ? "gc-badge-info" : "gc-badge-danger"}">${h.result}</span></td>
          <td>${h.failedItems ? `<button class="gc-btn gc-btn-sm" data-detail-idx="${d.syncHistory.indexOf(h)}">상세</button>` : '<span class="gc-faint">-</span>'}</td>
        </tr>`).join("");
    }
    const html = `
      <div class="gc-modal-header"><h3 class="gc-modal-title">동기화 이력</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
      <div class="gc-modal-body">
        <div class="gc-flex-between gc-mt-8" style="margin-bottom:12px;">
          <div class="gc-seg" id="sync-filter-seg">
            ${["전체", "성공", "일부 실패", "실패", "진행 중"].map((f) => `<button class="${f === syncFilter ? "active" : ""}" data-filter="${f}">${f}</button>`).join("")}
          </div>
          <div class="gc-flex gc-gap-8">
            ${["오늘", "어제", "최근 7일", "최근 30일", "이번 달", "직접 설정"].map((l, i) => `<button class="gc-btn gc-btn-sm ${i === 2 ? "gc-btn-primary" : ""}" data-preset>${l}</button>`).join("")}
          </div>
        </div>
        <div id="date-range-picker" class="gc-hidden gc-mt-8" style="margin-bottom:10px;">
          <input type="date" class="gc-input"> ~ <input type="date" class="gc-input">
        </div>
        <div class="gc-table-wrap">
          <table class="gc-table">
            <thead><tr><th>시작일시</th><th>완료일시</th><th>동기화 유형</th><th>대상 상품수</th><th>성공 상품수</th><th>실패 상품수</th><th>처리결과</th><th>관리</th></tr></thead>
            <tbody id="sync-rows">${rows()}</tbody>
          </table>
        </div>
      </div>
      <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>닫기</button></div>
    `;
    const bd = GC.openModal(html, {
      size: "xwide",
      onOpen: (b) => {
        b.querySelectorAll("[data-filter]").forEach((btn) => btn.addEventListener("click", () => {
          syncFilter = btn.dataset.filter;
          b.querySelectorAll("[data-filter]").forEach((x) => x.classList.remove("active"));
          btn.classList.add("active");
          b.querySelector("#sync-rows").innerHTML = rows();
          bindDetailButtons(b);
        }));
        b.querySelectorAll("[data-preset]").forEach((btn, i) => btn.addEventListener("click", () => {
          b.querySelectorAll("[data-preset]").forEach((x) => x.classList.remove("gc-btn-primary"));
          btn.classList.add("gc-btn-primary");
          b.querySelector("#date-range-picker").classList.toggle("gc-hidden", i !== 5);
        }));
        bindDetailButtons(b);
      }
    });
    function bindDetailButtons(b) {
      b.querySelectorAll("[data-detail-idx]").forEach((btn) => btn.addEventListener("click", () => openFailDrawer(d.syncHistory[Number(btn.dataset.detailIdx)])));
    }
  }

  function openFailDrawer(entry) {
    const html = `
      <div class="gc-modal-header"><h3 class="gc-modal-title">실패 상세</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
      <div class="gc-modal-body" style="flex:1; overflow-y:auto;">
        <div class="gc-small gc-muted gc-mt-8">${entry.start} 동기화 · 실패 ${entry.fail}건</div>
        ${(entry.failedItems || []).map((f) => `<div class="gc-card"><b>${GC.esc(f.name)}</b><div class="gc-faint small">${f.code}</div><div class="gc-small" style="color:var(--gc-danger); margin-top:4px;">${GC.esc(f.reason)}</div></div>`).join("")}
      </div>
    `;
    GC.openDrawer(html);
  }

  function renderNormal(container) {
    const d = M();
    const total = Object.values(d.statusBar).reduce((a, b) => a + b, 0);
    container.innerHTML = `
      <div class="gc-box gc-mt-16" style="margin-bottom:28px;">
        <div class="gc-box-title" style="font-size:15px;">상품 피드</div>
        <div class="gc-box-desc" style="margin-bottom:0;">Google Merchant Center와 연동하고 관리하는 공간입니다. Google 쇼핑 및 광고 운영에 필요한 상품 데이터를 Google Merchant Center로 전달하며, 상품 연동 상태·동기화 현황·오류 여부 등을 확인할 수 있습니다.</div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">동기화 현황</div>
        <div class="gc-box">
          <div class="gc-field-grid cols-4">
            <div class="gc-field"><div class="lbl">최근 동기화 결과</div><div class="val">${d.syncStatus.lastResult}</div></div>
            <div class="gc-field"><div class="lbl">최근 자동 동기화</div><div class="val">${d.syncStatus.lastAutoSyncAt}</div></div>
            <div class="gc-field"><div class="lbl">자동 반영 상태</div><div class="val">${d.syncStatus.autoApply ? "사용" : "사용 안 함"}</div></div>
            <div class="gc-field"><div class="lbl">최근 전체 동기화</div><div class="val">${d.syncStatus.lastFullSyncAt}</div></div>
            <div class="gc-field"><div class="lbl">처리 대기 상품 수</div><div class="val">${d.syncStatus.pendingCount}개</div></div>
            <div class="gc-field"><div class="lbl">전송 실패 상품 수</div><div class="val danger">${d.syncStatus.failedCount}개</div></div>
          </div>
          <hr class="gc-subbox-divider">
          <div class="gc-flex gc-gap-8" style="justify-content:flex-end;">
            <button class="gc-btn gc-btn-sm" id="btn-sync-history">동기화 이력</button>
            <button class="gc-btn gc-btn-sm gc-btn-primary" id="btn-resync">다시 동기화</button>
          </div>
        </div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">카테고리 매칭</div>
        <div class="gc-box gc-flex-between">
          <div class="gc-stat-row">
            <div class="gc-stat"><div class="lbl">전체 대상 카테고리</div><div class="val">${d.categorySummary.total}개</div></div>
            <div class="gc-stat"><div class="lbl">직접 매칭 카테고리</div><div class="val info">${d.categorySummary.manual}개</div></div>
            <div class="gc-stat"><div class="lbl">Google 자동 분류 카테고리</div><div class="val">${d.categorySummary.auto}개</div></div>
          </div>
          <div class="gc-flex gc-gap-16">
            <div class="gc-faint" style="font-size:11px; max-width:220px; line-height:1.6;">카테고리를 직접 매칭하지 않아도 Google 자동 분류가 적용돼요(항상 정상). 상품 전송은 차단되지 않아요.</div>
            <button class="gc-btn gc-btn-sm" id="btn-cat-matching">카테고리 매칭</button>
          </div>
        </div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">상품 피드 등록 현황</div>
        <div class="gc-box">
          <div class="gc-statusbar gc-mt-4" style="margin-bottom:18px;">
            ${["active", "review", "disapproved", "limited", "disabled"].map((k) => {
              const color = { active: "var(--gc-success)", review: "var(--gc-info)", disapproved: "var(--gc-danger)", limited: "#f59e0b", disabled: "#c7cbd3" }[k];
              return `<div style="width:${(d.statusBar[k] / total * 100).toFixed(1)}%; background:${color};"></div>`;
            }).join("")}
          </div>
          <div class="gc-flex-between">
            <div class="gc-stat-row">
              <div class="gc-stat"><div class="lbl">전체</div><div class="val">${GC.fmtNumber(total)}</div></div>
              <div class="gc-stat"><div class="lbl">활동중</div><div class="val success">${d.statusBar.active}</div></div>
              <div class="gc-stat"><div class="lbl">검토중</div><div class="val info">${d.statusBar.review}</div></div>
              <div class="gc-stat"><div class="lbl">미승인</div><div class="val danger">${d.statusBar.disapproved}</div></div>
              <div class="gc-stat"><div class="lbl">노출제한</div><div class="val warning">${d.statusBar.limited}</div></div>
              <div class="gc-stat"><div class="lbl">사용안함</div><div class="val">${d.statusBar.disabled}</div></div>
            </div>
            <a href="#" class="gc-btn-link gc-small">Merchant Center 바로가기</a>
          </div>
        </div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">프로그램별 피드</div>
        <div class="gc-box">
          <div class="gc-table-wrap"><table class="gc-table"><thead><tr><th>프로그램</th><th>활동중</th><th>검토중</th><th>미승인</th></tr></thead>
          <tbody>${d.programs.map((p) => `<tr><td>${p.name}</td><td>${p.active}</td><td>${p.review}</td><td>${p.disapproved}</td></tr>`).join("")}</tbody></table></div>
        </div>
      </div>

      <div class="gc-section">
        <div class="gc-section-title">상품 피드</div>
        <div class="gc-box" id="product-list-card"></div>
      </div>
    `;
    container.querySelector("#btn-sync-history").addEventListener("click", openSyncHistoryModal);
    container.querySelector("#btn-cat-matching").addEventListener("click", openCategoryMatchingModal);
    container.querySelector("#btn-resync").addEventListener("click", () => {
      const html = `<div class="gc-modal-header"><h3 class="gc-modal-title">다시 동기화하시겠습니까?</h3><button class="gc-modal-close" data-close-modal>✕</button></div>
        <div class="gc-modal-body gc-muted small">현재 등록된 전체 상품 정보를 Google Merchant Center로 다시 전송합니다.</div>
        <div class="gc-modal-footer"><button class="gc-btn" data-close-modal>취소</button><button class="gc-btn gc-btn-primary" id="confirm-resync">다시 동기화</button></div>`;
      const bd = GC.openModal(html);
      bd.querySelector("#confirm-resync").addEventListener("click", () => {
        GC.closeModal(bd);
        const btn = container.querySelector("#btn-resync");
        btn.disabled = true; btn.innerHTML = `<span class="gc-spinner"></span> 동기화 중...`;
        setTimeout(() => { GC.toast("동기화가 완료되었습니다.", "success"); renderNormal(container); }, 1500);
      });
    });
    listState.page = 1;
    renderProductList(container.querySelector("#product-list-card"));
  }

  // 근거(Source of Truth): SCR-GOOGLE-FEED-001-계정미연동.svg / -GMC미연동.svg / -상품피드미연동.svg / -동기화실패.svg
  // 4개 파일 모두 상단 "상품 피드" 안내 박스(AREA-DASHBOARD-INTRO) + 아래 Empty State 영역으로 동일 레이아웃.
  // 계정미연동/GMC미연동 = 점선 테두리(대시보드 진입 전), 상품피드미연동/동기화실패 = 실선 테두리("상품 피드" 섹션 제목 포함).
  const FEED_EMPTY_CFG = {
    계정미연동: { dashed: true, icon: "📦", title: "Google 계정 연동 후 상품 피드를 사용할 수 있어요", sub: "계정을 연동하면 상품 정보가 Google Merchant Center로 자동 동기화돼요", btns: [["Google 계정 연동하기", () => GC.toast("연결 관리 탭으로 이동합니다.", "info")]], hint: "버튼을 누르면 연결 관리 탭으로 이동한 뒤 Google 계정 연동 팝업이 자동으로 열려요" },
    GMC미연동: { dashed: true, icon: "📦", title: "Merchant Center 연동 후 상품 피드를 사용할 수 있어요", sub: "Merchant Center를 연동하면 상품 정보가 자동으로 동기화돼요 — Google 계정은 이미 연동돼 있어요", btns: [["Merchant Center 연동하기", () => GC.toast("연결 관리 탭의 Merchant Center 연결 영역으로 이동합니다.", "info")]], hint: "버튼을 누르면 연결 관리 탭의 Merchant Center 연결 영역으로 이동해요" },
    상품피드미연동: { dashed: false, icon: "📦", title: "아직 Google Merchant Center로 상품이 전송되지 않았습니다", sub: "상품 피드 연동을 시작하면 메이크샵 상품 정보를 Google Merchant Center로 전송합니다", btns: [["자동 매칭하기", null], ["직접 매칭하기", () => openCategoryMatchingModalInitial(startFullSyncFromEmpty)]] },
    동기화실패: { dashed: false, icon: "!", iconDanger: true, title: "아직 상품 피드가 동기화되지 않았어요", sub: "[다시 시도] 버튼을 눌러 다시 시도해 주세요. 반복해서 실패하면 잠시 후 다시 시도해 주세요.", btns: [["다시 시도", null]], alert: "상품 정보를 Google에 전송하지 못했습니다. 잠시 후 다시 시도해 주세요." }
  };

  // 근거: 02_상품피드_탭/02_상품피드_반영_정책.md 2장 — "자동 매칭하기"는 확인 절차 없이 즉시 최초 전송을 실행한다(모달 없음).
  function startFullSyncFromEmpty() {
    const sel = document.getElementById("dev-feed-state");
    if (sel) sel.value = "정상";
    window.GC_FEED.render(document.getElementById("panel-feed"), "정상");
    GC.toast("상품 피드 연동이 시작되었습니다.", "success");
  }

  function renderEmpty(container, kind) {
    const c = FEED_EMPTY_CFG[kind];
    container.innerHTML = `
      <div class="gc-box gc-mt-16" style="margin-bottom:28px;">
        <div class="gc-box-title" style="font-size:15px;">상품 피드</div>
        <div class="gc-box-desc" style="margin-bottom:0;">Google Merchant Center와 연동하고 관리하는 공간입니다. Google 쇼핑 및 광고 운영에 필요한 상품 데이터를 Google Merchant Center로 전달하며, 상품 연동 상태·동기화 현황·오류 여부 등을 확인할 수 있습니다.<br>상품 피드 생성 이후 상품의 등록·수정·삭제 등 변경 사항이 자동으로 업데이트되며, 최신 상품 정보가 Google Merchant Center와 Google 쇼핑에 지속적으로 반영됩니다.</div>
      </div>
      ${c.dashed ? "" : `<div class="gc-section-title">상품 피드</div>`}
      <div class="${c.dashed ? "gc-empty-wrap" : "gc-box"}">
        <div class="gc-empty">
          <div class="gc-empty-icon" style="${c.iconDanger ? "border:1px solid var(--gc-danger); color:var(--gc-danger); background:#fff;" : ""}">${c.icon}</div>
          <div class="gc-empty-title">${c.title}</div>
          ${c.sub ? `<div class="gc-empty-sub">${c.sub}</div>` : ""}
          <div class="gc-flex gc-gap-8" style="justify-content:center;">
            ${c.btns.map(([label], i) => `<button class="gc-btn gc-btn-primary" data-empty-btn="${i}">${label}</button>`).join("")}
          </div>
          ${c.hint ? `<div class="gc-empty-hint">${c.hint}</div>` : ""}
          ${c.alert ? `<div class="gc-small" style="margin-top:16px; padding:12px 16px; border:1px solid var(--gc-danger); background:var(--gc-danger-bg); color:var(--gc-danger); border-radius:var(--gc-radius-sm); display:inline-block;">${c.alert}</div>` : ""}
        </div>
      </div>
    `;
    container.querySelectorAll("[data-empty-btn]").forEach((btn, i) => btn.addEventListener("click", () => {
      if (kind === "동기화실패") {
        btn.disabled = true; btn.innerHTML = `<span class="gc-spinner"></span> 재시도 중...`;
        setTimeout(() => {
          const sel = document.getElementById("dev-feed-state");
          sel.value = "정상";
          window.GC_FEED.render(document.getElementById("panel-feed"), "정상");
          GC.toast("동기화가 완료되었습니다.", "success");
        }, 1500);
        return;
      }
      if (kind === "상품피드미연동" && i === 0) {
        startFullSyncFromEmpty();
        return;
      }
      const fn = c.btns[i][1];
      if (fn) fn();
    }));
  }

  window.GC_FEED = {
    mountId: "panel-feed",
    states: [
      { value: "계정미연동", label: "계정 미연동" },
      { value: "GMC미연동", label: "GMC 미연동" },
      { value: "상품피드미연동", label: "상품피드 미연동" },
      { value: "동기화실패", label: "동기화 실패" },
      { value: "정상", label: "정상(전체탭)" }
    ],
    render(container, state) {
      listState = { tab: "전체", search: "", page: 1, selected: new Set() };
      if (state === "정상") renderNormal(container);
      else renderEmpty(container, state);
    },
    openCategoryMatchingModal,
    openCategoryMatchingModalInitial
  };
})();
