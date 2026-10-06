/* ==========================================================================
   공통 UI 컴포넌트 — Toast / Dialog(브라우저 alert·confirm 재현) / Modal /
   Info Layer(툴팁) / Searchable Dropdown / Pagination / Drawer
   ========================================================================== */
const UI = (function () {
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => (n == null || isNaN(n) ? "-" : Math.round(n).toLocaleString("ko-KR"));

  /* ---------------- Toast ---------------- */
  function toast(msg, type) {
    let root = document.getElementById("toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "toast-root";
      document.body.appendChild(root);
    }
    const el = document.createElement("div");
    el.className = "toast toast--" + (type || "info");
    el.innerHTML = msg;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-show"));
    setTimeout(() => {
      el.classList.remove("is-show");
      setTimeout(() => el.remove(), 250);
    }, 3200);
  }

  /** 외부(Meta) 링크 — 프로토타입에서는 실제 이동 대신 바인딩된 URL을 토스트로 노출 */
  function openExternal(label, url) {
    toast(`<b>새 탭 이동 (시뮬레이션)</b> · ${esc(label)}<br><span class="toast__url">${esc(url)}</span>`, "link");
  }

  /* ---------------- Dialog: 브라우저 기본 alert / confirm 재현 ---------------- */
  function dialog(message, withCancel) {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "nd-overlay";
      wrap.innerHTML = `
        <div class="nd" role="alertdialog" aria-modal="true">
          <div class="nd__title">makeshop.co.kr 내용:</div>
          <div class="nd__msg">${esc(message).replace(/\n/g, "<br>")}</div>
          <div class="nd__btns">
            <button class="nd__btn nd__btn--ok" data-r="1">확인</button>
            ${withCancel ? '<button class="nd__btn" data-r="0">취소</button>' : ""}
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const okBtn = wrap.querySelector(".nd__btn--ok");
      okBtn.focus();
      const done = (r) => {
        wrap.remove();
        document.removeEventListener("keydown", onKey, true);
        resolve(r);
      };
      function onKey(e) {
        if (e.key === "Escape") { e.stopPropagation(); done(false); }
        if (e.key === "Enter") { e.stopPropagation(); e.preventDefault(); done(true); }
      }
      document.addEventListener("keydown", onKey, true);
      wrap.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => done(b.dataset.r === "1")));
    });
  }
  const alert = (m) => dialog(m, false);
  const confirm = (m) => dialog(m, true);

  /* ---------------- Modal (레이어 모달) ---------------- */
  /**
   * opts: { title, body(html), footer(html), size: 'sm'|'md'|'lg'|'xl', onClose(): boolean|Promise<boolean>, cls }
   * 반환: { el, close(force) }
   */
  function modal(opts) {
    const wrap = document.createElement("div");
    wrap.className = "modal-overlay";
    wrap.innerHTML = `
      <div class="modal modal--${opts.size || "md"} ${opts.cls || ""}" role="dialog" aria-modal="true" aria-label="${esc(opts.title || "")}">
        <button class="modal__close" aria-label="닫기">×</button>
        ${opts.title ? `<h2 class="modal__title">${esc(opts.title)}</h2>` : ""}
        <div class="modal__body">${opts.body || ""}</div>
        ${opts.footer ? `<div class="modal__foot">${opts.footer}</div>` : ""}
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add("is-modal-open");
    const api = {
      el: wrap.querySelector(".modal"),
      async close(force) {
        if (!force && opts.onClose) {
          const ok = await opts.onClose();
          if (ok === false) return;
        }
        wrap.remove();
        if (!document.querySelector(".modal-overlay")) document.body.classList.remove("is-modal-open");
      },
    };
    wrap.querySelector(".modal__close").addEventListener("click", () => api.close());
    return api;
  }

  /* ---------------- Info Layer (?) — 클릭형 툴팁 레이어 ---------------- */
  let openLayer = null;
  function closeInfo() {
    if (openLayer) { openLayer.remove(); openLayer = null; }
  }
  function infoLayer(anchor, title, html) {
    const same = openLayer && openLayer._anchor === anchor;
    closeInfo();
    if (same) return;
    const el = document.createElement("div");
    el.className = "infolayer";
    el.innerHTML = `<button class="infolayer__close" aria-label="닫기">×</button><div class="infolayer__title">${esc(title)}</div><div class="infolayer__body">${html}</div>`;
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect();
    const w = Math.min(460, window.innerWidth - 24);
    el.style.width = w + "px";
    let left = r.left + window.scrollX - 12;
    if (left + w > window.scrollX + window.innerWidth - 12) left = window.scrollX + window.innerWidth - w - 12;
    el.style.left = Math.max(12, left) + "px";
    el.style.top = r.bottom + window.scrollY + 8 + "px";
    el._anchor = anchor;
    el.querySelector(".infolayer__close").addEventListener("click", closeInfo);
    openLayer = el;
  }
  document.addEventListener("click", (e) => {
    if (!openLayer) return;
    if (openLayer.contains(e.target) || (openLayer._anchor && openLayer._anchor.contains(e.target))) return;
    closeInfo();
  });
  window.addEventListener("resize", closeInfo);

  /* ---------------- Searchable Dropdown (GPC 선택 등) ---------------- */
  /**
   * container 에 드롭다운을 그린다.
   * opts: { items:[{value,label}], value, placeholder, disabled, onChange(value), searchable }
   */
  function dropdown(container, opts) {
    const state = { value: opts.value || "", disabled: !!opts.disabled };
    container.classList.add("dd");
    function label() {
      const it = opts.items.find((i) => i.value === state.value);
      return it ? it.label : opts.placeholder || "선택해주세요";
    }
    function paint() {
      container.innerHTML = `<button type="button" class="dd__btn ${state.value ? "" : "is-placeholder"}" ${state.disabled ? "disabled" : ""} title="${esc(label())}"><span>${esc(label())}</span><i class="dd__chev"></i></button>`;
      container.querySelector(".dd__btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openList();
      });
    }
    function openList() {
      closeAllDropdowns();
      const r = container.getBoundingClientRect();
      const list = document.createElement("div");
      list.className = "dd__list";
      list.innerHTML = `${opts.searchable === false ? "" : '<div class="dd__search"><input type="text" placeholder="카테고리명 검색" /></div>'}<ul></ul>`;
      document.body.appendChild(list);
      const width = Math.max(r.width, opts.minListWidth || 0);
      list.style.width = width + "px";
      list.style.left = Math.min(r.left + window.scrollX, window.scrollX + window.innerWidth - width - 8) + "px";
      const spaceBelow = window.innerHeight - r.bottom;
      if (spaceBelow < 280 && r.top > 300) list.style.top = r.top + window.scrollY - Math.min(300, 40 + opts.items.length * 34) - 4 + "px";
      else list.style.top = r.bottom + window.scrollY + 4 + "px";
      const ul = list.querySelector("ul");
      const input = list.querySelector("input");
      function renderItems(q) {
        const items = opts.items.filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase()));
        ul.innerHTML = items.length
          ? items.map((i) => `<li data-v="${esc(i.value)}" class="${i.value === state.value ? "is-selected" : ""}">${esc(i.label)}</li>`).join("")
          : '<li class="dd__empty">검색 결과가 없습니다.</li>';
        ul.querySelectorAll("li[data-v]").forEach((li) =>
          li.addEventListener("click", () => {
            state.value = li.dataset.v;
            closeAllDropdowns();
            paint();
            opts.onChange && opts.onChange(state.value);
          })
        );
      }
      renderItems("");
      if (input) {
        input.addEventListener("input", () => renderItems(input.value.trim()));
        input.addEventListener("click", (e) => e.stopPropagation());
        setTimeout(() => input.focus(), 0);
      }
      list.addEventListener("click", (e) => e.stopPropagation());
    }
    paint();
    return {
      get value() { return state.value; },
      set(v) { state.value = v || ""; paint(); },
      setDisabled(d) { state.disabled = d; paint(); },
    };
  }
  function closeAllDropdowns() {
    document.querySelectorAll(".dd__list").forEach((l) => l.remove());
  }
  document.addEventListener("click", closeAllDropdowns);
  window.addEventListener("resize", closeAllDropdowns);
  document.addEventListener("scroll", (e) => { if (!(e.target.closest && e.target.closest(".dd__list"))) closeAllDropdowns(); }, true);

  /* ---------------- Pagination ---------------- */
  function pagination(total, page, size, onGo) {
    const pages = Math.max(1, Math.ceil(total / size));
    const block = 10;
    const start = Math.floor((page - 1) / block) * block + 1;
    const end = Math.min(pages, start + block - 1);
    const el = document.createElement("div");
    el.className = "pager";
    let h = `<button data-p="1" ${page === 1 ? "disabled" : ""} aria-label="처음">«</button><button data-p="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="이전">‹</button>`;
    for (let p = start; p <= end; p++) h += `<button data-p="${p}" class="${p === page ? "is-active" : ""}">${p}</button>`;
    h += `<button data-p="${page + 1}" ${page === pages ? "disabled" : ""} aria-label="다음">›</button><button data-p="${pages}" ${page === pages ? "disabled" : ""} aria-label="마지막">»</button>`;
    el.innerHTML = h;
    el.querySelectorAll("button[data-p]").forEach((b) => b.addEventListener("click", () => onGo(+b.dataset.p)));
    return el;
  }

  /* ---------------- Drawer ---------------- */
  function drawer(el, open) {
    el.classList.toggle("is-open", open);
    document.getElementById("drawer-dim").classList.toggle("is-show", open);
  }

  /* ---------------- 공통 마크업 헬퍼 ---------------- */
  const icon = {
    gear: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    ext: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    chevUp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 15 6-6 6 6"/></svg>',
    meta: '<svg viewBox="0 0 64 40" width="56" height="35"><defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0064e0"/><stop offset="1" stop-color="#0099ff"/></linearGradient></defs><path d="M12 20C12 6 25 6 32 20S52 34 52 20 39 6 32 20 12 34 12 20Z" fill="none" stroke="url(#mg)" stroke-width="6.5" stroke-linejoin="round"/></svg>',
    fb: '<svg width="20" height="20" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="#1877F2"/><path d="M25 18.06C25 13.6 21.42 10 17 10s-8 3.6-8 8.06c0 4.02 2.93 7.35 6.75 7.94v-5.61h-2.03v-2.33h2.03v-1.78c0-2.01 1.2-3.13 3.02-3.13.87 0 1.79.16 1.79.16v1.97h-1.01c-.99 0-1.3.62-1.3 1.25v1.5h2.22l-.36 2.33h-1.86v5.61C22.07 25.4 25 22.08 25 18.06Z" fill="#fff"/></svg>',
    ig: '<svg width="22" height="22" viewBox="0 0 24 24"><defs><radialGradient id="igg" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285AEB"/></radialGradient></defs><rect x="1" y="1" width="22" height="22" rx="6" fill="url(#igg)"/><rect x="5.5" y="5.5" width="13" height="13" rx="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.4" cy="7.6" r="1" fill="#fff"/></svg>',
  };
  const qmark = (key) => `<button type="button" class="qmark" data-info="${key}" aria-label="도움말">?</button>`;

  return { esc, fmt, toast, openExternal, alert, confirm, modal, infoLayer, closeInfo, dropdown, closeAllDropdowns, pagination, drawer, icon, qmark };
})();
