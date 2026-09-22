// AI 편집 어시스턴트 — 프로토타입용 Mock 엔진
// 실제 LLM API를 호출하지 않고, 몇 가지 정해진 요청 패턴을 키워드로 인식해
// 그럴듯한 코드 제안(diff)을 생성합니다. (Public 저장소이므로 API 키를 넣지 않기 위한 의도적 설계입니다.)

export var SUGGESTED_PROMPTS = [
  '가격을 더 크고 빨갛게 강조해줘',
  '구매 버튼에 hover 효과 추가해줘',
  '뱃지 추가해줘',
  '이 파일 상단에 설명 주석 추가해줘',
];

function insertAfterFirstLine(content, snippet) {
  var lines = content.split('\n');
  var first = lines.length ? lines[0] : '';
  var rest = lines.slice(1).join('\n');
  return first + '\n' + snippet + (rest ? '\n' + rest : '');
}

function appendToEnd(content, snippet) {
  var trimmed = content.replace(/\s+$/, '');
  return trimmed + '\n\n' + snippet + '\n';
}

var RULES = [
  {
    keywords: ['배지', '뱃지', 'badge'],
    exts: ['html'],
    build: function (content) {
      var snippet = '<!-- AI 추가: 강조 배지 -->\n<span class="ai-badge">NEW</span>';
      return {
        explanation: '요청하신 강조 배지를 파일 상단 쪽에 추가했어요. 위치나 문구를 바꾸고 싶으면 다시 말씀해주세요.',
        snippetLabel: 'html에 추가되는 코드',
        snippet: snippet,
        nextContent: insertAfterFirstLine(content, snippet),
      };
    },
  },
  {
    keywords: ['가격', 'price'],
    needsAlso: ['빨간', '강조', '크게', 'red', 'bold'],
    exts: ['css'],
    build: function (content) {
      var snippet = '/* AI 추가: 가격 강조 스타일 */\n.item-price {\n  color: #dc2626 !important;\n  font-size: 26px !important;\n  font-weight: 800 !important;\n}';
      return {
        explanation: '가격 텍스트(.item-price)를 더 크고 빨갛게 강조하는 스타일을 파일 끝에 추가했어요.',
        snippetLabel: 'css에 추가되는 코드',
        snippet: snippet,
        nextContent: appendToEnd(content, snippet),
      };
    },
  },
  {
    keywords: ['버튼', 'button', '구매'],
    needsAlso: ['hover', '스타일', '강조', '효과'],
    exts: ['css'],
    build: function (content) {
      var snippet = '/* AI 추가: 구매 버튼 hover 효과 */\n.btn-buy:hover {\n  background: #000;\n  transform: translateY(-1px);\n  transition: all .15s ease;\n}';
      return {
        explanation: '구매 버튼(.btn-buy)에 마우스를 올리면 살짝 떠오르는 hover 효과를 추가했어요.',
        snippetLabel: 'css에 추가되는 코드',
        snippet: snippet,
        nextContent: appendToEnd(content, snippet),
      };
    },
  },
  {
    keywords: ['주석', '설명', 'comment'],
    exts: ['js'],
    build: function (content) {
      var snippet = '// AI 추가: 이 파일 개요\n// TODO: 실제 설명으로 교체해주세요.\n';
      return {
        explanation: '파일 맨 위에 설명용 주석 블록을 추가했어요. 내용을 채워서 사용해보세요.',
        snippetLabel: 'js 상단에 추가되는 코드',
        snippet: snippet,
        nextContent: snippet + '\n' + content,
      };
    },
  },
];

function matchesRule(rule, promptLower) {
  var hasKeyword = rule.keywords.some(function (k) { return promptLower.indexOf(k.toLowerCase()) !== -1; });
  if (!hasKeyword) return false;
  if (rule.needsAlso) {
    return rule.needsAlso.some(function (k) { return promptLower.indexOf(k.toLowerCase()) !== -1; });
  }
  return true;
}

// path, content, ext, promptText 를 받아 { type: 'diff'|'text', explanation, ... } 반환
export function generateAiSuggestion(ext, content, promptText) {
  var promptLower = (promptText || '').toLowerCase();

  for (var i = 0; i < RULES.length; i++) {
    var rule = RULES[i];
    if (!matchesRule(rule, promptLower)) continue;

    if (rule.exts.indexOf(ext) === -1) {
      return {
        type: 'text',
        explanation: '이 요청은 .' + rule.exts.join('/.') + ' 파일에 어울려요. 해당 파일을 열고 다시 요청해보시겠어요?',
      };
    }
    var result = rule.build(content);
    return Object.assign({ type: 'diff' }, result);
  }

  return {
    type: 'text',
    explanation: '이 프로토타입은 다음과 같은 요청만 데모로 지원해요:\n' +
      SUGGESTED_PROMPTS.map(function (p) { return '· ' + p; }).join('\n') +
      '\n다른 요청은 실제 서비스에서 지원할 예정입니다.',
  };
}
