import { html, useEffect, useRef } from '../js/lib.js';
import { useStore } from '../js/store.js';

export function ContextMenu() {
  var store = useStore();
  var menu = store.state.contextMenu;
  var ref = useRef(null);

  useEffect(function () {
    if (!menu) return;
    function onDocMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        store.dispatch({ type: 'CLOSE_CONTEXT_MENU' });
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') store.dispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return function () {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menu]);

  if (!menu) return null;

  function close() {
    store.dispatch({ type: 'CLOSE_CONTEXT_MENU' });
  }

  function openInputModal(mode) {
    var parentPath = menu.node.type === 'folder' ? menu.path : parentOf(menu.path);
    store.dispatch({
      type: 'OPEN_INPUT_MODAL',
      modal: { mode: mode, parentPath: parentPath, defaultValue: mode === 'newFile' ? 'new-file.html' : '새 폴더' },
    });
    close();
  }

  function openRename() {
    store.dispatch({
      type: 'OPEN_INPUT_MODAL',
      modal: { mode: 'rename', targetPath: menu.path, defaultValue: menu.node.name },
    });
    close();
  }

  function doDelete() {
    store.dispatch({ type: 'DELETE_NODE', path: menu.path });
    close();
  }

  function copyPath() {
    var text = menu.path;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
    store.dispatch({ type: 'SHOW_TOAST', message: '경로가 복사되었습니다: ' + text });
    close();
  }

  var isWorkspace = menu.root === 'workspace';

  var style = { left: menu.x + 'px', top: menu.y + 'px' };

  return html`
    <div class="context-menu" ref=${ref} style=${style}>
      ${isWorkspace && html`<button class="context-menu__item" onClick=${function () { openInputModal('newFile'); }}>새 파일</button>`}
      ${isWorkspace && html`<button class="context-menu__item" onClick=${function () { openInputModal('newFolder'); }}>새 폴더</button>`}
      ${isWorkspace && html`<button class="context-menu__item" onClick=${openRename}>이름 변경</button>`}
      ${isWorkspace && html`<button class="context-menu__item context-menu__item--danger" onClick=${doDelete}>삭제</button>`}
      ${isWorkspace && html`<div class="context-menu__divider"></div>`}
      <button class="context-menu__item" onClick=${copyPath}>경로 복사</button>
    </div>
  `;
}

function parentOf(path) {
  var parts = path.split('/');
  parts.pop();
  return parts.join('/');
}
