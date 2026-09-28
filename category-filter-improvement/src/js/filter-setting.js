// SCR-FILTER-001 (분류 검색 필터 설정) + SCR-FILTER-002/003 (생성·수정 팝업) 동작 구현
// 정책 참조: 05_Policy/Filter-Management-Screen-Policy.md, Inline-Edit-Policy.md, Filter-Value-Delete-Policy.md

const EXPOSE_CATEGORIES = [
  { id: 1, name: "아우터", count: 4 },
  { id: 2, name: "상의", count: 4 },
  { id: 3, name: "하의", count: 5 },
  { id: 4, name: "신발", count: 4 },
  { id: 5, name: "악세서리", count: 5 },
  { id: 6, name: "기타", count: 4 },
  { id: 7, name: "메이크샵", count: 4 },
];

let filtersState = JSON.parse(JSON.stringify(window.MOCK_FILTERS));
let nextFilterId = Math.max(...filtersState.map((f) => f.filterId)) + 1;

function delay(ms) { return new Promise((res) => setTimeout(res, ms)); }

function findFilterValueDuplicate(filterId, tempValues) {
  return (name, excludeId) => {
    const norm = normalizeForDuplicateCheck(name);
    return tempValues.some((v) => String(v.id) !== String(excludeId) && !v.pendingDelete && normalizeForDuplicateCheck(v.name) === norm);
  };
}

// ---------- 테이블 렌더 ----------
function renderFilterTable() {
  const tbody = document.getElementById("filter-table-body");
  tbody.innerHTML = "";
  document.getElementById("filter-count").textContent =
    `전체개수 : ${filtersState.length}개  노출개수 : ${filtersState.filter((f) => f.exposed).length}개`;

  filtersState.forEach((filter) => {
    const tr = document.createElement("tr");
    tr.draggable = true;
    tr.dataset.filterId = filter.filterId;

    tr.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", filter.filterId);
      tr.classList.add("dragging");
    });
    tr.addEventListener("dragend", () => tr.classList.remove("dragging"));
    tr.addEventListener("dragover", (e) => e.preventDefault());
    tr.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedId = Number(e.dataTransfer.getData("text/plain"));
      reorderFilters(draggedId, filter.filterId);
    });

    const tdMove = document.createElement("td");
    tdMove.innerHTML = `<span class="drag-handle" title="드래그하여 순서 이동">&#9776;</span>`;
    tdMove.style.textAlign = "center";
    tr.appendChild(tdMove);

    const tdName = document.createElement("td");
    tdName.textContent = filter.name;
    tr.appendChild(tdName);

    const tdValues = document.createElement("td");
    const chipHost = document.createElement("div");
    tdValues.appendChild(chipHost);
    tr.appendChild(tdValues);

    const tdManage = document.createElement("td");
    tdManage.style.textAlign = "center";
    const manageBtn = document.createElement("button");
    manageBtn.className = "btn btn-sm";
    manageBtn.textContent = "관리";
    manageBtn.addEventListener("click", () => openEditModal(filter.filterId));
    tdManage.appendChild(manageBtn);
    tr.appendChild(tdManage);

    const tdExpose = document.createElement("td");
    tdExpose.style.textAlign = "center";
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn btn-sm" + (filter.exposed ? " btn-primary" : "");
    toggleBtn.textContent = filter.exposed ? "노출" : "미노출";
    toggleBtn.addEventListener("click", () => {
      filter.exposed = !filter.exposed;
      renderFilterTable();
    });
    tdExpose.appendChild(toggleBtn);
    tr.appendChild(tdExpose);

    tbody.appendChild(tr);

    // 칩 드래그 정렬(reorder)과 dataset.id 매칭을 위해 filterValueId를 id로 백필한다.
    // 배열/객체 참조는 그대로 유지해야 즉시저장 시 item.name 변경이 filter.values에 반영된다.
    filter.values.forEach((v) => { if (v.id === undefined) v.id = v.filterValueId; });

    // CMP-FILTER-VALUE-CHIP (edit-only, 즉시저장)
    createChipEditor(chipHost, {
      mode: "edit-only",
      immediateSave: true,
      draggable: true,
      values: filter.values,
      findDuplicate: findFilterValueDuplicate(filter.filterId, filter.values),
      onChange: () => {},
      simulateSave: async (item, newName) => {
        await delay(450);
        if (newName === "오류유발") {
          return { ok: false };
        }
        return { ok: true };
      },
    });
  });
}

