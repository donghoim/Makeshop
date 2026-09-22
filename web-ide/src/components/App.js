import { html, useEffect, useState } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { TopBar } from './TopBar.js';
import { Explorer } from './Explorer.js';
import { EditorArea } from './EditorArea.js';
import { PreviewPanel } from './PreviewPanel.js';
import { QuickOpen } from './QuickOpen.js';
import { PageAddressModal } from './PageAddressModal.js';
import { VirtualTagModal } from './VirtualTagModal.js';
import { ConfirmModal } from './ConfirmModal.js';
import { InputModal } from './InputModal.js';
import { ContextMenu } from './ContextMenu.js';
import { Toast } from './Toast.js';
import { HistoryModal } from './HistoryModal.js';
import { SaveConfirmModal } from './SaveConfirmModal.js';
import { extOf, isHistoryPath } from '../js/pathUtils.js';

export function App() {
  var store = useStore();
  var explorerOpenState = useState(false);
  var explorerOpen = explorerOpenState[0];
  var setExplorerOpen = explorerOpenState[1];

  useEffect(function () {
    function onKeyDown(e) {
      var ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (!ctrlOrCmd) return;
      var key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        var active = store.state.activeTabPath;
        if (!active || isHistoryPath(active)) return;
        if (extOf(active) === 'html') {
          store.dispatch({ type: 'REQUEST_SAVE', path: active });
        } else {
          store.dispatch({ type: 'SAVE_FILE', path: active });
        }
      } else if (key === 'p') {
        e.preventDefault();
        store.dispatch({ type: 'TOGGLE_QUICK_OPEN' });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return function () { window.removeEventListener('keydown', onKeyDown); };
  }, [store.state.activeTabPath]);

  useEffect(function () {
    setExplorerOpen(false);
  }, [store.state.activeTabPath]);

  return html`
    <div class="app">
      <${TopBar} onMenuClick=${function () { setExplorerOpen(function (v) { return !v; }); }} />
      <div class="app__body">
        <${Explorer} mobileOpen=${explorerOpen} />
        ${explorerOpen && html`<div class="explorer-backdrop" onClick=${function () { setExplorerOpen(false); }}></div>`}
        <${EditorArea} />
      </div>
      <${PreviewPanel} />
      <${QuickOpen} />
      <${PageAddressModal} />
      <${VirtualTagModal} />
      <${ConfirmModal} />
      <${InputModal} />
      <${ContextMenu} />
      <${Toast} />
      <${HistoryModal} />
      <${SaveConfirmModal} />
    </div>
  `;
}
