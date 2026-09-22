import { html, useMemo } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { flattenTree } from '../js/pathUtils.js';
import { FileIcon } from './Icon.js';

var SHOP_DOMAIN = 'https://myshop.makeshop.co.kr';

export function PageAddressModal() {
  var store = useStore();
  var visible = store.state.pageLinksVisible;

  var pages = useMemo(function () {
    if (!visible) return [];
    return flattenTree('system', store.state.tree.system).filter(function (n) {
      return n.type === 'file' && n.ext === 'html';
    });
  }, [visible, store.state.tree]);

  if (!visible) return null;

  function close() {
    store.dispatch({ type: 'TOGGLE_PAGE_LINKS' });
  }

  function copyUrl(url, e) {
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(function () {});
    }
    store.dispatch({ type: 'SHOW_TOAST', message: '페이지 주소가 복사되었습니다: ' + url });
  }

  function openPage(path) {
    store.dispatch({ type: 'OPEN_FILE', path: path });
    close();
  }

  return html`
    <div class="modal-overlay modal-overlay--top" onClick=${close}>
      <div class="quick-open page-address" onClick=${function (e) { e.stopPropagation(); }}>
        <div class="quick-open__input-row">
          <span class="page-address__title">페이지 주소</span>
          <span class="page-address__subtitle">SYSTEM 운영 페이지 전체 목록 (Mock URL)</span>
          <button class="modal-close" onClick=${close}>×</button>
        </div>
        <div class="quick-open__list">
          ${pages.map(function (page) {
            var category = page.segments.slice(0, -1).join(' / ') || '최상위';
            var url = SHOP_DOMAIN + '/' + page.name;
            return html`
              <div key=${page.path} class="quick-open__item page-address__item" onClick=${function () { openPage(page.path); }}>
                <${FileIcon} ext=${page.ext} />
                <div class="page-address__info">
                  <div class="page-address__row1">
                    <span class="quick-open__name">${page.name}</span>
                    <span class="page-address__category">${category}</span>
                  </div>
                  <span class="page-address__url">${url}</span>
                </div>
                <button class="btn btn--ghost btn--sm" onClick=${function (e) { copyUrl(url, e); }}>복사</button>
              </div>
            `;
          })}
        </div>
      </div>
    </div>
  `;
}
