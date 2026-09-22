// 트리 탐색 / 경로 계산 유틸리티

export const ROOT_LABEL = { system: 'SYSTEM', workspace: 'WORKSPACE' };

export function joinPath(root, segments) {
  return [ROOT_LABEL[root]].concat(segments).join('/');
}

export function flattenTree(root, nodes, parentSegments) {
  parentSegments = parentSegments || [];
  var result = [];
  nodes.forEach(function (node) {
    var segments = parentSegments.concat([node.name]);
    var path = joinPath(root, segments);
    if (node.type === 'folder') {
      result.push({ type: 'folder', root: root, name: node.name, path: path, segments: segments });
      result = result.concat(flattenTree(root, node.children, segments));
    } else {
      result.push({ type: 'file', root: root, name: node.name, ext: node.ext, path: path, segments: segments });
    }
  });
  return result;
}

export function flattenAll(tree) {
  return flattenTree('system', tree.system).concat(flattenTree('workspace', tree.workspace));
}

// path: "WORKSPACE/임동호/상품 상세페이지" 형태 -> { root, segments }
export function parsePath(path) {
  var parts = path.split('/');
  var rootLabel = parts[0];
  var root = rootLabel === 'SYSTEM' ? 'system' : 'workspace';
  return { root: root, segments: parts.slice(1) };
}

export function findNode(tree, path) {
  var parsed = parsePath(path);
  var nodes = tree[parsed.root];
  var current = null;
  for (var i = 0; i < parsed.segments.length; i++) {
    var seg = parsed.segments[i];
    current = (nodes || []).find(function (n) { return n.name === seg; });
    if (!current) return null;
    nodes = current.children;
  }
  return current;
}

export function iconForExt(ext) {
  switch (ext) {
    case 'html': return { label: 'HTML', color: '#e34c26' };
    case 'css': return { label: 'CSS', color: '#2965f1' };
    case 'js': return { label: 'JS', color: '#d3ae09' };
    default: return { label: '•', color: '#6b7280' };
  }
}

export function languageForExt(ext) {
  if (ext === 'html') return 'makeshop-html';
  if (ext === 'css') return 'css';
  if (ext === 'js') return 'javascript';
  return 'plaintext';
}

export function fileNameOf(path) {
  var parts = path.split('/');
  return parts[parts.length - 1];
}

export function breadcrumbOf(path) {
  return path.split('/');
}
