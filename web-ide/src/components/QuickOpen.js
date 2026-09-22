import { html, useState, useEffect, useRef, useMemo } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { flattenAll } from '../js/pathUtils.js';
import { FileIcon } from './Icon.js';

export function QuickOpen() {
  var store = useStore();
  var visible = store.state.quickOpenVisible;
  var inputRef = useRef(null);
  var queryState = useState('');
  var query = queryState[0];
  var setQuery = queryState[1];
  var activeIndexState = useState(0);
  var activeIndex = activeIndexState[0];
  var setActiveIndex = activeIndexState[1];

  var allFiles = useMemo(function () {
    return flattenAll(store.state.tree).filter(function (n) { return n.type === 'file'; });
  }, [store.state.tree]);

  var results = useMemo(function () {
    var q = query.trim().toLowerCase();
    if (!q) return allFiles.slice(0, 20);
    return allFiles.filter(function (n) { return n.name.toLowerCase().indexOf(q) !== -1 || n.path.toLowerCase().indexOf(q) !== -1; }).slice(0, 20);
  }, [allFiles, query]);

  useEffect(function () {
    if (visible) {
      setQuery('');
      setActiveIndex(0);
      if (inputRef.current) inputRef.current.focus();
    }
  }, [visible]);

  useEffect(function () { setActiveIndex(0); }, [query]);

  if (!visible) return null;

  function close() {
    store.dispatch({ type: 'TOGGLE_QUICK_OPEN' });
  }

  function openAt(index) {
    var item = results[index];
    if (!item) return;
    store.dispatch({ type: 'OPEN_FILE', path: item.path });
    close();
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(function (i) { return Math.min(i + 1, results.length - 1); });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(function (i) { return Math.max(i - 1, 0); });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      openAt(activeIndex);
    } else if (e.key === 'Escape') {
      close();
    }
  }

  return html`
    <div class="modal-overlay modal-overlay--top" onClick=${close}>
      <div class="quick-open" onClick=${function (e) { e.stopPropagation(); }}>
        <div class="quick-open__input-row">
          <span class="quick-open__prompt">&gt;</span>
          <input
            ref=${inputRef}
            class="quick-open__input"
            type="text"
            placeholder="파일 이름으로 이동... (예: shop)"
            value=${query}
            onInput=${function (e) { setQuery(e.target.value); }}
            onKeyDown=${onKeyDown}
          />
        </div>
        <div class="quick-open__list">
          ${results.length === 0 && html`<div class="quick-open__empty">일치하는 파일이 없습니다.</div>`}
          ${results.map(function (item, i) {
            return html`
              <div
                key=${item.path}
                class=${'quick-open__item' + (i === activeIndex ? ' quick-open__item--active' : '')}
                onMouseEnter=${function () { setActiveIndex(i); }}
                onClick=${function () { openAt(i); }}
              >
                <${FileIcon} ext=${item.ext} />
                <span class="quick-open__name">${item.name}</span>
                <span class="quick-open__path">${item.path}</span>
              </div>
            `;
          })}
        </div>
      </div>
    </div>
  `;
}
