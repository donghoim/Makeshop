import { html } from '../js/lib.js';
import { useStore } from '../js/store.js';

var MAKESHOP_HOME_URL = 'https://www.makeshop.co.kr/';

export function TopBar(props) {
  var store = useStore();
  var state = store.state;
  var activePath = state.activeTabPath;

  function onSearch() {
    store.dispatch({ type: 'TOGGLE_QUICK_OPEN' });
  }
  function onPageLinks() {
    store.dispatch({ type: 'TOGGLE_PAGE_LINKS' });
  }
  function onVirtualTags() {
    if (!activePath) return;
    store.dispatch({ type: 'TOGGLE_VIRTUAL_TAGS' });
  }

  return html`
    <header class="topbar">
      <div class="topbar__left">
        <button class="topbar__menu-btn" onClick=${props.onMenuClick} aria-label="탐색기 열기">☰</button>
        <span class="topbar__logo">MAKESHOP</span>
        <span class="topbar__divider"></span>
        <span class="topbar__title">개별디자인</span>
      </div>
      <div class="topbar__center">
        <button class="topbar__search" onClick=${onSearch}>
          <span class="topbar__search-icon">⌕</span>
          <span>페이지 / 파일 검색</span>
          <span class="topbar__kbd">Ctrl+P</span>
        </button>
      </div>
      <div class="topbar__right">
        <button class="btn btn--ghost" onClick=${onPageLinks}>페이지주소</button>
        <button
          class="btn btn--ghost"
          onClick=${onVirtualTags}
          disabled=${!activePath}
          title=${!activePath ? '파일을 먼저 열어주세요' : '현재 페이지에 적용 가능한 가상태그'}
        >가상태그</button>
        <a class="btn btn--ghost btn--link" href=${MAKESHOP_HOME_URL} target="_blank" rel="noopener noreferrer">디자인 매뉴얼</a>
      </div>
    </header>
  `;
}
