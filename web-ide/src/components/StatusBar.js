import { html } from '../js/lib.js';
import { languageForExt, extOf, isHistoryPath } from '../js/pathUtils.js';

var LANG_LABEL = { 'makeshop-html': 'HTML', css: 'CSS', javascript: 'JS', plaintext: '' };

export function StatusBar(props) {
  var activePath = props.activePath;
  var cursor = props.cursor;
  var dirty = props.dirty;

  if (!activePath) {
    return html`<div class="status-bar status-bar--empty"><span>파일을 선택하면 편집을 시작할 수 있습니다.</span></div>`;
  }

  var ext = extOf(activePath);
  var lang = LANG_LABEL[languageForExt(ext)] || ext.toUpperCase();
  var readOnly = isHistoryPath(activePath);

  return html`
    <div class="status-bar">
      <span>Ln ${cursor.line}, Col ${cursor.column}</span>
      <span class="status-bar__divider"></span>
      <span>${lang}</span>
      <span class="status-bar__divider"></span>
      <span>UTF-8</span>
      <span class="status-bar__spacer"></span>
      ${readOnly
        ? html`<span class="status-bar__save">읽기 전용 (히스토리)</span>`
        : html`
          <span class=${dirty ? 'status-bar__save status-bar__save--dirty' : 'status-bar__save'}>
            ${dirty ? '● 수정됨' : '저장됨'}
          </span>
        `}
    </div>
  `;
}
