import { html } from '../js/lib.js';
import { useStore } from '../js/store.js';

export function PreviewPanel() {
  var store = useStore();
  if (!store.state.previewVisible) return null;

  function close() {
    store.dispatch({ type: 'TOGGLE_PREVIEW' });
  }

  return html`
    <div class="modal-overlay" onClick=${close}>
      <div class="preview-panel" onClick=${function (e) { e.stopPropagation(); }}>
        <div class="preview-panel__header">
          <div>
            <p class="preview-panel__title">미리보기</p>
            <p class="preview-panel__subtitle">SYSTEM › 상품 › 상품 상세 › shopdetail.html (Mock)</p>
          </div>
          <button class="modal-close" onClick=${close}>×</button>
        </div>
        <div class="preview-panel__body">
          <div class="mock-shop-detail">
            <div class="mock-shop-detail__image">
              <span>상품 이미지</span>
            </div>
            <div class="mock-shop-detail__info">
              <p class="mock-shop-detail__badge">오늘출발</p>
              <h2 class="mock-shop-detail__name">프리미엄 코튼 오버핏 셔츠</h2>
              <p class="mock-shop-detail__price">42,900원</p>
              <div class="mock-shop-detail__option">
                <label>옵션</label>
                <select>
                  <option>화이트 / M</option>
                  <option>화이트 / L</option>
                  <option>블랙 / M</option>
                </select>
              </div>
              <div class="mock-shop-detail__qty">
                <label>수량</label>
                <input type="number" value="1" min="1" />
              </div>
              <button class="mock-shop-detail__buy">구매하기</button>
              <p class="preview-panel__hint">※ 실제 쇼핑몰 렌더링이 아닌 Mock Preview 화면입니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
