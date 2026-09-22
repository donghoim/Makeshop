import { html } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { FileIcon } from './Icon.js';
import { fileNameOf } from '../js/pathUtils.js';

export function EditorTabs() {
  var store = useStore();
  var state = store.state;

  if (!state.openTabs.length) return html`<div class="editor-tabs editor-tabs--empty"></div>`;

  return html`
    <div class="editor-tabs">
      ${state.openTabs.map(function (path) {
        var active = state.activeTabPath === path;
        var dirty = state.contents[path] !== state.savedContents[path];
        var name = fileNameOf(path);
        var ext = name.split('.').pop();
        return html`
          <div
            key=${path}
            class=${'editor-tab' + (active ? ' editor-tab--active' : '') + (dirty ? ' editor-tab--dirty' : '')}
            onClick=${function () { store.dispatch({ type: 'SET_ACTIVE_TAB', path: path }); }}
          >
            <${FileIcon} ext=${ext} />
            <span class="editor-tab__name">${name}</span>
            <span class="editor-tab__end">
              ${dirty && html`<span class="editor-tab__dot"></span>`}
              <button
                class="editor-tab__close"
                title="닫기"
                onClick=${function (e) { e.stopPropagation(); store.dispatch({ type: 'REQUEST_CLOSE_TAB', path: path }); }}
              >×</button>
            </span>
          </div>
        `;
      })}
    </div>
  `;
}
