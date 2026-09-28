// SCR-FILTER-004 (검색 필터 일괄 관리) + SCR-FILTER-005 (일괄 변경 팝업) 동작 구현
// 정책 참조: 05_Policy/Bulk-Filter-Value-Policy.md, Message-Policy.md, Concurrent-Edit-Policy.md

function delay(ms) { return new Promise((res) => setTimeout(res, ms)); }

let filtersState = JSON.parse(JSON.stringify(window.MOCK_FILTERS));
let productsState = JSON.parse(JSON.stringify(window.MOCK_PRODUCTS));
let searchResults = productsState.slice();
let selectedIds = new Set();
let focusedProductId = null;
const PAGE_SIZE = 8;
let currentPage = 1;

function findFilter(id) { return filtersState.find((f) => f.filterId === Number(id)); }
function findValue(filter, valueId) { return filter.values.find((v) => v.filterValueId === Number(valueId)); }

// ---------- 검색 조건 ----------
const searchFilterSelect = document.getElementById("search-filter-select");
const searchFilterValueSelect = document.getElementById("search-filter-value-select");

filtersState.forEach((f) => {
  const opt = document.createElement("option");
  opt.value = f.filterId; opt.textContent = f.name;
  searchFilterSelect.appendChild(opt);
});
searchFilterSelect.addEventListener("change", () => {
  searchFilterValueSelect.innerHTML = '<option value="">필터값을 선택해 주세요.</option>';
  const filter = findFilter(searchFilterSelect.value);
  if (filter) {
    searchFilterValueSelect.disabled = false;
    filter.values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.filterValueId; opt.textContent = v.name;
      searchFilterValueSelect.appendChild(opt);
    });
  } else {
    searchFilterValueSelect.disabled = true;
  }
});

document.getElementById("btn-search").addEventListener("click", () => {
  const display = document.querySelector('input[name="display"]:checked').value;
  const searchType = document.getElementById("search-type").value;
  const keyword = document.getElementById("search-keyword").value.trim();
  const filterId = searchFilterSelect.value;
  const valueId = searchFilterValueSelect.value;

  searchResults = productsState.filter((p) => {
    if (display !== "전체" && p.displayStatus !== display) return false;
    if (keyword) {
      if (searchType === "상품명" && !p.name.includes(keyword)) return false;
      if (searchType === "상품번호" && !String(p.productId).includes(keyword)) return false;
      if ((searchType === "상품코드" || searchType === "키워드") && !p.name.includes(keyword)) return false;
    }
    if (filterId) {
      const applied = (p.appliedValues[filterId] || []);
      if (valueId) { if (!applied.includes(Number(valueId))) return false; }
      else if (applied.length === 0) return false;
    }
    return true;
  });
  currentPage = 1;
  selectedIds.clear();
  focusedProductId = null;
  renderAll();
});

document.getElementById("btn-reset-search").addEventListener("click", () => {
  document.querySelector('input[name="display"][value="전체"]').checked = true;
  document.getElementById("search-type").value = "상품명";
  document.getElementById("search-keyword").value = "";
  searchFilterSelect.value = "";
  searchFilterValueSelect.innerHTML = '<option value="">필터값을 선택해 주세요.</option>';
  searchFilterValueSelect.disabled = true;
  searchResults = productsState.slice();
  currentPage = 1;
  selectedIds.clear();
  focusedProductId = null;
  renderAll();
});

// ---------- 상품 리스트 / 선택 ----------
function renderAll() {
  renderResultCount();
  renderProductTable();
  renderPagination();
  renderSelectedCount();
  renderFilterStatusPanel();
}

function renderResultCount() {
  document.getElementById("result-count").textContent = `검색 결과: ${searchResults.length}건`;
}

function currentPageItems() {
  const start = (currentPage - 1) * PAGE_SIZE;
  return searchResults.slice(start, start + PAGE_SIZE);
}

