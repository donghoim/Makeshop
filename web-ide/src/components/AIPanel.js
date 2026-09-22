import { html, useState, useRef, useEffect } from '../js/lib.js';
import { useStore } from '../js/store.js';
import { extOf, isHistoryPath, fileNameOf } from '../js/pathUtils.js';
import { generateAiSuggestion, SUGGESTED_PROMPTS } from '../js/mockAi.js';

export function AIPanel() {
  var store = useStore();
  var state = store.state;
  var visible = state.aiPanelVisible;
  var path = state.activeTabPath;
  var historical = path ? isHistoryPath(path) : false;
  var messages = (path && state.aiChats[path]) || [];

  var inputState = useState('');
  var input = inputState[0];
  var setInput = inputState[1];
  var thinkingState = useState(false);
  var thinking = thinkingState[0];
  var setThinking = thinkingState[1];

  var listRef = useRef(null);
  useEffect(function () {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, thinking, visible]);

  if (!visible) return null;

  function close() {
    store.dispatch({ type: 'TOGGLE_AI_PANEL' });
  }

  function send(promptText) {
    var text = (promptText || input).trim();
    if (!text || !path || historical || thinking) return;
    setInput('');
    store.dispatch({
      type: 'AI_ADD_MESSAGE',
      path: path,
      message: { id: 'u' + Date.now(), role: 'user', text: text },
    });
    setThinking(true);
    var ext = extOf(path);
    var content = state.contents[path] || '';
    setTimeout(function () {
      var result = generateAiSuggestion(ext, content, text);
      var aiMessage = {
        id: 'a' + Date.now(),
        role: 'ai',
        text: result.explanation,
        snippet: result.type === 'diff' ? result.snippet : null,
        snippetLabel: result.type === 'diff' ? result.snippetLabel : null,
        nextContent: result.type === 'diff' ? result.nextContent : null,
        status: result.type === 'diff' ? 'pending' : null,
      };
      store.dispatch({ type: 'AI_ADD_MESSAGE', path: path, message: aiMessage });
      setThinking(false);
    }, 900);
  }

  function onSubmit(e) {
    e.preventDefault();
    send();
  }

  function apply(messageId) {
    store.dispatch({ type: 'AI_APPLY_SUGGESTION', path: path, messageId: messageId });
  }
  function dismiss(messageId) {
    store.dispatch({ type: 'AI_DISMISS_SUGGESTION', path: path, messageId: messageId });
  }

  return html`
    <aside class="ai-panel">
      <div class="ai-panel__header">
        <div>
          <p class="ai-panel__title">AI 편집 어시스턴트</p>
          <p class="ai-panel__subtitle">${path ? fileNameOf(path) : '열린 파일 없음'}</p>
        </div>
        <button class="modal-close" onClick=${close}>×</button>
      </div>

      <p class="ai-panel__disclaimer">[프로토타입] 실제 AI API 연동이 아닌 데모용 목업입니다. 정해진 몇 가지 요청만 시범으로 동작해요.</p>

      <div class="ai-panel__list" ref=${listRef}>
        ${!path && html`<p class="ai-panel__empty">왼쪽에서 파일을 먼저 열어주세요.</p>`}
        ${path && historical && html`<p class="ai-panel__empty">히스토리(읽기 전용) 화면에서는 AI 편집을 사용할 수 없어요.</p>`}
        ${path && !historical && messages.length === 0 && html`
          <p class="ai-panel__empty">이 화면에 원하는 수정사항을 말씀해주세요. 예시를 눌러 바로 시도해볼 수 있어요.</p>
        `}
        ${messages.map(function (m) {
          if (m.role === 'user') {
            return html`<div key=${m.id} class="ai-bubble ai-bubble--user">${m.text}</div>`;
          }
          return html`
            <div key=${m.id} class="ai-bubble ai-bubble--ai">
              <p class="ai-bubble__text">${m.text}</p>
              ${m.snippet && html`
                <div class="ai-snippet">
                  <p class="ai-snippet__label">${m.snippetLabel}</p>
                  <pre class="ai-snippet__code">${m.snippet}</pre>
                </div>
              `}
              ${m.status === 'pending' && html`
                <div class="ai-bubble__actions">
                  <button class="btn btn--ghost btn--sm" onClick=${function () { dismiss(m.id); }}>닫기</button>
                  <button class="btn btn--primary btn--sm" onClick=${function () { apply(m.id); }}>적용하기</button>
                </div>
              `}
              ${m.status === 'applied' && html`<span class="ai-status ai-status--applied">✓ 적용됨 · 저장하면 반영돼요</span>`}
              ${m.status === 'dismissed' && html`<span class="ai-status">닫음</span>`}
            </div>
          `;
        })}
        ${thinking && html`
          <div class="ai-bubble ai-bubble--ai ai-bubble--thinking">
            <span class="ai-typing"><span></span><span></span><span></span></span>
            AI가 코드를 분석하고 있어요...
          </div>
        `}
      </div>

      ${path && !historical && html`
        <div class="ai-panel__chips">
          ${SUGGESTED_PROMPTS.map(function (p) {
            return html`<button key=${p} class="ai-chip" onClick=${function () { send(p); }}>${p}</button>`;
          })}
        </div>
      `}

      <form class="ai-panel__input-row" onSubmit=${onSubmit}>
        <input
          class="ai-panel__input"
          type="text"
          placeholder=${path && !historical ? '원하는 수정사항을 입력하세요' : '파일을 먼저 열어주세요'}
          value=${input}
          disabled=${!path || historical}
          onInput=${function (e) { setInput(e.target.value); }}
        />
        <button class="btn btn--primary btn--sm" type="submit" disabled=${!path || historical || !input.trim()}>전송</button>
      </form>
    </aside>
  `;
}
