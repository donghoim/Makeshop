import { html } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { fileNameOf } from '../js/pathUtils.js';

function formatTime(ts) {
  var d = new Date(ts);
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

export function HistoryModal() {
  var store = useStore();
  var state = store.state;
  var visible = state.historyModalVisible;
  if (!visible) return null;

  var path = state.activeTabPath;
  var entries = (path && state.history[path]) || [];
  var sorted = entries.slice().reverse();

  function close() {
    store.dispatch({ type: 'TOGGLE_HISTORY_MODAL' });
  }

  function openEntry(entry) {
    store.dispatch({ type: 'OPEN_HISTORY_ENTRY', path: path, entryId: entry.id });
  }

  return html`
    <div class="modal-overlay modal-overlay--top" onClick=${close}>
      <div class="quick-open page-address" onClick=${function (e) { e.stopPropagation(); }}>
        <div class="quick-open__input-row">
          <span class="page-address__title">히스토리</span>
          <span class="page-address__subtitle">${path ? fileNameOf(path) + ' 저장 히스토리' : ''}</span>
          <button class="modal-close" onClick=${close}>×</button>
        </div>
        <div class="quick-open__list">
          ${sorted.length === 0 && html`<div class="quick-open__empty">아직 저장된 히스토리가 없습니다. 저장 시 "히스토리 남기고 저장"을 선택해보세요.</div>`}
          ${sorted.map(function (entry) {
            return html`
              <div key=${entry.id} class="history-row" onClick=${function () { openEntry(entry); }}>
                <span class="history-row__name">${entry.name}</span>
                <span class="history-row__time">${formatTime(entry.timestamp)}</span>
              </div>
            `;
          })}
        </div>
      </div>
    </div>
  `;
}
