/* ==========================================================================
   공통 UI 유틸 — 모달 / 토스트 / 커스텀 검색 드롭다운 / 포맷터
   ========================================================================== */

const UI = (function () {

  /* ---------------- formatters ---------------- */
  function won(n) {
    return (n || 0).toLocaleString("ko-KR") + "원";
  }
  function num(n) {
    return (n || 0).toLocaleString("ko-KR");
  }

  /* ---------------- toast ---------------- */
  function toast(message, type) {
    const root = document.getElementById("toast-root");
    const el = document.createElement("div");
    el.className = "toast toast--" + (type || "success");
    el.textContent = message;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-show"));
    setTimeout(() => {
      el.classList.remove("is-show");
      setTimeout(() => el.remove(), 250);
    }, 2800);
  }

  /* ---------------- modal ---------------- */
  const modalRoot = () => document.getElementById("modal-root");

  function openModal({ title, bodyHTML, footHTML, size, onMount, descHTML, onCloseAttempt, sideDesc }) {
    const root = modalRoot();
    root.innerHTML = `
      <div class="modal-backdrop" data-close="1"></div>
      <div class="modal ${size ? "modal--" + size : ""}" role="dialog" aria-modal="true">
        <div class="modal__head">
          <div>
            <div class="modal__title">${title}</div>
            ${descHTML ? `<div class="modal__desc">${descHTML}</div>` : ""}
          </div>
          <button class="modal__close" data-close="1" aria-label="닫기">×</button>
        </div>
        <div class="modal__body">${bodyHTML}</div>
        ${footHTML ? `<div class="modal__foot">${footHTML}</div>` : ""}
      </div>
    `;
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");

    // onCloseAttempt: 닫기 시도(X 버튼/배경 클릭)를 가로채 확인 절차를 넣고 싶을 때 사용.
    // 반환값이 없으면(콜백 미지정) 즉시 닫힘, 지정 시 콜백이 직접 닫을지 결정한다.
    root.querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", (e) => {
        if (e.target !== el) return;
        if (onCloseAttempt) onCloseAttempt();
        else closeModal();
      })
    );

    if (typeof SidePanel !== "undefined") {
      const desc = sideDesc || descHTML;
      if (desc) SidePanel.setOverride(title, desc);
    }

    if (onMount) onMount(root);
    return root;
  }

  function closeModal() {
    const root = modalRoot();
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = "";
    if (typeof SidePanel !== "undefined") SidePanel.clearOverride();
  }

  function confirm({ title, bodyHTML, confirmText, cancelText, onConfirm, danger, sideDesc }) {
    openModal({
      title,
      size: "sm",
      bodyHTML: `<div class="confirm-body">${bodyHTML}</div>`,
      footHTML: `
        <button class="btn" data-close="1">${cancelText || "취소"}</button>
        <button class="btn ${danger ? "btn--danger-outline" : "btn--primary"}" id="confirm-ok-btn">${confirmText || "확인"}</button>
      `,
      sideDesc: sideDesc || bodyHTML,
      onMount: (root) => {
        root.querySelector("#confirm-ok-btn").addEventListener("click", () => {
          closeModal();
          if (onConfirm) onConfirm();
        });
      },
    });
  }

  /* ---------------- custom searchable dropdown ----------------
     mount(container, { options: string[], value: string|null, placeholder, disabled, onChange })
     returns { setValue(v), setDisabled(bool), getValue() }
  ------------------------------------------------------------------ */
  function mountDropdown(container, opts) {
    const state = { value: opts.value || null, disabled: !!opts.disabled, open: false };
    container.classList.add("dd");
    container.innerHTML = `
      <div class="dd__control ${state.value ? "" : "is-placeholder"}" tabindex="0">
        <span class="dd__label">${state.value || opts.placeholder || "선택해주세요"}</span>
        <span>▾</span>
      </div>
      <div class="dd__panel">
        <div class="dd__search"><input type="text" placeholder="카테고리명을 입력해 주세요" /></div>
        <div class="dd__options"></div>
      </div>
    `;
    const control = container.querySelector(".dd__control");
    const panel = container.querySelector(".dd__panel");
    const searchInput = container.querySelector(".dd__search input");
    const optionsBox = container.querySelector(".dd__options");

    function renderOptions(filter) {
      const f = (filter || "").trim().toLowerCase();
      const filtered = opts.options.filter((o) => o.toLowerCase().includes(f));
      optionsBox.innerHTML = filtered.length
        ? filtered
            .map(
              (o) =>
                `<div class="dd__option ${o === state.value ? "is-highlighted" : ""}" data-val="${encodeURIComponent(o)}">${o}</div>`
            )
            .join("")
        : `<div class="dd__empty">일치하는 카테고리가 없습니다.</div>`;

      optionsBox.querySelectorAll(".dd__option").forEach((el) => {
        el.addEventListener("click", () => {
          const val = decodeURIComponent(el.getAttribute("data-val"));
          setValue(val);
          close();
          if (opts.onChange) opts.onChange(val);
        });
      });
    }

    function open() {
      if (state.disabled) return;
      container.classList.add("is-open");
      state.open = true;
      searchInput.value = "";
      renderOptions("");
      searchInput.focus();
    }
    function close() {
      container.classList.remove("is-open");
      state.open = false;
    }
    function setValue(v) {
      state.value = v;
      control.querySelector(".dd__label").textContent = v || opts.placeholder || "선택해주세요";
      control.classList.toggle("is-placeholder", !v);
    }
    function setDisabled(disabled) {
      state.disabled = disabled;
      if (disabled) close();
      container.classList.toggle("is-disabled", disabled);
      control.style.opacity = disabled ? 0.5 : 1;
      control.style.pointerEvents = disabled ? "none" : "auto";
    }

    control.addEventListener("click", () => (state.open ? close() : open()));
    searchInput.addEventListener("input", (e) => renderOptions(e.target.value));
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) close();
    });

    if (state.disabled) setDisabled(true);

    return {
      setValue,
      setDisabled,
      getValue: () => state.value,
    };
  }

  return { won, num, toast, openModal, closeModal, confirm, mountDropdown };
})();
