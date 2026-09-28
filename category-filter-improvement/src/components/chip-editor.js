// CMP-FILTER-VALUE-CHIP 인라인 편집 공통 컴포넌트
// 05_Policy/Inline-Edit-Policy.md 규칙(진입/저장/취소/검증/드래그충돌) 구현
// mode: "edit-only" (SCR-FILTER-001, 명칭수정만) | "create" (SCR-FILTER-002, 등록전 추가/수정/삭제)
//       | "manage" (SCR-FILTER-003, 기존값 수정 + 신규추가 + 삭제예정 토글)

const MAX_FILTER_VALUE_LENGTH = 30;

function normalizeForDuplicateCheck(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

let activeChipEdit = null; // { cancel: fn } — 문서 전체에서 동시에 1개만 편집 가능

function createChipEditor(container, options) {
  const state = {
    mode: options.mode,
    immediateSave: !!options.immediateSave,
    values: options.values, // [{id,name,colorCode,isNew,pendingDelete}]
    onChange: options.onChange || function () {},
    simulateSave: options.simulateSave, // async (item, newName) => {ok, message, affectedCount}
    findDuplicate: options.findDuplicate, // (name, excludeId) => boolean
    draggable: !!options.draggable,
    container,
  };

  function render() {
    container.innerHTML = "";
    const list = document.createElement("div");
    list.className = "chip-list";
    state.values.forEach((item) => list.appendChild(renderChip(item)));
    container.appendChild(list);
  }

  function renderChip(item) {
    const chip = document.createElement("span");
    chip.className = "chip" + (item.isNew ? " chip-new" : "") + (item.pendingDelete ? " chip-pending-delete" : "");
    chip.dataset.id = item.id;
    if (state.draggable && !item.pendingDelete) {
      const dragHandle = document.createElement("span");
      dragHandle.className = "chip-drag-handle";
      dragHandle.setAttribute("aria-hidden", "true");
      dragHandle.title = "드래그하여 순서 이동";
      dragHandle.innerHTML = "<span></span><span></span><span></span><span></span><span></span><span></span>";
      chip.appendChild(dragHandle);

      chip.draggable = true;
      chip.addEventListener("dragstart", (e) => {
        if (chip.classList.contains("editing")) { e.preventDefault(); return; }
        e.stopPropagation(); // 상위 필터 행(tr)의 드래그 정렬과 text/plain 데이터가 충돌하지 않도록 분리
        e.dataTransfer.setData("text/plain", item.id);
        chip.classList.add("dragging");
      });
      chip.addEventListener("dragend", (e) => {
        e.stopPropagation();
        chip.classList.remove("dragging");
      });
      chip.addEventListener("dragover", (e) => { e.preventDefault(); e.stopPropagation(); });
      chip.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData("text/plain");
        reorder(draggedId, item.id);
      });
    }

    if (item.colorCode) {
      const swatch = document.createElement("span");
      swatch.className = "color-swatch";
      swatch.style.background = item.colorCode;
      chip.appendChild(swatch);
    }

    const label = document.createElement("span");
    label.className = "chip-label";
    label.textContent = item.name;
    label.tabIndex = 0;
    label.setAttribute("role", "button");
    label.setAttribute("aria-label", `${item.name} 필터값 수정`);
    label.addEventListener("dblclick", () => enterEdit(chip, item));
    label.addEventListener("keydown", (e) => {
      if (e.key === "Enter") enterEdit(chip, item);
    });
    chip.appendChild(label);

    if (!item.pendingDelete) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "chip-edit-btn";
      editBtn.innerHTML = "&#9998;"; // 연필 아이콘 대체 문자
      editBtn.setAttribute("aria-label", `${item.name} 필터값 수정`);
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        enterEdit(chip, item);
      });
      chip.appendChild(editBtn);
    }

    if (state.mode !== "edit-only") {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "chip-remove-btn";
      removeBtn.innerHTML = item.pendingDelete ? "&#8635;" : "&#10005;";
      removeBtn.title = item.pendingDelete ? "삭제 취소" : "삭제";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleRemoveClick(item);
      });
      chip.appendChild(removeBtn);
    }

    return chip;
  }

  function handleRemoveClick(item) {
    if (state.mode === "create") {
      // 등록 전 상태 — 확인 없이 즉시 삭제
      state.values = state.values.filter((v) => v.id !== item.id);
      state.onChange(state.values);
      render();
    } else if (state.mode === "manage") {
      item.pendingDelete = !item.pendingDelete;
      state.onChange(state.values);
      render();
    }
  }

  function reorder(draggedId, targetId) {
    if (draggedId === targetId) return;
    const fromIdx = state.values.findIndex((v) => String(v.id) === String(draggedId));
    const toIdx = state.values.findIndex((v) => String(v.id) === String(targetId));
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = state.values.splice(fromIdx, 1);
    state.values.splice(toIdx, 0, moved);
    state.onChange(state.values);
    render();
  }

  function enterEdit(chipEl, item) {
    if (activeChipEdit) activeChipEdit.cancel();
    chipEl.classList.add("editing");
    chipEl.innerHTML = "";

    const wrap = document.createElement("span");
    wrap.className = "chip-input-wrap";

    const input = document.createElement("input");
    input.type = "text";
    input.value = item.name;
    input.maxLength = MAX_FILTER_VALUE_LENGTH; // 입력 단계에서부터 최대 30자로 제한
    wrap.appendChild(input);
    chipEl.appendChild(wrap);

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "chip-confirm-btn";
    confirmBtn.innerHTML = "&#10003;";
    chipEl.appendChild(confirmBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "chip-cancel-btn";
    cancelBtn.innerHTML = "&#10005;";
    chipEl.appendChild(cancelBtn);

    input.focus();
    input.select();

    let errorEl = null;
    function showError(msg) {
      clearError();
      errorEl = document.createElement("div");
      errorEl.className = "chip-error-msg";
      errorEl.textContent = msg;
      wrap.appendChild(errorEl);
      chipEl.classList.add("chip-error");
    }
    function clearError() {
      if (errorEl) { errorEl.remove(); errorEl = null; }
      chipEl.classList.remove("chip-error");
    }

    function cancel() {
      document.removeEventListener("mousedown", onOutsideClick, true);
      activeChipEdit = null;
      render();
    }

    function onOutsideClick(e) {
      // 컨펌창(모달) 내부 클릭은 편집 취소로 간주하지 않는다 (즉시저장 전 확인 컨펌창 대응).
      if (chipEl.contains(e.target) || e.target.closest(".modal-overlay")) return;
      cancel();
    }
    document.addEventListener("mousedown", onOutsideClick, true);

    async function trySave() {
      const raw = input.value;
      const trimmed = raw.trim().replace(/\s+/g, " ");
      if (!trimmed) {
        showError("필터값을 입력해 주세요.");
        return;
      }
      if (trimmed.length > MAX_FILTER_VALUE_LENGTH) {
        showError(`필터값은 최대 ${MAX_FILTER_VALUE_LENGTH}자까지 입력할 수 있습니다.`);
        return;
      }
      if (normalizeForDuplicateCheck(trimmed) === normalizeForDuplicateCheck(item.name)) {
        // 기존값과 동일 -> 서버 요청 없이 편집 종료
        cancel();
        return;
      }
      if (state.findDuplicate && state.findDuplicate(trimmed, item.id)) {
        showError("이미 등록된 필터값입니다.");
        return;
      }

      if (state.immediateSave && state.simulateSave) {
        // 검증 통과 후 실제 저장 전 컨펌창으로 영향 범위(사용 중인 모든 상품)를 안내한다.
        ConfirmModal.show({
          title: "필터 상세값을 수정하시겠습니까?",
          desc: "필터 상세값을 수정하면 해당 필터를 사용하는 모든 상품에 변경 내용이 반영됩니다. 계속 진행하시겠습니까?",
          confirmText: "수정",
          cancelText: "취소",
          onConfirm: () => commitImmediateSave(trimmed),
        });
      } else {
        item.name = trimmed; // textContent로만 렌더링하므로 저장 단계의 별도 이스케이프는 불필요
        document.removeEventListener("mousedown", onOutsideClick, true);
        activeChipEdit = null;
        state.onChange(state.values);
        render();
      }
    }

    async function commitImmediateSave(trimmed) {
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      input.disabled = true;
      const result = await state.simulateSave(item, trimmed);
      if (result.ok) {
        item.name = trimmed;
        document.removeEventListener("mousedown", onOutsideClick, true);
        activeChipEdit = null;
        state.onChange(state.values);
        render();
        // 저장 성공 시에도 별도 토스트는 노출하지 않는다 (Filter-Management-Screen-Policy).
      } else {
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        input.disabled = false;
        Toast.error("필터값을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); trySave(); }
      if (e.key === "Escape") { e.preventDefault(); cancel(); }
    });
    input.addEventListener("input", clearError);
    confirmBtn.addEventListener("click", (e) => { e.stopPropagation(); trySave(); });
    cancelBtn.addEventListener("click", (e) => { e.stopPropagation(); cancel(); });

    activeChipEdit = { cancel };
  }

  function addNewValue(name) {
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) return { ok: false, message: "필터값을 입력해 주세요." };
    if (trimmed.length > MAX_FILTER_VALUE_LENGTH) {
      return { ok: false, message: `필터값은 최대 ${MAX_FILTER_VALUE_LENGTH}자까지 입력할 수 있습니다.` };
    }
    if (state.findDuplicate && state.findDuplicate(trimmed, null)) {
      return { ok: false, message: "이미 등록된 필터값입니다." };
    }
    state.values.push({ id: "new-" + Date.now() + Math.random().toString(16).slice(2), name: trimmed, colorCode: null, isNew: true });
    state.onChange(state.values);
    render();
    return { ok: true };
  }

  render();
  return {
    getValues: () => state.values,
    addNewValue,
    render,
  };
}
