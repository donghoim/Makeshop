import { html } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { fileNameOf } from '../js/pathUtils.js';

export function ConfirmModal() {
  var store = useStore();
  var confirmClose = store.state.confirmClose;
  if (!confirmClose) return null;
  var path = confirmClose.path;

  function cancel() {
    store.dispatch({ type: 'CANCEL_CLOSE' });
  }
  function saveAndClose() {
    store.dispatch({ type: 'SAVE_AND_CLOSE', path: path });
  }
  function discardAndClose() {
    store.dispatch({ type: 'DISCARD_AND_CLOSE', path: path });
  }

  return html`
    <div class="modal-overlay" onClick=${cancel}>
      <div class="modal-panel" onClick=${function (e) { e.stopPropagation(); }}>
        <h3 class="modal-title">저장되지 않은 변경사항이 있습니다.</h3>
        <p class="modal-subtitle">${fileNameOf(path)} 파일을 닫기 전에 변경사항을 저장할까요?</p>
        <div class="modal-actions modal-actions--three">
          <button type="button" class="btn btn--ghost" onClick=${cancel}>취소</button>
          <button type="button" class="btn btn--danger" onClick=${discardAndClose}>저장하지 않고 닫기</button>
          <button type="button" class="btn btn--primary" onClick=${saveAndClose}>저장 후 닫기</button>
        </div>
      </div>
    </div>
  `;
}
