import { html } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { FileIcon, FolderIcon, ChevronIcon, StarIcon } from './Icon.js';

export function ExplorerTree(props) {
  var nodes = props.nodes;
  var root = props.root;
  var basePath = props.basePath;
  var depth = props.depth || 0;
  var forceOpen = !!props.forceOpen;

  return html`
    <div class="tree-level">
      ${nodes.map(function (node) {
        var path = basePath + '/' + node.name;
        return html`
          <${TreeNode} key=${path} node=${node} root=${root} path=${path} depth=${depth} forceOpen=${forceOpen} />
        `;
      })}
    </div>
  `;
}

function TreeNode(props) {
  var store = useStore();
  var node = props.node;
  var path = props.path;
  var root = props.root;
  var depth = props.depth;
  var forceOpen = props.forceOpen;
  var indent = 10 + depth * 14;

  function onContextMenu(e) {
    e.preventDefault();
    store.dispatch({
      type: 'OPEN_CONTEXT_MENU',
      menu: { x: e.clientX, y: e.clientY, node: node, path: path, root: root },
    });
  }

  if (node.type === 'folder') {
    var open = forceOpen || !!store.state.expanded[path];
    return html`
      <div>
        <div
          class="tree-row tree-row--folder"
          style=${{ paddingLeft: indent + 'px' }}
          onClick=${function () { store.dispatch({ type: 'TOGGLE_FOLDER', path: path }); }}
          onContextMenu=${onContextMenu}
        >
          <${ChevronIcon} open=${open} />
          <${FolderIcon} open=${open} />
          <span class="tree-row__label">${node.name}</span>
        </div>
        ${open && html`<${ExplorerTree} nodes=${node.children} root=${root} basePath=${path} depth=${depth + 1} forceOpen=${forceOpen} />`}
      </div>
    `;
  }

  var active = store.state.activeTabPath === path;
  var dirty = store.state.contents[path] !== store.state.savedContents[path];
  var favorited = !!store.state.favorites[path];

  function onToggleFavorite(e) {
    e.stopPropagation();
    store.dispatch({ type: 'TOGGLE_FAVORITE', path: path });
  }

  return html`
    <div
      class=${'tree-row tree-row--file' + (active ? ' tree-row--active' : '')}
      style=${{ paddingLeft: (indent + 14) + 'px' }}
      onClick=${function () { store.dispatch({ type: 'OPEN_FILE', path: path }); }}
      onContextMenu=${onContextMenu}
    >
      <${FileIcon} ext=${node.ext} />
      <span class="tree-row__label">${node.name}</span>
      ${dirty && html`<span class="tree-row__dirty-dot"></span>`}
      <button class="tree-row__favorite" onClick=${onToggleFavorite} title=${favorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
        <${StarIcon} filled=${favorited} />
      </button>
    </div>
  `;
}
