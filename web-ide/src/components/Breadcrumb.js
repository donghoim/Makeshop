import { html } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { breadcrumbOf, isHistoryPath, historyBasePath, historyEntryId } from '../js/pathUtils.js';

function formatTime(ts) {
  var d = new Date(ts);
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

export function Breadcrumb(props) {
  var store = useStore();
  if (!props.path) {
    return html`<div class="breadcrumb breadcrumb--empty"></div>`;
  }
  var parts = breadcrumbOf(props.path);
  var historical = isHistoryPath(props.path);
  var historyMeta = null;
  if (historical) {
    var base = historyBasePath(props.path);
    var entryId = historyEntryId(props.path);
    var entry = (store.state.history[base] || []).find(function (e) { return e.id === entryId; });
    if (entry) historyMeta = entry.name + ' · ' + formatTime(entry.timestamp);
  }
  return html`
    <div class="breadcrumb">
      ${parts.map(function (part, i) {
        return html`
          <span key=${i} class="breadcrumb__part">
            ${i > 0 && html`<span class="breadcrumb__sep">›</span>`}
            <span class=${i === parts.length - 1 ? 'breadcrumb__leaf' : ''}>${part}</span>
          </span>
        `;
      })}
      ${historical && html`<span class="breadcrumb__history-badge">히스토리 · ${historyMeta || '읽기 전용'}</span>`}
    </div>
  `;
}
