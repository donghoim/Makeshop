import { html, useState, useCallback } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { EditorTabs } from './EditorTabs.js';
import { Breadcrumb } from './Breadcrumb.js';
import { MonacoEditorPane } from './MonacoEditorPane.js';
import { StatusBar } from './StatusBar.js';

export function EditorArea() {
  var store = useStore();
  var state = store.state;
  var activePath = state.activeTabPath;
  var dirty = activePath ? state.contents[activePath] !== state.savedContents[activePath] : false;

  var cursorState = useState({ line: 1, column: 1 });
  var cursor = cursorState[0];
  var setCursor = cursorState[1];

  var onCursorChange = useCallback(function (pos) { setCursor(pos); }, []);

  function onSave() {
    if (activePath) store.dispatch({ type: 'SAVE_FILE', path: activePath });
  }
  function onPreview() {
    store.dispatch({ type: 'TOGGLE_PREVIEW' });
  }

  return html`
    <section class="editor-area">
      <${EditorTabs} />
      <div class="editor-toolbar">
        <${Breadcrumb} path=${activePath} />
        <div class="editor-toolbar__actions">
          <button class="btn btn--ghost btn--sm" onClick=${onPreview}>미리보기</button>
          <button
            class=${'btn btn--primary btn--sm' + (dirty ? ' btn--primary-dirty' : '')}
            onClick=${onSave}
            disabled=${!activePath}
          >저장${dirty ? ' •' : ''}</button>
        </div>
      </div>
      <div class="editor-canvas">
        <${MonacoEditorPane} onCursorChange=${onCursorChange} />
        ${!activePath && html`
          <div class="editor-empty-state">
            <p class="editor-empty-state__title">열린 파일이 없습니다</p>
            <p class="editor-empty-state__desc">좌측 Explorer 에서 파일을 선택하거나 <span class="kbd">Ctrl+P</span> 로 빠르게 열어보세요.</p>
          </div>
        `}
      </div>
      <${StatusBar} activePath=${activePath} cursor=${cursor} dirty=${dirty} />
    </section>
  `;
}