function renderProductTable() {
  const tbody = document.getElementById("product-table-body");
  tbody.innerHTML = "";
  const items = currentPageItems();
  items.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="text-align:center;"><input type="checkbox" class="row-check" ${selectedIds.has(p.productId) ? "checked" : ""}></td>
      <td style="text-align:center;">${p.productId}</td>
      <td style="text-align:center;"><span class="thumb-box">IMG</span></td>
      <td>${p.name}</td>`;
    const checkbox = tr.querySelector(".row-check");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedIds.add(p.productId); else selectedIds.delete(p.productId);
      renderSelectedCount();
      updateSelectAllState();
    });
    tr.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT") return;
      focusedProductId = p.productId;
      renderFilterStatusPanel();
    });
    tbody.appendChild(tr);
  });
  updateSelectAllState();
}

function updateSelectAllState() {
  const items = currentPageItems();
  const allChecked = items.length > 0 && items.every((p) => selectedIds.has(p.productId));
  document.getElementById("select-all-checkbox").checked = allChecked;
}

document.getElementById("select-all-checkbox").addEventListener("change", (e) => {
  currentPageItems().forEach((p) => {
    if (e.target.checked) selectedIds.add(p.productId); else selectedIds.delete(p.productId);
  });
  renderProductTable();
  renderSelectedCount();
});

function renderPagination() {
  const el = document.getElementById("pagination");
  el.innerHTML = "";
  const totalPages = Math.max(1, Math.ceil(searchResults.length / PAGE_SIZE));
  const prev = document.createElement("button");
  prev.textContent = "이전"; prev.disabled = currentPage === 1;
  prev.addEventListener("click", () => { currentPage--; renderProductTable(); renderPagination(); });
  el.appendChild(prev);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => { currentPage = i; renderProductTable(); renderPagination(); });
    el.appendChild(btn);
  }
  const next = document.createElement("button");
  next.textContent = "다음"; next.disabled = currentPage === totalPages;
  next.addEventListener("click", () => { currentPage++; renderProductTable(); renderPagination(); });
  el.appendChild(next);
}

function renderSelectedCount() {
  const label = document.getElementById("selected-count-label");
  const btn = document.getElementById("btn-bulk-change");
  if (selectedIds.size > 0) {
    label.textContent = `${selectedIds.size}개 상품 선택`;
    btn.disabled = false;
  } else {
    label.textContent = "";
    btn.disabled = true;
  }
}

function renderFilterStatusPanel() {
  const panel = document.getElementById("filter-status-panel");
  if (!focusedProductId) {
    panel.textContent = "상품을 선택하면 필터 적용 현황이 표시됩니다.";
    return;
  }
  const product = productsState.find((p) => p.productId === focusedProductId);
  let html = `<div style="font-weight:700;margin-bottom:8px;">${product.name} (${product.productId})</div>`;
  html += `<table class="data-table"><thead><tr><th>필터명</th><th>노출</th><th>적용</th><th>필터 상세값</th></tr></thead><tbody>`;
  filtersState.forEach((f) => {
    const applied = (product.appliedValues[f.filterId] || []);
    const names = applied.map((vid) => { const v = findValue(f, vid); return v ? v.name : ""; }).filter(Boolean);
    html += `<tr>
      <td>${f.name}</td>
      <td style="text-align:center;">${f.exposed ? "노출" : "미노출"}</td>
      <td style="text-align:center;"><span class="status-badge ${names.length ? "applied" : "unapplied"}">${names.length ? "적용" : "미적용"}</span></td>
      <td>${names.length ? names.join(", ") : "적용 중인 필터 값이 없습니다."}</td>
    </tr>`;
  });
  html += "</tbody></table>";
  panel.innerHTML = html;
}

// ---------- SCR-FILTER-005 일괄 변경 팝업 ----------
const bulkModal = document.getElementById("bulk-modal");
const bulkFilterSelect = document.getElementById("bulk-filter-select");
const bulkTopInfo = document.getElementById("bulk-top-info");
const bulkSaveBtn = document.getElementById("btn-bulk-save");
const modifiedDateCheckbox = document.getElementById("modified-date-checkbox");

const opFieldEls = {
  REPLACE: document.getElementById("fields-REPLACE"),
  RENAME: document.getElementById("fields-RENAME"),
  ADD: document.getElementById("fields-ADD"),
  REMOVE: document.getElementById("fields-REMOVE"),
};
const fromValueSelect = document.getElementById("from-value-select");
const toValueSelect = document.getElementById("to-value-select");
const renameTargetSelect = document.getElementById("rename-target-select");
const renameInput = document.getElementById("rename-input");
const addValueSelect = document.getElementById("add-value-select");
const removeValueSelect = document.getElementById("remove-value-select");

function currentOpType() {
  return document.querySelector('input[name="op-type"]:checked').value;
}

document.getElementById("btn-bulk-change").addEventListener("click", openBulkModal);

function openBulkModal() {
  bulkFilterSelect.innerHTML = '<option value="">필터를 선택해 주세요.</option>';
  filtersState.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.filterId; opt.textContent = f.name;
    bulkFilterSelect.appendChild(opt);
  });
  document.querySelector('input[name="op-type"][value="REPLACE"]').checked = true;
  [fromValueSelect, toValueSelect, renameTargetSelect, addValueSelect, removeValueSelect].forEach((s) => {
    s.innerHTML = '<option value="">필터값을 선택해 주세요.</option>';
    s.disabled = true;
  });
  renameInput.value = "";
  renameInput.disabled = true;
  modifiedDateCheckbox.checked = false;
  document.getElementById("rename-error").textContent = "";
  document.getElementById("replace-error").textContent = "";
  document.getElementById("replace-preview").textContent = "";
  document.getElementById("add-preview").textContent = "";
  document.getElementById("remove-preview").textContent = "";
  updateOpFieldsVisibility();
  updateTopInfo();
  updateSaveState();
  ModalController.open(bulkModal);
}

document.querySelectorAll('input[name="op-type"]').forEach((r) => r.addEventListener("change", () => {
  updateOpFieldsVisibility();
  updateTopInfo();
  updateSaveState();
}));

function updateOpFieldsVisibility() {
  const type = currentOpType();
  Object.keys(opFieldEls).forEach((key) => { opFieldEls[key].hidden = key !== type; });
  document.getElementById("modified-date-block").style.display = type === "RENAME" ? "none" : "";
}

function updateTopInfo() {
  const type = currentOpType();
  if (type === "RENAME") {
    bulkTopInfo.innerHTML = "선택한 상품과 관계없이 해당 필터값을 사용하는 <b>전체 상품</b>에 반영됩니다.";
  } else {
    bulkTopInfo.textContent = `선택한 상품 ${selectedIds.size}개의 분류 검색 필터를 변경합니다.`;
  }
}

bulkFilterSelect.addEventListener("change", () => {
  const filter = findFilter(bulkFilterSelect.value);
  [fromValueSelect, toValueSelect, renameTargetSelect, addValueSelect, removeValueSelect].forEach((s) => {
    s.innerHTML = '<option value="">필터값을 선택해 주세요.</option>';
    s.disabled = !filter;
  });
  renameInput.disabled = !filter;
  if (filter) {
    filter.values.forEach((v) => {
      [fromValueSelect, toValueSelect, renameTargetSelect, addValueSelect, removeValueSelect].forEach((s) => {
        const opt = document.createElement("option");
        opt.value = v.filterValueId; opt.textContent = v.name;
        s.appendChild(opt);
      });
    });
  }
  refreshPreview();
  updateSaveState();
});

[fromValueSelect, toValueSelect].forEach((s) => s.addEventListener("change", () => { refreshPreview(); updateSaveState(); }));
[addValueSelect, removeValueSelect].forEach((s) => s.addEventListener("change", () => { refreshPreview(); updateSaveState(); }));
renameTargetSelect.addEventListener("change", () => {
  const filter = findFilter(bulkFilterSelect.value);
  const val = findValue(filter, renameTargetSelect.value);
  renameInput.value = val ? val.name : "";
  validateRename();
  updateSaveState();
});
renameInput.addEventListener("input", () => { validateRename(); updateSaveState(); });

function selectedProducts() {
  return productsState.filter((p) => selectedIds.has(p.productId));
}

function refreshPreview() {
  const type = currentOpType();
  const filter = findFilter(bulkFilterSelect.value);
  if (!filter) return;

  if (type === "REPLACE") {
    const errorEl = document.getElementById("replace-error");
    const previewEl = document.getElementById("replace-preview");
    errorEl.textContent = ""; previewEl.textContent = "";
    if (fromValueSelect.value && toValueSelect.value) {
      if (fromValueSelect.value === toValueSelect.value) {
        errorEl.textContent = "기존 필터값과 변경할 필터값이 동일합니다.";
        return;
      }
      const fromName = findValue(filter, fromValueSelect.value).name;
      const toName = findValue(filter, toValueSelect.value).name;
      const matched = selectedProducts().filter((p) => (p.appliedValues[filter.filterId] || []).includes(Number(fromValueSelect.value)));
      previewEl.textContent = `선택한 상품 ${selectedIds.size}개 중 '${fromName}'가 적용된 ${matched.length}개 상품의 필터값을 '${toName}'로 변경합니다.`;
    }
  } else if (type === "ADD") {
    if (addValueSelect.value) {
      const name = findValue(filter, addValueSelect.value).name;
      const already = selectedProducts().filter((p) => (p.appliedValues[filter.filterId] || []).includes(Number(addValueSelect.value)));
      const target = selectedIds.size - already.length;
      document.getElementById("add-preview").textContent =
        `선택한 상품 ${selectedIds.size}개 중 ${target}개 상품에 '${name}'를 추가합니다. 이미 적용된 ${already.length}개 상품은 제외됩니다.`;
    } else {
      document.getElementById("add-preview").textContent = "";
    }
  } else if (type === "REMOVE") {
    if (removeValueSelect.value) {
      const name = findValue(filter, removeValueSelect.value).name;
      const matched = selectedProducts().filter((p) => (p.appliedValues[filter.filterId] || []).includes(Number(removeValueSelect.value)));
      document.getElementById("remove-preview").textContent =
        `선택한 상품 ${selectedIds.size}개 중 '${name}'가 적용된 ${matched.length}개 상품에서 필터값 적용을 해제합니다.`;
    } else {
      document.getElementById("remove-preview").textContent = "";
    }
  }
}

function validateRename() {
  const filter = findFilter(bulkFilterSelect.value);
  const errorEl = document.getElementById("rename-error");
  errorEl.textContent = "";
  if (!filter || !renameTargetSelect.value) return false;
  const target = findValue(filter, renameTargetSelect.value);
  const trimmed = renameInput.value.trim().replace(/\s+/g, " ");
  if (!trimmed) { errorEl.textContent = "변경할 명칭을 입력해 주세요."; return false; }
  if (trimmed.length > 30) { errorEl.textContent = "필터값은 최대 30자까지 입력할 수 있습니다."; return false; }
  if (normalizeForDuplicateCheck(trimmed) === normalizeForDuplicateCheck(target.name)) {
    errorEl.textContent = "변경할 명칭을 입력해 주세요.";
    return false;
  }
  const dup = filter.values.some((v) => v.filterValueId !== target.filterValueId && normalizeForDuplicateCheck(v.name) === normalizeForDuplicateCheck(trimmed));
  if (dup) { errorEl.textContent = "이미 등록된 필터값입니다."; return false; }
  return true;
}

function updateSaveState() {
  const type = currentOpType();
  const filter = findFilter(bulkFilterSelect.value);
  let valid = false;
  if (!filter) { bulkSaveBtn.disabled = true; return; }

  if (type === "REPLACE") {
    valid = !!fromValueSelect.value && !!toValueSelect.value && fromValueSelect.value !== toValueSelect.value;
  } else if (type === "RENAME") {
    valid = !!renameTargetSelect.value && validateRename();
  } else if (type === "ADD") {
    valid = !!addValueSelect.value;
  } else if (type === "REMOVE") {
    valid = !!removeValueSelect.value;
  }
  bulkSaveBtn.disabled = !valid;
}

function setSaving(saving) {
  bulkSaveBtn.disabled = saving;
  bulkSaveBtn.innerHTML = saving ? '<span class="spinner"></span>처리 중' : "저장";
}

bulkSaveBtn.addEventListener("click", async () => {
  const type = currentOpType();
  if (type === "RENAME") {
    const filter = findFilter(bulkFilterSelect.value);
    const target = findValue(filter, renameTargetSelect.value);
    const newName = renameInput.value.trim().replace(/\s+/g, " ");
    ConfirmModal.show({
      title: "필터값명을 수정하시겠습니까?",
      desc: `'${target.name}'를 '${newName}'로 수정합니다.<br><br>해당 필터값을 사용 중인 모든 상품과 쇼핑몰 검색 필터에 동일하게 반영됩니다.`,
      confirmText: "수정",
      cancelText: "취소",
      onConfirm: () => doSave(type),
    });
  } else {
    await doSave(type);
  }
});

async function doSave(type) {
  setSaving(true);
  await delay(700);
  const filter = findFilter(bulkFilterSelect.value);

  if (type === "RENAME") {
    const target = findValue(filter, renameTargetSelect.value);
    const newName = renameInput.value.trim().replace(/\s+/g, " ");
    if (newName === "충돌테스트") {
      setSaving(false);
      Toast.error("다른 관리자에 의해 필터값이 변경되었습니다. 최신 정보를 확인한 후 다시 시도해 주세요.");
      return;
    }
    const affected = productsState.filter((p) => (p.appliedValues[filter.filterId] || []).includes(target.filterValueId)).length;
    target.name = newName;
    setSaving(false);
    ModalController.close(bulkModal);
    Toast.success(affected > 0 ? `필터값명이 수정되었습니다. 해당 값을 사용 중인 ${affected}개 상품에 반영됩니다.` : "필터값명이 수정되었습니다.");
    renderAll();
    return;
  }

  const targets = selectedProducts();
  const useModifiedDate = modifiedDateCheckbox.checked;

  if (type === "REPLACE") {
    const fromId = Number(fromValueSelect.value);
    const toId = Number(toValueSelect.value);
    let processed = 0;
    targets.forEach((p) => {
      const arr = p.appliedValues[filter.filterId] || [];
      if (arr.includes(fromId)) {
        p.appliedValues[filter.filterId] = arr.map((v) => (v === fromId ? toId : v));
        processed++;
        if (useModifiedDate) p.regDate = new Date().toISOString().slice(0, 10);
      }
    });
    setSaving(false);
    ModalController.close(bulkModal);
    if (processed === 0) Toast.error("선택한 상품 중 변경 대상이 없습니다.");
    else Toast.success(`${processed}개 상품의 필터값을 변경했습니다. 변경 대상이 아닌 ${targets.length - processed}개 상품은 제외되었습니다.`);
  } else if (type === "ADD") {
    const valId = Number(addValueSelect.value);
    let processed = 0, skipped = 0;
    targets.forEach((p) => {
      const arr = p.appliedValues[filter.filterId] || [];
      if (arr.includes(valId)) { skipped++; }
      else { p.appliedValues[filter.filterId] = [...arr, valId]; processed++; if (useModifiedDate) p.regDate = new Date().toISOString().slice(0, 10); }
    });
    setSaving(false);
    ModalController.close(bulkModal);
    if (processed === 0) Toast.error("선택한 모든 상품에 이미 해당 필터값이 적용되어 있습니다.");
    else Toast.success(`${processed}개 상품에 필터값을 추가했습니다. 이미 적용된 ${skipped}개 상품은 제외되었습니다.`);
  } else if (type === "REMOVE") {
    const valId = Number(removeValueSelect.value);
    let processed = 0, skipped = 0;
    targets.forEach((p) => {
      const arr = p.appliedValues[filter.filterId] || [];
      if (arr.includes(valId)) { p.appliedValues[filter.filterId] = arr.filter((v) => v !== valId); processed++; if (useModifiedDate) p.regDate = new Date().toISOString().slice(0, 10); }
      else { skipped++; }
    });
    setSaving(false);
    ModalController.close(bulkModal);
    if (processed === 0) Toast.error("선택한 상품에 해당 필터값이 적용되어 있지 않습니다.");
    else Toast.success(`${processed}개 상품에서 필터값 적용을 해제했습니다. 적용되지 않은 ${skipped}개 상품은 제외되었습니다.`);
  }
  renderAll();
}

document.getElementById("bulk-modal-close").addEventListener("click", () => ModalController.close(bulkModal));
document.getElementById("btn-bulk-cancel").addEventListener("click", () => ModalController.close(bulkModal));
bindOverlayDismiss(bulkModal, () => ModalController.close(bulkModal));

renderAll();
