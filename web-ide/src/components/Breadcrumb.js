import { html } from '../js/lib.js';
import { breadcrumbOf } from '../js/pathUtils.js';

export function Breadcrumb(props) {
  if (!props.path) {
    return html`<div class="breadcrumb breadcrumb--empty"></div>`;
  }
  var parts = breadcrumbOf(props.path);
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
    </div>
  `;
}
