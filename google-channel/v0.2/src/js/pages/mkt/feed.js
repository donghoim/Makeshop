/* ==========================================================================
   SCR-MKT-002 · 통합 상품 피드 (조회 전용, POL-027)
   - 채널 상태는 각 채널 상품피드에서 판정해 저장한 값을 표시한다(외부 API 호출 없음, POL-021)
   - 메이크샵 등록 상품 전체를 상품 1개 1행으로, 채널별 상태 라벨을 그대로 표시 (POL-023, POL-024)
   - 상품 피드가 연동되지 않은 채널(Google은 Merchant Center 미연결)은 '-' (POL-025)
   ========================================================================== */
const MktFeed = (function () {
  const SIZES = [20, 50, 100];
  const STATES = ["활동중", "검토중", "미승인", "노출제한", "사용안함", "반영대기"];
  const view = { name: "", no: "", ch: "", st: "", page: 1, size: 20 };

  const metaOn = () => Store.s.connected;
  const googleOn = () => GStore.feedConnected();
  const chOn = (k) => (k === "meta" ? metaOn() : googleOn());
  function chStatus(k, p) {
    if (!chOn(k)) return null;
    return k === "meta" ? Store.status(p) : GStore.status(p);
  }

  function render(root) {
    if (view.ch && !chOn(view.ch)) { view.ch = ""; view.st = ""; }
    const sec = document.createElement("section");
    sec.className = "card sec";
    sec.innerHTML = `<div class="sec__body">
      <form class="sform" id="mf-form">
        <div class="sform__row"><label class="sform__label" for="mf-name">상품명</label><input class="input" id="mf-name" placeholder="상품명을 입력하세요" value="${UI.esc(view.name)}"/></div>
        <div class="sform__row"><label class="sform__label" for="mf-no">상품번호</label><input class="input" id="mf-no" placeholder="상품번호를 입력하세요" value="${UI.esc(view.no)}"/></div>
        <div class="sform__row"><span class="sform__label">연동 상태</span>
          <select class="select" id="mf-ch" aria-label="채널 선택"><option value="">채널 선택</option>${[["meta", "Meta"], ["google", "Google"]].map((c) => `<option value="${c[0]}" ${chOn(c[0]) ? "" : "disabled"} ${view.ch === c[0] ? "selected" : ""}>${c[1]}${chOn(c[0]) ? "" : " (미연동)"}</option>`).join("")}</select>
          <select class="select" id="mf-st" aria-label="상태 선택" ${view.ch ? "" : "disabled"}><option value="">상태 선택</option>${STATES.map((s) => `<option ${view.st === s ? "selected" : ""}>${s}</option>`).join("")}</select>
          <span class="muted small">예: Google + 미승인 / 상품 피드가 연동되지 않은 채널은 선택할 수 없습니다.</span></div>
        <div class="sform__btns"><button type="submit" class="btn btn--dark">검색</button><button type="button" class="btn btn--line" data-act="reset">초기화</button></div>
      </form></div>`;
    root.appendChild(sec);
    const list = document.createElement("section");
    list.className = "card sec sec--list";
    list.innerHTML = '<div class="sec__body"><div id="mf-list"></div></div>';
    root.appendChild(list);

    const f = sec.querySelector("#mf-form");
    f.querySelector("#mf-ch").addEventListener("change", (e) => { view.ch = e.target.value; f.querySelector("#mf-st").disabled = !view.ch; if (!view.ch) f.querySelector("#mf-st").value = ""; });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      view.name = f.querySelector("#mf-name").value.trim();
      view.no = f.querySelector("#mf-no").value.trim();
      view.ch = f.querySelector("#mf-ch").value;
      view.st = f.querySelector("#mf-st").value;
      view.page = 1;
      load(list.querySelector("#mf-list"));
    });
    f.querySelector('[data-act="reset"]').addEventListener("click", () => {
      Object.assign(view, { name: "", no: "", ch: "", st: "", page: 1 });
      App.render();
    });
    load(list.querySelector("#mf-list"));
  }
  function load(box) {
    box.innerHTML = '<div class="loading"><span class="spin"></span> 조회 중입니다.</div>';
    setTimeout(() => paint(box), 300);
  }
  function rows() {
    return Store.s.products
      .filter((p) => !view.name || p.name.includes(view.name))
      .filter((p) => !view.no || p.no === view.no)
      // 채널만 고르고 상태를 고르지 않으면 채널 조건을 적용하지 않음 (POL-028)
      .filter((p) => !(view.ch && view.st) || chStatus(view.ch, p) === view.st)
      .sort((a, b) => b.id - a.id); // 상품 등록일 최신순 (POL-029)
  }
  function stCell(k, p) {
    const st = chStatus(k, p);
    return st ? `<span class="st st--${st}">${st}</span>` : "-";
  }
  function paint(box) {
    if (!box.isConnected) return;
    const all = rows();
    const pages = Math.max(1, Math.ceil(all.length / view.size));
    if (view.page > pages) view.page = pages;
    const pr = all.slice((view.page - 1) * view.size, view.page * view.size);
    box.innerHTML = `
      <div class="list-tools"><b>총 ${UI.fmt(all.length)}개</b><select class="select select--sm" id="mf-size" aria-label="페이지당 개수">${SIZES.map((n) => `<option value="${n}" ${n === view.size ? "selected" : ""}>${n}개씩</option>`).join("")}</select></div>
      <div class="table-wrap table-wrap--sticky"><table class="table">
        <thead><tr><th class="col-info sticky-col">상품정보</th><th>Meta 상태</th><th>Google 상태</th><th class="col-manage2">관리</th></tr></thead>
        <tbody>${pr.length ? pr.map((p) => `<tr><td class="col-info sticky-col"><div class="pinfo">${GCommon.thumb(p)}<div><div class="pinfo__name">${UI.esc(p.name)}</div><div class="pinfo__cat">${p.no}</div></div></div></td><td>${stCell("meta", p)}</td><td>${stCell("google", p)}</td>
          <td class="col-manage2">${metaOn() ? '<button type="button" class="btn btn--line btn--sm" data-go="#/meta/feed">Meta 관리 ' + UI.icon.ext + "</button>" : ""}${googleOn() ? '<button type="button" class="btn btn--line btn--sm" data-go="#/google/feed">Google 관리 ' + UI.icon.ext + "</button>" : ""}</td></tr>`).join("") : '<tr><td colspan="4" class="table__empty">조회된 상품이 없습니다.</td></tr>'}</tbody></table></div>
      <div class="list-foot"><div></div><div id="mf-pager"></div><div class="list-foot__right muted small">조회 전용 화면입니다. 전송·수정은 각 채널 상품피드에서 진행합니다.</div></div>`;
    box.querySelector("#mf-pager").appendChild(UI.pagination(all.length, view.page, view.size, (p) => { view.page = p; paint(box); }));
    box.querySelector("#mf-size").addEventListener("change", (e) => { view.size = +e.target.value; view.page = 1; paint(box); });
    box.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => App.nav(b.dataset.go)));
  }
  return { render };
})();
