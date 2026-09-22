import { html, useState, useRef, useEffect } from '../js/lib.js';
import { useStore } from '../js/store.js';

var TITLES = {
  newFile: '새 파일 만들기',
  newFolder: '새 폴더 만들기',
  rename: '이름 변경',
};

export function InputModal() {
  var store = useStore();
  var modal = store.state.inputModal;
  var inputRef = useRef(null);
  var stateHook = useState(modal ? modal.defaultValue || '' : '');
  var value = stateHook[0];
  var setValue = stateHook[1];

  useEffect(function () {
    if (modal) {
      setValue(modal.defaultValue || '');
      // setValue() 의 DOM 반영(re-render) 이후에 select() 해야 기본값 전체가 선택된다.
      requestAnimationFrame(function () {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }
  }, [modal && modal.mode, modal && modal.parentPath, modal && modal.targetPath]);

  if (!modal) return null;

  function close() {
    store.dispatch({ type: 'CLOSE_INPUT_MODAL' });
  }

  function submit(e) {
    if (e) e.preventDefault();
    var name = value.trim();
    if (!name) return;
    if (modal.mode === 'rename') {
      store.dispatch({ type: 'RENAME_NODE', path: modal.targetPath, newName: name });
    } else {
      store.dispatch({
        type: 'CREATE_NODE',
        parentPath: modal.parentPath,
        name: name,
        kind: modal.mode === 'newFolder' ? 'folder' : 'file',
      });
    }
  }

  return html`
    <div class="modal-overlay" onClick=${close}>
      <div class="modal-panel modal-panel--input" onClick=${function (e) { e.stopPropagation(); }}>
        <h3 class="modal-title">${TITLES[modal.mode]}</h3>
        <p class="modal-subtitle">${modal.parentPath || modal.targetPath}</p>
        <form onSubmit=${submit}>
          <input
            ref=${inputRef}
            class="modal-input"
            type="text"
            value=${value}
            placeholder=${modal.mode === 'newFolder' ? '폴더 이름' : modal.mode === 'newFile' ? '예: detail.html' : '새 이름'}
            onInput=${function (e) { setValue(e.target.value); }}
          />
          <div class="modal-actions">
            <button type="button" class="btn btn--ghost" onClick=${close}>취소</button>
            <button type="submit" class="btn btn--primary">확인</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
