// Mock File System — SYSTEM(운영 페이지) + WORKSPACE(사용자 작업공간)
// 실제 저장/서버 연동 없이 이 모듈의 데이터만으로 전체 IDE가 동작합니다.

function file(name) {
  const ext = name.split('.').pop();
  return { type: 'file', name, ext };
}

function folder(name, children) {
  return { type: 'folder', name, children };
}

export const fileSystemTree = {
  system: [
    folder('공통', [file('header.html'), file('footer.html')]),
    folder('상품', [
      folder('상품 상세', [file('shopdetail.html'), file('shopdetail.css'), file('shopdetail.js')]),
      folder('상품 분류', [file('shopbrand.html'), file('shopbrand.css'), file('shopbrand.js')]),
    ]),
    folder('주문', [file('order.html')]),
    folder('회원', [file('login.html')]),
    folder('게시판', [file('board.html')]),
  ],
  workspace: [
    folder('임동호', [
      folder('상품 상세페이지', [
        folder('상품 디테일', [file('detail.html'), file('detail.css'), file('detail.js')]),
        folder('상품 이미지', [file('image.html'), file('image.css'), file('image.js')]),
      ]),
    ]),
    folder('components', [
      folder('product-card', [file('index.html'), file('style.css'), file('script.js')]),
    ]),
  ],
};

