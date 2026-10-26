/* ==========================================================================
   SCR-MKT-003 · TikTok 준비 중 (POL-031) — 안내만 표시, 버튼·일정 안내 없음
   ========================================================================== */
const MktTiktok = (function () {
  function render(root) {
    const el = document.createElement("section");
    el.className = "card ready";
    el.innerHTML = `<div class="ready__ic">${UI.icon.tiktok.replace('width="44" height="44"', 'width="72" height="72"')}</div><h2>TikTok 연동 기능을 준비하고 있습니다.</h2><p>연동 기능이 제공되면 이 화면에서 연결하고 관리할 수 있습니다.</p>`;
    root.appendChild(el);
  }
  return { render };
})();
