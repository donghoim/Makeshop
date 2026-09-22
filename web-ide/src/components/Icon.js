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

export function StarIcon(props) {
  var filled = !!props.filled;
  return html`
    <svg
      class=${'star-icon' + (filled ? ' star-icon--filled' : '')}
      width="13" height="13" viewBox="0 0 20 20"
      fill=${filled ? '#f59e0b' : 'none'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 1.8 12.5 7 18.2 7.8 14.1 11.7 15.1 17.4 10 14.7 4.9 17.4 5.9 11.7 1.8 7.8 7.5 7 10 1.8Z"
        stroke=${filled ? '#f59e0b' : '#9ca3af'}
        stroke-width="1.2"
        stroke-linejoin="round"
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
