import { html, useMemo } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { getApplicableTags } from '../data/mockFileSystem.js';
import { fileNameOf } from '../js/pathUtils.js';

export function VirtualTagModal() {
  var store = useStore();
  var visible = store.state.virtualTagsVisible;
  var activePath = store.state.activeTabPath;

  var tags = useMemo(function () {
    if (!visible || !activePath) return [];
    return getApplicableTags(activePath);
  }, [visible, activePath]);

  if (!visible) return null;

  function close() {
    store.dispatch({ type: 'TOGGLE_VIRTUAL_TAGS' });
  }

  function copyTag(tag, e) {
    e.stopPropagation();
    var text = '<!--/' + tag.label + '/-->';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
    store.dispatch({ type: 'SHOW_TOAST', message: '가상태그가 복사되었습니다: ' + text });
  }

  return html`
    <div class="modal-overlay modal-overlay--top" onClick=${close}>
      <div class="quick-open page-address" onClick=${function (e) { e.stopPropagation(); }}>
        <div class="quick-open__input-row">
          <span class="page-address__title">가상태그</span>
          <span class="page-address__subtitle">${activePath ? fileNameOf(activePath) + ' 에서 적용 가능한 가상태그' : ''}</span>
          <button class="modal-close" onClick=${close}>×</button>
        </div>
        <div class="quick-open__list">
          ${tags.length === 0 && html`<div class="quick-open__empty">이 파일에 적용 가능한 가상태그가 없습니다.</div>`}
          ${tags.map(function (tag) {
            var text = '<!--/' + tag.label + '/-->';
            return html`
              <div key=${tag.label} class="quick-open__item virtual-tag__item" onClick=${function (e) { copyTag(tag, e); }}>
                <span class="virtual-tag__code">${text}</span>
                <span class="virtual-tag__detail">${tag.detail}</span>
                <button class="btn btn--ghost btn--sm" onClick=${function (e) { copyTag(tag, e); }}>복사</button>
              </div>
            `;
          })}
        </div>
      </div>
    </div>
  `;
}
