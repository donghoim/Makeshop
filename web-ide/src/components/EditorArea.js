import { html, useState, useCallback } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { EditorTabs } from './EditorTabs.js';
import { Breadcrumb } from './Breadcrumb.js';
import { MonacoEditorPane } from './MonacoEditorPane.js';
import { StatusBar } from './StatusBar.js';
import { extOf, isHistoryPath } from '../js/pathUtils.js';

export function EditorArea() {
  var store = useStore();
  var state = store.state;
  var activePath = state.activeTabPath;
  var dirty = activePath ? state.contents[activePath] !== state.savedContents[activePath] : false;
  var isHistoryTab = activePath ? isHistoryPath(activePath) : false;
  var isHtml = activePath ? extOf(activePath) === 'html' : false;

  var cursorState = useState({ line: 1, column: 1 });
  var cursor = cursorState[0];
  var setCursor = cursorState[1];

  var onCursorChange = useCallback(function (pos) { setCursor(pos); }, []);

  function onSave() {
    if (!activePath || isHistoryTab) return;
    if (isHtml) {
      store.dispatch({ type: 'REQUEST_SAVE', path: activePath });
    } else {
      store.dispatch({ type: 'SAVE_FILE', path: activePath });
    }
  }
  function onPreview() {
    store.dispatch({ type: 'TOGGLE_PREVIEW' });
  }
  function onToggleTheme() {
    store.dispatch({ type: 'TOGGLE_EDITOR_THEME' });
  }
  function onHistory() {
    store.dispatch({ type: 'TOGGLE_HISTORY_MODAL' });
  }
  var isDark = state.editorTheme === 'dark';

  return html`
    <section class="editor-area">
      <${EditorTabs} />
      <div class="editor-toolbar">
        <${Breadcrumb} path=${activePath} />
        <div class="editor-toolbar__actions">
          <button
            class="theme-toggle"
            onClick=${onToggleTheme}
            title=${isDark ? '라이트 테마로 전환' : '다크 테마로 전환'}
            aria-label=${isDark ? '라이트 테마로 전환' : '다크 테마로 전환'}
          >
            ${isDark
              ? html`
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="4.2" fill="currentColor" />
                  <g stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                    <line x1="10" y1="1.5" x2="10" y2="3.5" />
                    <line x1="10" y1="16.5" x2="10" y2="18.5" />
                    <line x1="1.5" y1="10" x2="3.5" y2="10" />
                    <line x1="16.5" y1="10" x2="18.5" y2="10" />
                    <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
                    <line x1="14.4" y1="14.4" x2="15.8" y2="15.8" />
                    <line x1="4.2" y1="15.8" x2="5.6" y2="14.4" />
                    <line x1="14.4" y1="5.6" x2="15.8" y2="4.2" />
                  </g>
                </svg>
              `
              : html`
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 11.5A7 7 0 1 1 8.5 3a5.5 5.5 0 0 0 8.5 8.5Z" fill="currentColor" />
                </svg>
              `}
            <span>${isDark ? '라이트' : '다크'}</span>
          </button>
          ${isHtml && !isHistoryTab && html`
            <button class="btn btn--ghost btn--sm" onClick=${onHistory}>히스토리</button>
          `}
          <button class="btn btn--ghost btn--sm" onClick=${onPreview}>미리보기</button>
          <button
            class=${'btn btn--primary btn--sm' + (dirty ? ' btn--primary-dirty' : '')}
            onClick=${onSave}
            disabled=${!activePath || isHistoryTab}
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
