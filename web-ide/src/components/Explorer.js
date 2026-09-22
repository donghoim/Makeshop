import { html } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { ExplorerTree } from './ExplorerTree.js';
import { ChevronIcon } from './Icon.js';

export function Explorer(props) {
  var store = useStore();
  var state = store.state;

  function toggleSection(key) {
    store.dispatch({ type: 'TOGGLE_FOLDER', path: key });
  }

  function newFileAtRoot(e) {
    e.stopPropagation();
    store.dispatch({ type: 'OPEN_INPUT_MODAL', modal: { mode: 'newFile', parentPath: 'WORKSPACE', defaultValue: 'new-file.html' } });
  }
  function newFolderAtRoot(e) {
    e.stopPropagation();
    store.dispatch({ type: 'OPEN_INPUT_MODAL', modal: { mode: 'newFolder', parentPath: 'WORKSPACE', defaultValue: '새 폴더' } });
  }

  var systemOpen = !!state.expanded.SYSTEM;
  var workspaceOpen = !!state.expanded.WORKSPACE;

  return html`
    <aside class=${'explorer' + (props.mobileOpen ? ' explorer--open' : '')}>
      <div class="explorer__section">
        <div class="explorer__section-header" onClick=${function () { toggleSection('SYSTEM'); }}>
          <${ChevronIcon} open=${systemOpen} />
          <span class="explorer__section-title">SYSTEM</span>
          <span class="explorer__section-badge">운영</span>
        </div>
        ${systemOpen && html`<${ExplorerTree} nodes=${state.tree.system} root="system" basePath="SYSTEM" depth=${0} />`}
      </div>

      <div class="explorer__section">
        <div class="explorer__section-header" onClick=${function () { toggleSection('WORKSPACE'); }}>
          <${ChevronIcon} open=${workspaceOpen} />
          <span class="explorer__section-title">WORKSPACE</span>
          <span class="explorer__section-badge explorer__section-badge--workspace">내 작업공간</span>
          <span class="explorer__section-actions">
            <button class="explorer__icon-btn" title="새 파일" onClick=${newFileAtRoot}>＋F</button>
            <button class="explorer__icon-btn" title="새 폴더" onClick=${newFolderAtRoot}>＋D</button>
          </span>
        </div>
        ${workspaceOpen && html`<${ExplorerTree} nodes=${state.tree.workspace} root="workspace" basePath="WORKSPACE" depth=${0} />`}
      </div>
    </aside>
  `;
}
