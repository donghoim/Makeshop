import { html } from '../js/lib.js';
import { iconForExt } from '../js/pathUtils.js';

export function FileIcon(props) {
  var meta = iconForExt(props.ext);
  return html`
    <span
      class="file-icon"
      style=${{ color: meta.color, borderColor: meta.color }}
    >${meta.label.slice(0, 1)}</span>
  `;
}

export function FolderIcon(props) {
  return html`
    <svg class="folder-icon" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d=${props.open
          ? 'M2 5.5A1.5 1.5 0 0 1 3.5 4h4.6l1.4 1.6H16.5A1.5 1.5 0 0 1 18 7.1V14.5A1.5 1.5 0 0 1 16.5 16h-13A1.5 1.5 0 0 1 2 14.5v-9Z'
          : 'M2 5.5A1.5 1.5 0 0 1 3.5 4h4.6l1.4 1.6H16.5A1.5 1.5 0 0 1 18 7.1V14.5A1.5 1.5 0 0 1 16.5 16h-13A1.5 1.5 0 0 1 2 14.5v-9Z'}
        fill=${props.open ? '#60a5fa' : '#93c5fd'}
      />
    </svg>
  `;
}

export function ChevronIcon(props) {
  return html`
    <svg
      class=${'chevron-icon' + (props.open ? ' chevron-icon--open' : '')}
      width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 2 L7 5 L3 8" stroke="#6b7280" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    </svg>
  `;
}
