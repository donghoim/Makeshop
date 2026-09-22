/* Google Channel Integration — Prototype 공통 컴포넌트 헬퍼
   Modal / Drawer / Toast / Tabs / Pagination / Dropdown / Validation */

const GC = (() => {
  let modalStack = [];

  function openModal(html, opts = {}) {
    const backdrop = document.createElement("div");
    backdrop.className = "gc-modal-backdrop";
    const cls = ["gc-modal"];
    if (opts.size === "wide") cls.push("wide");
    if (opts.size === "xwide") cls.push("xwide");
    backdrop.innerHTML = `<div class="${cls.join(" ")}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("show"));
    if (!opts.persistent) {
      backdrop.addEventListener("mousedown", (e) => {
        if (e.target === backdrop) closeModal(backdrop);
      });
    }
    backdrop.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(backdrop, btn.dataset.closeModal || null));
    });
    modalStack.push(backdrop);
    document.body.style.overflow = "hidden";
    if (opts.onOpen) opts.onOpen(backdrop);
    return backdrop;
  }

  function closeModal(backdrop, reason) {
    if (!backdrop) backdrop = modalStack[modalStack.length - 1];
    if (!backdrop) return;
    backdrop.classList.remove("show");
    setTimeout(() => {
      backdrop.remove();
      modalStack = modalStack.filter((m) => m !== backdrop);
      if (modalStack.length === 0) document.body.style.overflow = "";
    }, 150);
  }

  function openDrawer(html) {
    const backdrop = document.createElement("div");
    backdrop.className = "gc-drawer-backdrop";
    backdrop.innerHTML = `<div class="gc-drawer">${html}</div>`;
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("show"));
    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop) closeDrawer(backdrop);
    });
    backdrop.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeDrawer(backdrop));
    });
    document.body.style.overflow = "hidden";
    return backdrop;
  }
  function closeDrawer(backdrop) {
    backdrop.classList.remove("show");
    setTimeout(() => { backdrop.remove(); document.body.style.overflow = ""; }, 180);
  }

  let toastRegion = null;
  function toast(message, type = "info", duration = 2600) {
    if (!toastRegion) {
      toastRegion = document.createElement("div");
      toastRegion.id = "gc-toast-region";
      document.body.appendChild(toastRegion);
    }
    const el = document.createElement("div");
    el.className = `gc-toast ${type}`;
    el.textContent = message;
    toastRegion.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 200);
    }, duration);
  }

  function initTabs(root, { onChange } = {}) {
    // 주의: 패널(data-tab-panel)은 버튼과 같은 data-tab-group 컨테이너 밖(형제 컨테이너)에
    // 위치하는 구조를 쓰므로, 패널 검색은 group이 아니라 root 전체 범위로 수행한다.
    root.querySelectorAll("[data-tab-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.closest("[data-tab-group]");
        group.querySelectorAll("[data-tab-target]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.dataset.tabTarget;
        root.querySelectorAll("[data-tab-panel]").forEach((p) => {
          p.classList.toggle("gc-hidden", p.dataset.tabPanel !== target);
        });
        if (onChange) onChange(target);
      });
    });
  }

  function initDropdowns(root) {
    root.querySelectorAll("[data-dropdown-toggle]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const menu = btn.nextElementSibling;
        document.querySelectorAll(".gc-dropdown-menu.open").forEach((m) => { if (m !== menu) m.classList.remove("open"); });
        menu.classList.toggle("open");
      });
    });
    document.addEventListener("click", () => {
      document.querySelectorAll(".gc-dropdown-menu.open").forEach((m) => m.classList.remove("open"));
    });
  }

  function renderPagination(container, { total, pageSize = 10, current = 1, onChange }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    let html = `<button ${current === 1 ? "disabled" : ""} data-p="${current - 1}">‹</button>`;
    for (let i = 1; i <= pages; i++) {
      html += `<button class="${i === current ? "active" : ""}" data-p="${i}">${i}</button>`;
    }
    html += `<button ${current === pages ? "disabled" : ""} data-p="${current + 1}">›</button>`;
    container.innerHTML = html;
    container.querySelectorAll("button[data-p]").forEach((b) => {
      b.addEventListener("click", () => onChange(Number(b.dataset.p)));
    });
  }

  function toggle(el) {
    el.classList.toggle("on");
    return el.classList.contains("on");
  }

  function validateRequired(input, message = "필수 입력 항목입니다.") {
    const wrap = input.closest(".gc-field") || input.parentElement;
    let err = wrap.querySelector(".gc-field-error");
    if (!input.value || !input.value.trim()) {
      input.classList.add("error");
      if (!err) {
        err = document.createElement("div");
        err.className = "gc-field-error";
        wrap.appendChild(err);
      }
      err.textContent = message;
      return false;
    }
    input.classList.remove("error");
    if (err) err.remove();
    return true;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function fmtNumber(n) { return Number(n).toLocaleString("ko-KR"); }
  function fmtWon(n) { return "₩" + Number(n).toLocaleString("ko-KR"); }

  return { openModal, closeModal, openDrawer, closeDrawer, toast, initTabs, initDropdowns, renderPagination, toggle, validateRequired, esc, fmtNumber, fmtWon };
})();
