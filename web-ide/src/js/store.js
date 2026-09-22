import { React, useReducer, useContext, createContext } from './lib.js';
import { fileSystemTree, fileContents } from '../data/mockFileSystem.js';
import { parsePath, joinPath, languageForExt } from './pathUtils.js';

function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree));
}

function getChildrenArray(tree, root, segments) {
  var nodes = tree[root];
  var current = null;
  for (var i = 0; i < segments.length; i++) {
    current = nodes.find(function (n) { return n.name === segments[i]; });
    if (!current) return null;
    nodes = current.children;
  }
  return nodes;
}

function findNodeAndParent(tree, path) {
  var parsed = parsePath(path);
  var nodes = tree[parsed.root];
  var parentArr = tree[parsed.root];
  var node = null;
  for (var i = 0; i < parsed.segments.length; i++) {
    parentArr = nodes;
    node = nodes.find(function (n) { return n.name === parsed.segments[i]; });
    if (!node) return { node: null, parentArr: null };
    nodes = node.children;
  }
  return { node: node, parentArr: parentArr };
}

function remapPrefix(map, oldPrefix, newPrefix) {
  var next = {};
  Object.keys(map).forEach(function (key) {
    if (key === oldPrefix || key.indexOf(oldPrefix + '/') === 0) {
      next[newPrefix + key.slice(oldPrefix.length)] = map[key];
    } else {
      next[key] = map[key];
    }
  });
  return next;
}

function removePrefix(map, prefix) {
  var next = {};
  Object.keys(map).forEach(function (key) {
    if (key === prefix || key.indexOf(prefix + '/') === 0) return;
    next[key] = map[key];
  });
  return next;
}

function remapArrayPrefix(arr, oldPrefix, newPrefix) {
  return arr.map(function (p) {
    if (p === oldPrefix) return newPrefix;
    if (p.indexOf(oldPrefix + '/') === 0) return newPrefix + p.slice(oldPrefix.length);
    return p;
  });
}

function initialState() {
  var tree = cloneTree(fileSystemTree);
  var contents = Object.assign({}, fileContents);
  var savedContents = Object.assign({}, fileContents);
  var expanded = {
    SYSTEM: true, WORKSPACE: true,
    'SYSTEM/상품': true, 'SYSTEM/상품/상품 상세': true,
    'WORKSPACE/임동호': true, 'WORKSPACE/임동호/상품 상세페이지': true,
    'WORKSPACE/임동호/상품 상세페이지/상품 디테일': true,
  };
  return {
    tree: tree,
    contents: contents,
    savedContents: savedContents,
    expanded: expanded,
    openTabs: [],
    activeTabPath: null,
    toast: null,
    confirmClose: null,
    quickOpenVisible: false,
    previewVisible: false,
    pageLinksVisible: false,
    virtualTagsVisible: false,
    contextMenu: null,
    inputModal: null,
    errorFlash: null,
  };
}

var toastTimer = null;

