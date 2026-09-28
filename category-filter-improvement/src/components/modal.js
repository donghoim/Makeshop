// 공통 Modal 컨트롤러 — 생성/수정/일괄변경 팝업, 확인 팝업 전반에서 재사용
const ModalController = {
  open(overlayEl) {
    overlayEl.classList.add("open");
    document.body.style.overflow = "hidden";
  },
  close(overlayEl) {
    overlayEl.classList.remove("open");
    document.body.style.overflow = "";
  },
  // 이탈확인 팝업이 필요한 모달: closeWithGuard(overlay, isDirtyFn, confirmOverlay)
  closeWithGuard(overlayEl, isDirtyFn, confirmOverlayEl) {
    if (isDirtyFn()) {
      this.open(confirmOverlayEl);
    } else {
      this.close(overlayEl);
    }
  },
};

function bindOverlayDismiss(overlayEl, onRequestClose) {
  overlayEl.addEventListener("mousedown", (e) => {
    if (e.target === overlayEl) onRequestClose();
  });
}

// 얼럿창(Alert Box) — 이탈확인/필터삭제확인/필터값명수정확인 등 버튼 클릭 시 노출되는
// 확인성 메시지를 네이티브 OS 알림창 스타일(작은 타이틀바 + 아이콘 + 우측 정렬 버튼)로 표시
const ConfirmModal = (() => {
  let overlay, iconEl, titleEl, descEl, confirmBtn, cancelBtn, closeBtn;

  const ICONS = { warning: "⚠", info: "ℹ", question: "❓" };

  function ensureDom() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay alert-overlay";
    overlay.innerHTML = `
      <div class="alert-box">
        <div class="alert-titlebar">
          <span class="alert-titlebar-text">알림</span>
          <button type="button" class="alert-titlebar-close">&times;</button>
        </div>
        <div class="alert-body">
          <span class="alert-icon"></span>
          <div class="alert-text">
            <div class="alert-title"></div>
            <div class="alert-desc"></div>
          </div>
        </div>
        <div class="alert-footer">
          <button type="button" class="btn btn-primary alert-ok-btn"></button>
          <button type="button" class="btn alert-cancel-btn"></button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    iconEl = overlay.querySelector(".alert-icon");
    titleEl = overlay.querySelector(".alert-title");
    descEl = overlay.querySelector(".alert-desc");
    confirmBtn = overlay.querySelector(".alert-ok-btn");
    cancelBtn = overlay.querySelector(".alert-cancel-btn");
    closeBtn = overlay.querySelector(".alert-titlebar-close");
    bindOverlayDismiss(overlay, () => ModalController.close(overlay));
  }

  function show({ title, desc, confirmText = "확인", cancelText = "취소", onConfirm, hideCancel = false, icon = "warning" }) {
    ensureDom();
    iconEl.textContent = ICONS[icon] || ICONS.warning;
    titleEl.textContent = title;
    descEl.innerHTML = desc;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    cancelBtn.style.display = hideCancel ? "none" : "";

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.replaceWith(newConfirmBtn);
    confirmBtn = newConfirmBtn;
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.replaceWith(newCancelBtn);
    cancelBtn = newCancelBtn;
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.replaceWith(newCloseBtn);
    closeBtn = newCloseBtn;

    confirmBtn.addEventListener("click", () => {
      ModalController.close(overlay);
      if (onConfirm) onConfirm();
    });
    cancelBtn.addEventListener("click", () => ModalController.close(overlay));
    closeBtn.addEventListener("click", () => ModalController.close(overlay));

    ModalController.open(overlay);
  }

  return { show };
})();