// key: "SYSTEM/상품/상품 상세/shopdetail.html" 형태의 full path
export const fileContents = {
  'SYSTEM/공통/header.html':
    '<!--/include_header(1)/-->\n' +
    '<header class="ms-header">\n' +
    '  <h1 class="ms-logo"><!--/shop_name/--></h1>\n' +
    '  <nav class="ms-gnb">\n' +
    '    <!--/if_category_list_cate2/-->\n' +
    '    <a href="<!--/category_list_cate2@link/-->"><!--/category_list_cate2@name/--></a>\n' +
    '    <!--/end_if/-->\n' +
    '  </nav>\n' +
    '</header>\n',

  'SYSTEM/공통/footer.html':
    '<footer class="ms-footer">\n' +
    '  <p>Copyright &copy; <!--/shop_name/--> All rights reserved.</p>\n' +
    '</footer>\n',

  'SYSTEM/상품/상품 상세/shopdetail.html':
    '<!--/include_header(1)/-->\n' +
    '<div class="shop-detail">\n' +
    '  <div class="detail-image">\n' +
    '    <img src="<!--/item_image/-->" alt="<!--/item_name/-->" />\n' +
    '  </div>\n' +
    '  <div class="detail-info">\n' +
    '    <h2 class="item-name"><!--/item_name/--></h2>\n' +
    '    <p class="item-price"><!--/item_price/-->원</p>\n' +
    '    <!--/if_item_option/-->\n' +
    '    <select class="item-option"><!--/item_option_list/--></select>\n' +
    '    <!--/end_if/-->\n' +
    '    <button type="button" class="btn-buy">구매하기</button>\n' +
    '  </div>\n' +
    '</div>\n' +
    '<!--/include_footer(1)/-->\n',

  'SYSTEM/상품/상품 상세/shopdetail.css':
    '.shop-detail {\n' +
    '  display: flex;\n' +
    '  gap: 32px;\n' +
    '  padding: 40px;\n' +
    '}\n' +
    '.shop-detail .item-name {\n' +
    '  font-size: 22px;\n' +
    '  font-weight: 700;\n' +
    '}\n' +
    '.shop-detail .item-price {\n' +
    '  font-size: 20px;\n' +
    '  color: #e11d48;\n' +
    '  font-weight: 700;\n' +
    '}\n' +
    '.shop-detail .btn-buy {\n' +
    '  margin-top: 16px;\n' +
    '  padding: 12px 24px;\n' +
    '  background: #111827;\n' +
    '  color: #fff;\n' +
    '  border: none;\n' +
    '  border-radius: 6px;\n' +
    '}\n',

  'SYSTEM/상품/상품 상세/shopdetail.js':
    "document.addEventListener('DOMContentLoaded', function () {\n" +
    "  var buyBtn = document.querySelector('.btn-buy');\n" +
    "  if (!buyBtn) return;\n" +
    "  buyBtn.addEventListener('click', function () {\n" +
    "    console.log('[shopdetail] 구매하기 클릭');\n" +
    '  });\n' +
    '});\n',

  'SYSTEM/상품/상품 분류/shopbrand.html':
    '<!--/include_header(1)/-->\n' +
    '<div class="shop-brand-list">\n' +
    '  <!--/category_list_cate2/-->\n' +
    '  <a class="brand-item" href="<!--/category_list_cate2@link/-->"><!--/category_list_cate2@name/--></a>\n' +
    '  <!--/end_category_list_cate2/-->\n' +
    '</div>\n' +
    '<!--/include_footer(1)/-->\n',

  'SYSTEM/상품/상품 분류/shopbrand.css':
    '.shop-brand-list {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 16px;\n  padding: 24px;\n}\n',

  'SYSTEM/상품/상품 분류/shopbrand.js':
    "console.log('[shopbrand] loaded');\n",

  'SYSTEM/주문/order.html':
    '<!--/include_header(1)/-->\n<div class="order-list"><!--/order_list/--></div>\n<!--/include_footer(1)/-->\n',

  'SYSTEM/회원/login.html':
    '<!--/include_header(1)/-->\n' +
    '<form class="login-form" method="post">\n' +
    '  <input type="text" name="memberid" placeholder="아이디" />\n' +
    '  <input type="password" name="passwd" placeholder="비밀번호" />\n' +
    '  <button type="submit">로그인</button>\n' +
    '</form>\n' +
    '<!--/include_footer(1)/-->\n',

  'SYSTEM/게시판/board.html':
    '<!--/include_header(1)/-->\n<div class="board-list"><!--/board_list/--></div>\n<!--/include_footer(1)/-->\n',

  'WORKSPACE/임동호/상품 상세페이지/상품 디테일/detail.html':
    '<!-- 임동호 작업공간 : 상품 상세페이지 커스텀 영역 -->\n' +
    '<section class="custom-detail">\n' +
    '  <h3 class="custom-detail__title"><!--/item_name/--></h3>\n' +
    '  <div class="custom-detail__badge">오늘출발</div>\n' +
    '</section>\n',

  'WORKSPACE/임동호/상품 상세페이지/상품 디테일/detail.css':
    '.custom-detail {\n  padding: 16px;\n  border: 1px solid #e5e7eb;\n  border-radius: 8px;\n}\n' +
    '.custom-detail__badge {\n  display: inline-block;\n  margin-top: 8px;\n  padding: 4px 10px;\n  background: #fef3c7;\n  color: #92400e;\n  border-radius: 999px;\n  font-size: 12px;\n}\n',

  'WORKSPACE/임동호/상품 상세페이지/상품 디테일/detail.js':
    "console.log('[custom-detail] ready');\n",

  'WORKSPACE/임동호/상품 상세페이지/상품 이미지/image.html':
    '<div class="custom-image-gallery">\n  <img class="thumb" src="/images/sample1.jpg" alt="상품 이미지 1" />\n  <img class="thumb" src="/images/sample2.jpg" alt="상품 이미지 2" />\n</div>\n',

  'WORKSPACE/임동호/상품 상세페이지/상품 이미지/image.css':
    '.custom-image-gallery {\n  display: flex;\n  gap: 8px;\n}\n.custom-image-gallery .thumb {\n  width: 80px;\n  height: 80px;\n  object-fit: cover;\n  border-radius: 4px;\n}\n',

  'WORKSPACE/임동호/상품 상세페이지/상품 이미지/image.js':
    "console.log('[custom-image] ready');\n",

  'WORKSPACE/components/product-card/index.html':
    '<div class="product-card">\n  <img class="product-card__image" src="/images/thumb.jpg" alt="상품 썸네일" />\n  <p class="product-card__name">기본 반팔 티셔츠</p>\n  <p class="product-card__price">19,800원</p>\n</div>\n',

  'WORKSPACE/components/product-card/style.css':
    '.product-card {\n  width: 220px;\n  border-radius: 10px;\n  overflow: hidden;\n  box-shadow: 0 1px 4px rgba(0,0,0,0.08);\n}\n.product-card__name {\n  margin: 8px 12px 0;\n  font-size: 14px;\n}\n.product-card__price {\n  margin: 4px 12px 12px;\n  font-weight: 700;\n}\n',

  'WORKSPACE/components/product-card/script.js':
    "console.log('[product-card] mounted');\n",
};

