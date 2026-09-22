import { html, useState, useEffect, useRef } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { fileNameOf } from '../js/pathUtils.js';

function defaultHistoryName() {
  var d = new Date();
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' 저장';
}

export function SaveConfirmModal() {
  var store = useStore();
  var saveConfirm = store.state.saveConfirm;
  var inputRef = useRef(null);
  var nameState = useState(defaultHistoryName());
  var name = nameState[0];
  var setName = nameState[1];

  useEffect(function () {
    if (saveConfirm && saveConfirm.step === 'name') {
      setName(defaultHistoryName());
      requestAnimationFrame(function () {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }
  }, [saveConfirm && saveConfirm.step, saveConfirm && saveConfirm.path]);

  if (!saveConfirm) return null;

  var path = saveConfirm.path;

  function cancel() {
    store.dispatch({ type: 'CANCEL_SAVE' });
  }
  function saveWithoutHistory() {
    store.dispatch({ type: 'SAVE_WITHOUT_HISTORY', path: path });
  }
  function gotoName() {
    store.dispatch({ type: 'SAVE_CONFIRM_GOTO_NAME' });
  }
  function back() {
    store.dispatch({ type: 'SAVE_CONFIRM_GOTO_CHOOSE' });
  }
  function confirmSaveWithHistory(e) {
    if (e) e.preventDefault();
    store.dispatch({ type: 'SAVE_WITH_HISTORY', path: path, name: name });
  }

  if (saveConfirm.step === 'name') {
    return html`
      <div class="modal-overlay" onClick=${cancel}>
        <div class="modal-panel modal-panel--input" onClick=${function (e) { e.stopPropagation(); }}>
          <h3 class="modal-title">히스토리 이름 입력</h3>
          <p class="modal-subtitle">${fileNameOf(path)} — 이 저장 시점을 구분할 이름을 입력하세요.</p>
          <form onSubmit=${confirmSaveWithHistory}>
            <input
              ref=${inputRef}
              class="modal-input"
              type="text"
              value=${name}
              placeholder="예: 옵션 UI 1차 수정"
              onInput=${function (e) { setName(e.target.value); }}
            />
            <div class="modal-actions">
              <button type="button" class="btn btn--ghost" onClick=${back}>뒤로</button>
              <button type="button" class="btn btn--ghost" onClick=${cancel}>취소</button>
              <button type="submit" class="btn btn--primary">저장</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  return html`
    <div class="modal-overlay" onClick=${cancel}>
      <div class="modal-panel" onClick=${function (e) { e.stopPropagation(); }}>
        <h3 class="modal-title">저장 방식을 선택하세요</h3>
        <p class="modal-subtitle">${fileNameOf(path)} 파일을 저장합니다. 이후 히스토리에서 지금 시점으로 되돌아볼 수 있게 남겨둘까요?</p>
        <div class="modal-actions modal-actions--three">
          <button type="button" class="btn btn--ghost" onClick=${cancel}>취소</button>
          <button type="button" class="btn btn--ghost" onClick=${saveWithoutHistory}>그냥 저장</button>
          <button type="button" class="btn btn--primary" onClick=${gotoName}>히스토리 남기고 저장</button>
        </div>
      </div>
    </div>
  `;
}
