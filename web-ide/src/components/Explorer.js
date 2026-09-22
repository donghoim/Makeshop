import { html, useState, useMemo } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { ExplorerTree } from './ExplorerTree.js';
import { ChevronIcon, FileIcon, StarIcon } from './Icon.js';
import { flattenAll, filterTreeByQuery } from '../js/pathUtils.js';

export function Explorer(props) {
  var store = useStore();
  var state = store.state;

  var tabState = useState('all');
  var activeTab = tabState[0];
  var setActiveTab = tabState[1];

  var queryState = useState('');
  var query = queryState[0];
  var setQuery = queryState[1];

  function toggleSection(key) {
    store.dispatch({ type: 'TOGGLE_FOLDER', path: key });
  }

  function newFileAtRoot(e) {
    e.stopPropagation();
    store.dispatch({ type: 'OPEN_INPUT_MODAL', modal: { mode: 'newFile', parentPath: 'WORKSPACE', defaultValue: 'new-file.html' } });
  }
  function newFolderAtRoot(e) {
    e.stopPropagation();
    store.dispatch({ type: 'OPEN_INPUT_MODAL', modal: { mode: 'newFolder', parentPath: 'WORKSPACE', defaultValue: '새 폴더' } });
  }

  var searching = query.trim().length > 0;
  var systemNodes = useMemo(function () {
    return searching ? filterTreeByQuery(state.tree.system, query.trim()) : state.tree.system;
  }, [state.tree.system, searching, query]);
  var workspaceNodes = useMemo(function () {
    return searching ? filterTreeByQuery(state.tree.workspace, query.trim()) : state.tree.workspace;
  }, [state.tree.workspace, searching, query]);

  var favoriteItems = useMemo(function () {
    var q = query.trim().toLowerCase();
    return flattenAll(state.tree).filter(function (n) {
      if (n.type !== 'file') return false;
      if (!state.favorites[n.path]) return false;
      if (q && n.name.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }, [state.tree, state.favorites, query]);

  var systemOpen = searching || !!state.expanded.SYSTEM;
  var workspaceOpen = searching || !!state.expanded.WORKSPACE;

  return html`
    <aside class=${'explorer' + (props.mobileOpen ? ' explorer--open' : '')}>
      <div class="explorer__tabs">
        <button
          class=${'explorer__tab' + (activeTab === 'favorites' ? ' explorer__tab--active' : '')}
          onClick=${function () { setActiveTab('favorites'); }}
        >즐겨찾는 화면</button>
        <button
          class=${'explorer__tab' + (activeTab === 'all' ? ' explorer__tab--active' : '')}
          onClick=${function () { setActiveTab('all'); }}
        >전체 화면</button>
      </div>

      <div class="explorer__search">
        <span class="explorer__search-icon">⌕</span>
        <input
          class="explorer__search-input"
          type="text"
          placeholder="페이지명 검색"
          value=${query}
          onInput=${function (e) { setQuery(e.target.value); }}
        />
        ${query && html`<button class="explorer__search-clear" onClick=${function () { setQuery(''); }}>×</button>`}
      </div>

      <div class="explorer__body">
      ${activeTab === 'all' && html`
        <div class="explorer__section">
          <div class="explorer__section-header" onClick=${function () { toggleSection('SYSTEM'); }}>
            <${ChevronIcon} open=${systemOpen} />
            <span class="explorer__section-title">SYSTEM</span>
            <span class="explorer__section-badge">운영</span>
          </div>
          ${systemOpen && html`<${ExplorerTree} nodes=${systemNodes} root="system" basePath="SYSTEM" depth=${0} forceOpen=${searching} />`}
        </div>

        <div class="explorer__section">
          <div class="explorer__section-header" onClick=${function () { toggleSection('WORKSPACE'); }}>
            <${ChevronIcon} open=${workspaceOpen} />
            <span class="explorer__section-title">WORKSPACE</span>
            <span class="explorer__section-badge explorer__section-badge--workspace">내 작업공간</span>
            <span class="explorer__section-actions">
              <button class="explorer__icon-btn" title="새 파일" onClick=${newFileAtRoot}>＋F</button>
              <button class="explorer__icon-btn" title="새 폴더" onClick=${newFolderAtRoot}>＋D</button>
            </span>
          </div>
          ${workspaceOpen && html`<${ExplorerTree} nodes=${workspaceNodes} root="workspace" basePath="WORKSPACE" depth=${0} forceOpen=${searching} />`}
        </div>
      `}

      ${activeTab === 'favorites' && html`
        <div class="explorer__favorites">
          ${favoriteItems.length === 0 && html`
            <p class="explorer__empty">${searching ? '검색 결과가 없습니다.' : '즐겨찾기한 파일이 없습니다. 파일 목록에서 별표를 눌러 추가하세요.'}</p>
          `}
          ${favoriteItems.map(function (item) {
            var active = state.activeTabPath === item.path;
            return html`
              <div
                key=${item.path}
                class=${'favorite-row' + (active ? ' favorite-row--active' : '')}
                onClick=${function () { store.dispatch({ type: 'OPEN_FILE', path: item.path }); }}
              >
                <${FileIcon} ext=${item.ext} />
                <div class="favorite-row__info">
                  <span class="favorite-row__name">${item.name}</span>
                  <span class="favorite-row__path">${item.path}</span>
                </div>
                <button
                  class="tree-row__favorite"
                  title="즐겨찾기 해제"
                  onClick=${function (e) { e.stopPropagation(); store.dispatch({ type: 'TOGGLE_FAVORITE', path: item.path }); }}
                >
                  <${StarIcon} filled=${true} />
                </button>
              </div>
            `;
          })}
        </div>
      `}
      </div>
    </aside>
  `;
}