function reorderFilters(draggedId, targetId) {
  if (draggedId === targetId) return;
  const fromIdx = filtersState.findIndex((f) => f.filterId === draggedId);
  const toIdx = filtersState.findIndex((f) => f.filterId === targetId);
  if (fromIdx === -1 || toIdx === -1) return;
  const [moved] = filtersState.splice(fromIdx, 1);
  filtersState.splice(toIdx, 0, moved);
  renderFilterTable();
}

document.getElementById("btn-save-settings").addEventListener("click", () => {
  Toast.success("필터 노출 설정 및 순서가 저장되었습니다.");
});

// ---------- 생성/수정 공용 팝업 ----------
const filterFormModal = document.getElementById("filter-form-modal");
const filterNameInput = document.getElementById("filter-name-input");
const filterNameCount = document.getElementById("filter-name-count");
const valueAddInput = document.getElementById("value-add-input");
const chipContainer = document.getElementById("filter-value-chip-container");
const exposeTreeEl = document.getElementById("expose-tree");
const submitBtn = document.getElementById("btn-submit-filter-form");
const deleteBtn = document.getElementById("btn-delete-filter");
const formTitle = document.getElementById("filter-form-title");

let formMode = "create"; // "create" | "manage"
let editingFilterId = null;
let chipEditorInstance = null;
let exposeMap = {};

function renderExposeTree() {
  exposeTreeEl.innerHTML = "";
  EXPOSE_CATEGORIES.forEach((cat) => {
    const row = document.createElement("div");
    row.className = "tree-row";
    const exposed = !!exposeMap[cat.id];
    row.innerHTML = `
      <span>${cat.name} [${cat.count}]</span>
      <span>
        <label class="radio-inline"><input type="radio" name="expose-${cat.id}" ${!exposed ? "checked" : ""}> 노출안함</label>
        <label class="radio-inline"><input type="radio" name="expose-${cat.id}" ${exposed ? "checked" : ""}> 노출함</label>
      </span>`;
    const radios = row.querySelectorAll(`input[name="expose-${cat.id}"]`);
    radios[0].addEventListener("change", () => { exposeMap[cat.id] = false; updateSubmitState(); });
    radios[1].addEventListener("change", () => { exposeMap[cat.id] = true; updateSubmitState(); });
    exposeTreeEl.appendChild(row);
  });
}

function updateSubmitState() {
  // 노출여부/분류별 노출여부는 라디오 기본값이 이미 선택되어 있으므로 활성화 조건에 포함하지 않는다.
  // 수정 팝업은 변경 사항 여부와 무관하게 항상 활성화한다.
  const name = filterNameInput.value.trim();
  const values = chipEditorInstance ? chipEditorInstance.getValues().filter((v) => !v.pendingDelete) : [];
  const valid = name.length > 0 && name.length <= 25 && values.length > 0;
  submitBtn.disabled = !valid;
}

filterNameInput.addEventListener("input", () => {
  filterNameCount.textContent = `${filterNameInput.value.length}/25`;
  updateSubmitState();
});
document.querySelectorAll('input[name="filter-expose"]').forEach((r) => r.addEventListener("change", updateSubmitState));

valueAddInput.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const result = chipEditorInstance.addNewValue(valueAddInput.value);
  if (result.ok) {
    valueAddInput.value = "";
  } else {
    Toast.error(result.message);
  }
  updateSubmitState();
});

function openCreateModal() {
  formMode = "create";
  editingFilterId = null;
  formTitle.textContent = "분류 검색 필터 생성";
  submitBtn.textContent = "등록";
  deleteBtn.style.display = "none";
  filterNameInput.value = "";
  filterNameCount.textContent = "0/25";
  valueAddInput.value = "";
  document.querySelector('input[name="filter-expose"][value="Y"]').checked = true;
  exposeMap = {};
  renderExposeTree();
  chipContainer.innerHTML = "";
  chipEditorInstance = createChipEditor(chipContainer, {
    mode: "create",
    immediateSave: false,
    values: [],
    findDuplicate: (name, excludeId) => findFilterValueDuplicate(null, chipEditorInstance.getValues())(name, excludeId),
    onChange: updateSubmitState,
  });
  updateSubmitState();
  ModalController.open(filterFormModal);
}