export const MAKESHOP_TAGS = [
  { label: 'shop_name', detail: '쇼핑몰 이름' },
  { label: 'item_name', detail: '상품명' },
  { label: 'item_price', detail: '상품가격' },
  { label: 'item_image', detail: '상품 대표 이미지' },
  { label: 'item_option', detail: '상품 옵션 여부' },
  { label: 'item_option_list', detail: '상품 옵션 목록' },
  { label: 'category_name', detail: '분류명' },
  { label: 'category_list', detail: '분류 목록' },
  { label: 'category_image', detail: '분류 이미지' },
  { label: 'category_link', detail: '분류 링크' },
  { label: 'category_list_cate2', detail: '2차 분류 목록' },
  { label: 'if_category_list_cate2', detail: '2차 분류 존재 여부 조건문 시작' },
  { label: 'end_if', detail: '조건문 종료' },
  { label: 'include_header', detail: '헤더 include' },
  { label: 'include_footer', detail: '푸터 include' },
  { label: 'order_list', detail: '주문 목록' },
  { label: 'board_list', detail: '게시글 목록' },
  { label: 'member_id', detail: '로그인 회원 아이디' },
  { label: 'member_name', detail: '로그인 회원명' },
  { label: 'if_login', detail: '로그인 여부 조건문 시작' },
];

// 페이지 성격별로 실제 적용 가능한 가상태그만 추려서 보여주기 위한 매핑입니다.
// 파일/폴더 경로에 포함된 키워드로 카테고리를 추정합니다.
function tagsOf() {
  var args = Array.prototype.slice.call(arguments);
  return MAKESHOP_TAGS.filter(function (t) { return args.indexOf(t.label) !== -1; });
}

export function getApplicableTags(path) {
  var p = path.toLowerCase();
  if (p.indexOf('분류') !== -1 || p.indexOf('shopbrand') !== -1) {
    return tagsOf('category_name', 'category_list', 'category_list_cate2', 'category_image', 'category_link', 'if_category_list_cate2', 'end_if');
  }
  if (p.indexOf('주문') !== -1 || p.indexOf('order') !== -1) {
    return tagsOf('order_list');
  }
  if (p.indexOf('회원') !== -1 || p.indexOf('login') !== -1) {
    return tagsOf('member_id', 'member_name', 'if_login', 'end_if');
  }
  if (p.indexOf('게시판') !== -1 || p.indexOf('board') !== -1) {
    return tagsOf('board_list');
  }
  if (p.indexOf('공통') !== -1 || p.indexOf('header') !== -1 || p.indexOf('footer') !== -1) {
    return tagsOf('shop_name', 'include_header', 'include_footer');
  }
  if (p.indexOf('상품') !== -1 || p.indexOf('shopdetail') !== -1 || p.indexOf('detail') !== -1 || p.indexOf('image') !== -1 || p.indexOf('product') !== -1) {
    return tagsOf('item_name', 'item_price', 'item_image', 'item_option', 'item_option_list', 'end_if');
  }
  // components 등 카테고리를 특정하기 어려운 WORKSPACE 파일: 공통 + 상품 태그를 기본 제공
  return tagsOf('shop_name', 'item_name', 'item_price', 'item_image');
}