function reducer(state, action) {
  switch (action.type) {
    case 'OPEN_FILE': {
      var path = action.path;
      var tabs = state.openTabs.indexOf(path) === -1 ? state.openTabs.concat([path]) : state.openTabs;
      return Object.assign({}, state, { openTabs: tabs, activeTabPath: path });
    }
    case 'SET_ACTIVE_TAB':
      return Object.assign({}, state, { activeTabPath: action.path });
    case 'REQUEST_CLOSE_TAB': {
      var isDirty = state.contents[action.path] !== state.savedContents[action.path];
      if (isDirty) {
        return Object.assign({}, state, { confirmClose: { path: action.path } });
      }
      return closeTab(state, action.path);
    }
    case 'CANCEL_CLOSE':
      return Object.assign({}, state, { confirmClose: null });
    case 'SAVE_AND_CLOSE': {
      var saved = Object.assign({}, state.savedContents);
      saved[action.path] = state.contents[action.path];
      var next = Object.assign({}, state, { savedContents: saved, confirmClose: null });
      return closeTab(next, action.path);
    }
    case 'DISCARD_AND_CLOSE': {
      var contentsReset = Object.assign({}, state.contents);
      contentsReset[action.path] = state.savedContents[action.path];
      var next2 = Object.assign({}, state, { contents: contentsReset, confirmClose: null });
      return closeTab(next2, action.path);
    }
    case 'UPDATE_CONTENT': {
      var contents2 = Object.assign({}, state.contents);
      contents2[action.path] = action.value;
      return Object.assign({}, state, { contents: contents2 });
    }
    case 'SAVE_FILE': {
      if (!action.path) return state;
      var saved2 = Object.assign({}, state.savedContents);
      saved2[action.path] = state.contents[action.path];
      return Object.assign({}, state, {
        savedContents: saved2,
        toast: { id: Date.now(), message: action.path.split('/').pop() + ' 파일이 저장되었습니다.' },
      });
    }
    case 'SHOW_TOAST':
      return Object.assign({}, state, { toast: { id: Date.now(), message: action.message } });
    case 'HIDE_TOAST':
      return Object.assign({}, state, { toast: null });
    case 'TOGGLE_FOLDER': {
      var expanded2 = Object.assign({}, state.expanded);
      expanded2[action.path] = !expanded2[action.path];
      return Object.assign({}, state, { expanded: expanded2 });
    }
    case 'TOGGLE_QUICK_OPEN':
      return Object.assign({}, state, { quickOpenVisible: !state.quickOpenVisible, contextMenu: null });
    case 'TOGGLE_PREVIEW':
      return Object.assign({}, state, { previewVisible: !state.previewVisible });
    case 'TOGGLE_PAGE_LINKS':
      return Object.assign({}, state, { pageLinksVisible: !state.pageLinksVisible });
    case 'TOGGLE_VIRTUAL_TAGS':
      return Object.assign({}, state, { virtualTagsVisible: !state.virtualTagsVisible });
    case 'OPEN_CONTEXT_MENU':
      return Object.assign({}, state, { contextMenu: action.menu });
    case 'CLOSE_CONTEXT_MENU':
      return Object.assign({}, state, { contextMenu: null });
    case 'OPEN_INPUT_MODAL':
      return Object.assign({}, state, { inputModal: action.modal, contextMenu: null });
    case 'CLOSE_INPUT_MODAL':
      return Object.assign({}, state, { inputModal: null });

    case 'CREATE_NODE': {
      var tree2 = cloneTree(state.tree);
      var parsed = parsePath(action.parentPath);
      var childrenArr = getChildrenArray(tree2, parsed.root, parsed.segments);
      if (!childrenArr) return state;
      var dup = childrenArr.some(function (n) { return n.name === action.name; });
      if (dup) {
        return Object.assign({}, state, {
          toast: { id: Date.now(), message: '이미 같은 이름이 존재합니다: ' + action.name },
        });
      }
      var newPath = action.parentPath + '/' + action.name;
      var newContents = Object.assign({}, state.contents);
      var newSaved = Object.assign({}, state.savedContents);
      if (action.kind === 'file') {
        childrenArr.push({ type: 'file', name: action.name, ext: action.name.split('.').pop() });
        newContents[newPath] = '';
        newSaved[newPath] = '';
      } else {
        childrenArr.push({ type: 'folder', name: action.name, children: [] });
      }
      var expandedNew = Object.assign({}, state.expanded);
      expandedNew[action.parentPath] = true;
      return Object.assign({}, state, {
        tree: tree2, contents: newContents, savedContents: newSaved, expanded: expandedNew, inputModal: null,
        toast: { id: Date.now(), message: action.name + (action.kind === 'file' ? ' 파일이' : ' 폴더가') + ' 생성되었습니다.' },
      });
    }

    case 'RENAME_NODE': {
      var tree3 = cloneTree(state.tree);
      var found = findNodeAndParent(tree3, action.path);
      if (!found.node) return state;
      var oldName = found.node.name;
      if (oldName === action.newName) return Object.assign({}, state, { inputModal: null });
      var dup2 = found.parentArr.some(function (n) { return n.name === action.newName; });
      if (dup2) {
        return Object.assign({}, state, { toast: { id: Date.now(), message: '이미 같은 이름이 존재합니다: ' + action.newName } });
      }
      found.node.name = action.newName;
      if (found.node.type === 'file') found.node.ext = action.newName.split('.').pop();
      var segs = action.path.split('/');
      segs[segs.length - 1] = action.newName;
      var newPath2 = segs.join('/');
      return Object.assign({}, state, {
        tree: tree3,
        contents: remapPrefix(state.contents, action.path, newPath2),
        savedContents: remapPrefix(state.savedContents, action.path, newPath2),
        openTabs: remapArrayPrefix(state.openTabs, action.path, newPath2),
        activeTabPath: state.activeTabPath ? remapArrayPrefix([state.activeTabPath], action.path, newPath2)[0] : null,
        expanded: (function () {
          var e = {};
          Object.keys(state.expanded).forEach(function (k) {
            var nk = (k === action.path || k.indexOf(action.path + '/') === 0) ? newPath2 + k.slice(action.path.length) : k;
            e[nk] = state.expanded[k];
          });
          return e;
        })(),
        inputModal: null,
        toast: { id: Date.now(), message: '이름이 변경되었습니다: ' + action.newName },
      });
    }

    case 'DELETE_NODE': {
      var tree4 = cloneTree(state.tree);
      var found2 = findNodeAndParent(tree4, action.path);
      if (!found2.node) return state;
      found2.parentArr.splice(found2.parentArr.indexOf(found2.node), 1);
      var newTabs = state.openTabs.filter(function (p) { return p !== action.path && p.indexOf(action.path + '/') !== 0; });
      var newActive = state.activeTabPath && (state.activeTabPath === action.path || state.activeTabPath.indexOf(action.path + '/') === 0)
        ? (newTabs.length ? newTabs[newTabs.length - 1] : null)
        : state.activeTabPath;
      return Object.assign({}, state, {
        tree: tree4,
        contents: removePrefix(state.contents, action.path),
        savedContents: removePrefix(state.savedContents, action.path),
        openTabs: newTabs,
        activeTabPath: newActive,
        toast: { id: Date.now(), message: action.path.split('/').pop() + ' 이(가) 삭제되었습니다.' },
      });
    }

    default:
      return state;
  }
}

function closeTab(state, path) {
  var tabs = state.openTabs.filter(function (p) { return p !== path; });
  var active = state.activeTabPath;
  if (active === path) {
    active = tabs.length ? tabs[tabs.length - 1] : null;
  }
  return Object.assign({}, state, { openTabs: tabs, activeTabPath: active });
}

var StoreContext = createContext(null);

export function StoreProvider(props) {
  var reducerPair = useReducer(reducer, null, initialState);
  var state = reducerPair[0];
  var dispatch = reducerPair[1];
  var value = { state: state, dispatch: dispatch };
  return React.createElement(StoreContext.Provider, { value: value }, props.children);
}

export function useStore() {
  return useContext(StoreContext);
}

export function isDirty(state, path) {
  if (!path) return false;
  return state.contents[path] !== state.savedContents[path];
}

export { languageForExt, joinPath };