function openEditModal(filterId) {
  const filter = filtersState.find((f) => f.filterId === filterId);
  if (!filter) return;
  formMode = "manage";
  editingFilterId = filterId;
  formTitle.textContent = `분류 검색 필터 수정 (${filter.name})`;
  submitBtn.textContent = "수정";
  deleteBtn.style.display = "";
  filterNameInput.value = filter.name;
  filterNameCount.textContent = `${filter.name.length}/25`;
  valueAddInput.value = "";
  document.querySelector(`input[name="filter-expose"][value="${filter.exposed ? "Y" : "N"}"]`).checked = true;
  exposeMap = {};
  (filter.exposedCategoryIds || []).forEach((id) => (exposeMap[id] = true));
  renderExposeTree();
  chipContainer.innerHTML = "";
  const tempValues = filter.values.map((v) => ({ ...v, id: v.filterValueId, isNew: false, pendingDelete: false }));
  chipEditorInstance = createChipEditor(chipContainer, {
    mode: "manage",
    immediateSave: false,
    values: tempValues,
    findDuplicate: findFilterValueDuplicate(filterId, tempValues),
    onChange: updateSubmitState,
  });
  updateSubmitState();
  ModalController.open(filterFormModal);
}

function requestCloseFilterForm() {
  // 입력/변경 내용이 있어도 별도 확인 팝업 없이 즉시 닫힌다.
  ModalController.close(filterFormModal);
}

document.getElementById("filter-form-close").addEventListener("click", requestCloseFilterForm);
document.getElementById("btn-cancel-filter-form").addEventListener("click", requestCloseFilterForm);
bindOverlayDismiss(filterFormModal, requestCloseFilterForm);

document.getElementById("btn-add-filter").addEventListener("click", openCreateModal);

submitBtn.addEventListener("click", async () => {
  const name = filterNameInput.value.trim();
  const exposedCategoryIds = Object.keys(exposeMap).filter((k) => exposeMap[k]).map(Number);
  const values = chipEditorInstance.getValues();

  if (formMode === "create") {
    const newFilter = {
      filterId: nextFilterId++,
      name,
      exposed: document.querySelector('input[name="filter-expose"]:checked').value === "Y",
      sortOrder: filtersState.length + 1,
      colorLinked: false,
      exposedCategoryIds,
      values: values.map((v) => ({ filterValueId: typeof v.id === "number" ? v.id : Math.floor(Math.random() * 100000) + 900000, name: v.name, colorCode: v.colorCode || null })),
    };
    filtersState.push(newFilter);
    ModalController.close(filterFormModal);
    renderFilterTable();
    Toast.success("필터가 등록되었습니다.");
  } else {
    const filter = filtersState.find((f) => f.filterId === editingFilterId);
    filter.name = name;
    filter.exposed = document.querySelector('input[name="filter-expose"]:checked').value === "Y";
    filter.exposedCategoryIds = exposedCategoryIds;
    filter.values = values
      .filter((v) => !v.pendingDelete)
      .map((v) => ({
        filterValueId: v.isNew ? Math.floor(Math.random() * 100000) + 900000 : v.filterValueId,
        name: v.name,
        colorCode: v.colorCode || null,
      }));
    ModalController.close(filterFormModal);
    renderFilterTable();
    Toast.success("필터가 수정되었습니다.");
  }
});

deleteBtn.addEventListener("click", () => {
  const filter = filtersState.find((f) => f.filterId === editingFilterId);
  ConfirmModal.show({
    title: "분류 검색 필터를 삭제하시겠습니까?",
    desc: `'${filter.name}' 필터와 소속된 모든 필터 상세값이 삭제됩니다. 해당 필터를 사용 중인 상품의 필터 연결도 함께 해제될 수 있습니다.`,
    confirmText: "삭제",
    cancelText: "취소",
    onConfirm: () => {
      filtersState = filtersState.filter((f) => f.filterId !== editingFilterId);
      ModalController.close(filterFormModal);
      renderFilterTable();
      Toast.success("필터가 삭제되었습니다.");
    },
  });
});

renderFilterTable();
