import { MAKESHOP_TAGS } from '../data/mockFileSystem.js';

var MONACO_VERSION = '0.45.0';
var monacoPromise = null;
var providersRegistered = false;

export function loadMonaco() {
  if (monacoPromise) return monacoPromise;
  var stage = 'loader.js 스크립트 삽입 전';
  var inner = new Promise(function (resolve, reject) {
    if (window.monaco) {
      setupMakeshopLanguage(window.monaco);
      resolve(window.monaco);
      return;
    }
    var loaderUrl = 'https://cdn.jsdelivr.net/npm/monaco-editor@' + MONACO_VERSION + '/min/vs/loader.js';
    var loaderScript = document.createElement('script');
    loaderScript.src = loaderUrl;
    stage = 'loader.js 로드 대기 중 (' + loaderUrl + ')';
    loaderScript.onload = function () {
      stage = 'require.config 이후, editor.main 모듈 로드 대기 중';
      try {
        window.require.config({
          paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@' + MONACO_VERSION + '/min/vs' },
        });
        window.require(['vs/editor/editor.main'], function () {
          stage = 'editor.main 로드 완료';
          setupMakeshopLanguage(window.monaco);
          resolve(window.monaco);
        }, function (err) {
          reject(new Error('vs/editor/editor.main 모듈 로드 실패: ' + String((err && err.message) || err)));
        });
      } catch (err) {
        reject(new Error('require.config/require 실행 중 오류: ' + String((err && err.message) || err)));
      }
    };
    loaderScript.onerror = function () {
      reject(new Error('Monaco 로더 스크립트(' + loaderUrl + ')를 불러오지 못했습니다. (네트워크 또는 CSP 차단 가능성)'));
    };
    document.head.appendChild(loaderScript);
  });

  var timeout = new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error('Monaco 로딩이 10초 내에 끝나지 않았습니다. 마지막 단계: ' + stage));
    }, 10000);
  });

  monacoPromise = Promise.race([inner, timeout]);
  return monacoPromise;
}

function setupMakeshopLanguage(monaco) {
  if (monaco.languages.getLanguages().some(function (l) { return l.id === 'makeshop-html'; })) return;

  monaco.languages.register({ id: 'makeshop-html' });

  monaco.languages.setMonarchTokensProvider('makeshop-html', {
    tokenizer: {
      root: [
        [/<!--\/.*?\/-->/, 'ms-tag'],
        [/<!--/, 'comment', '@comment'],
        [/<\/?[a-zA-Z][\w-]*/, { token: 'tag', next: '@tag' }],
        [/[^<]+/, 'text'],
      ],
      comment: [
        [/-->/, 'comment', '@pop'],
        [/[^-]+/, 'comment'],
        [/./, 'comment'],
      ],
      tag: [
        [/\s+/, ''],
        [/[a-zA-Z-]+(?=\s*=)/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/"([^"]*)"/, 'string'],
        [/'([^']*)'/, 'string'],
        [/\/?>/, { token: 'tag', next: '@pop' }],
      ],
    },
  });

  monaco.editor.defineTheme('makeshop-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'ms-tag', foreground: '9333ea', fontStyle: 'bold' },
      { token: 'tag', foreground: '1d4ed8' },
      { token: 'attribute.name', foreground: 'b45309' },
      { token: 'string', foreground: '15803d' },
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': '#ffffff',
    },
  });
  monaco.editor.setTheme('makeshop-light');
}

// path completion(WORKSPACE) + 메이크샵 태그 completion 을 등록합니다. 앱 시작 시 1회만 호출합니다.
export function registerCompletionProviders(monaco, getWorkspaceTree) {
  if (providersRegistered) return;
  providersRegistered = true;

  monaco.languages.registerCompletionItemProvider('makeshop-html', {
    triggerCharacters: ['/', ' '],
    provideCompletionItems: function (model, position) {
      var line = model.getLineContent(position.lineNumber);
      var textBeforeCursor = line.substring(0, position.column - 1);

      var importMatch = textBeforeCursor.match(/<!--\/import\s+([^\s]*)$/);
      if (importMatch) {
        var typed = importMatch[1];
        var segments = typed.split('/');
        var partial = segments[segments.length - 1];
        var typedPrefix = segments.slice(0, -1);
        var nodes = getWorkspaceTree();
        for (var i = 0; i < typedPrefix.length; i++) {
          var found = nodes.find(function (n) { return n.name === typedPrefix[i]; });
          if (!found || found.type !== 'folder') { nodes = []; break; }
          nodes = found.children;
        }
        var candidates = nodes.filter(function (n) { return n.name.indexOf(partial) === 0; });
        var wordStart = position.column - partial.length;
        return {
          suggestions: candidates.map(function (n) {
            var isFolder = n.type === 'folder';
            return {
              label: n.name + (isFolder ? '/' : ''),
              kind: isFolder ? monaco.languages.CompletionItemKind.Folder : monaco.languages.CompletionItemKind.File,
              detail: isFolder ? 'WORKSPACE 폴더' : 'WORKSPACE 파일',
              insertText: n.name + (isFolder ? '/' : ''),
              command: isFolder ? { id: 'editor.action.triggerSuggest', title: '' } : undefined,
              range: new monaco.Range(position.lineNumber, wordStart, position.lineNumber, position.column),
            };
          }),
        };
      }

      var tagMatch = textBeforeCursor.match(/<!--\/(\w*)$/);
      if (tagMatch) {
        var partial2 = tagMatch[1];
        var wordStart2 = position.column - partial2.length;
        var candidates2 = MAKESHOP_TAGS.filter(function (t) { return t.label.indexOf(partial2) === 0; });
        return {
          suggestions: candidates2.map(function (t) {
            return {
              label: t.label,
              kind: monaco.languages.CompletionItemKind.Property,
              detail: t.detail,
              insertText: t.label + '/-->',
              range: new monaco.Range(position.lineNumber, wordStart2, position.lineNumber, position.column),
            };
          }),
        };
      }

      return { suggestions: [] };
    },
  });
}
