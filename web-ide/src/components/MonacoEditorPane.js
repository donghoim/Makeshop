import { html, useEffect, useRef, useState } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { loadMonaco, registerCompletionProviders } from '../js/monacoLoader.js';
import { languageForExt } from '../js/pathUtils.js';

export function MonacoEditorPane(props) {
  var store = useStore();
  var state = store.state;
  var containerRef = useRef(null);
  var editorRef = useRef(null);
  var monacoRef = useRef(null);
  var modelsRef = useRef({});
  var stateRef = useRef(state);
  var dispatchRef = useRef(store.dispatch);
  var onCursorChangeRef = useRef(props.onCursorChange);
  var errorState = useState(null);
  var loadError = errorState[0];
  var setLoadError = errorState[1];

  stateRef.current = state;
  dispatchRef.current = store.dispatch;
  onCursorChangeRef.current = props.onCursorChange;

  // 1) Monaco 인스턴스 최초 1회 생성
  useEffect(function () {
    var disposed = false;
    loadMonaco().then(function (monaco) {
      if (disposed) return;
      try {
        monacoRef.current = monaco;
        registerCompletionProviders(monaco, function () { return stateRef.current.tree.workspace; });

        var editor = monaco.editor.create(containerRef.current, {
          value: '',
          language: 'plaintext',
          theme: 'makeshop-light',
          automaticLayout: true,
          fontSize: 13,
          minimap: { enabled: true },
          wordWrap: 'off',
          scrollBeyondLastLine: false,
          tabSize: 2,
        });
        editorRef.current = editor;

        editor.onDidChangeCursorPosition(function (e) {
          if (onCursorChangeRef.current) {
            onCursorChangeRef.current({ line: e.position.lineNumber, column: e.position.column });
          }
        });

        // Ctrl+S / Ctrl+P 는 App.js 의 전역 keydown 리스너에서 일괄 처리합니다
        // (Explorer 등 에디터 밖에 포커스가 있을 때도 동일하게 동작해야 하므로).

        syncActiveModel();
      } catch (err) {
        setLoadError(String((err && err.message) || err));
      }
    }).catch(function (err) {
      if (disposed) return;
      setLoadError(String((err && err.message) || err));
    });
    return function () {
      disposed = true;
      if (editorRef.current) editorRef.current.dispose();
      Object.keys(modelsRef.current).forEach(function (p) { modelsRef.current[p].dispose(); });
    };
  }, []);

  function getOrCreateModel(monaco, path) {
    if (modelsRef.current[path]) return modelsRef.current[path];
    var ext = path.split('.').pop();
    var content = stateRef.current.contents[path] || '';
    var uri = monaco.Uri.parse('inmemory://makeshop-ide/' + encodeURIComponent(path));
    var model = monaco.editor.createModel(content, languageForExt(ext), uri);
    model.onDidChangeContent(function () {
      var latestActive = stateRef.current.activeTabPath;
      if (latestActive !== path) return;
      var value = model.getValue();
      if (value !== stateRef.current.contents[path]) {
        dispatchRef.current({ type: 'UPDATE_CONTENT', path: path, value: value });
      }
    });
    modelsRef.current[path] = model;
    return model;
  }

  function syncActiveModel() {
    var monaco = monacoRef.current;
    var editor = editorRef.current;
    if (!monaco || !editor) return;
    var activePath = stateRef.current.activeTabPath;
    if (!activePath) {
      editor.setModel(null);
      return;
    }
    var model = getOrCreateModel(monaco, activePath);
    if (editor.getModel() !== model) {
      editor.setModel(model);
    }
    var pos = editor.getPosition();
    if (onCursorChangeRef.current && pos) {
      onCursorChangeRef.current({ line: pos.lineNumber, column: pos.column });
    }
    editor.focus();
  }

  // 2) activeTabPath 변경 시 모델 전환
  useEffect(function () {
    syncActiveModel();
  }, [state.activeTabPath]);

  // 3) 외부 요인(저장 취소/삭제/이름변경)으로 contents 가 모델과 달라졌으면 모델 값 동기화
  useEffect(function () {
    var monaco = monacoRef.current;
    if (!monaco) return;
    var activePath = state.activeTabPath;
    if (!activePath) return;
    var model = modelsRef.current[activePath];
    if (model && model.getValue() !== state.contents[activePath]) {
      model.setValue(state.contents[activePath] || '');
    }
  }, [state.contents[state.activeTabPath]]);

  // 4) 닫힌 탭의 모델 정리(rename 시 경로가 바뀐 옛 모델도 함께 정리됨)
  useEffect(function () {
    var openSet = {};
    state.openTabs.forEach(function (p) { openSet[p] = true; });
    Object.keys(modelsRef.current).forEach(function (p) {
      if (!openSet[p]) {
        modelsRef.current[p].dispose();
        delete modelsRef.current[p];
      }
    });
  }, [state.openTabs.join('|')]);

  return html`
    <div class="monaco-pane" ref=${containerRef}>
      ${loadError && html`
        <div class="monaco-pane__error">
          <p class="monaco-pane__error-title">에디터를 불러오지 못했습니다</p>
          <p class="monaco-pane__error-detail">${loadError}</p>
        </div>
      `}
    </div>
  `;
}
