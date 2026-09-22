/* ==========================================================================
   Meta 인증 팝업(Embedded Signup) 시뮬레이션
   — 0단계(메이크샵 개인정보 동의 모달) 다음에 열리는, 실제 Meta OAuth 팝업을
     최대한 유사하게 재현한 시뮬레이션. Meta가 소유·제공하는 화면이므로
     실제 서비스에서는 이 팝업이 Meta 도메인에서 그대로 렌더링된다.
   — 참고: 11_Reference/3-4. FBE 자산 연동(추정).png (전 구간 실 화면 캡처)
   ========================================================================== */

const FbeOAuth = (function () {
  const APP_ID = "2166377357431297"; // 프로토타입 표기용 mock app id

  function overlayRoot() {
    let el = document.getElementById("fbwin-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "fbwin-root";
      document.body.appendChild(el);
    }
    return el;
  }

  function close() {
    const root = overlayRoot();
    root.innerHTML = "";
    if (typeof SidePanel !== "undefined") SidePanel.clearOverride();
  }

  function fLogoSvg(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="#1877F2"/><path d="M25 18.06C25 13.6 21.42 10 17 10s-8 3.6-8 8.06c0 4.02 2.93 7.35 6.75 7.94v-5.61h-2.03v-2.33h2.03v-1.78c0-2.01 1.2-3.13 3.02-3.13.87 0 1.79.16 1.79.16v1.97h-1.01c-.99 0-1.3.62-1.3 1.25v1.5h2.22l-.36 2.33h-1.86v5.61C22.07 25.4 25 22.08 25 18.06Z" fill="#fff"/></svg>`;
  }

  /* ---------------- shared chrome renderer ---------------- */
  function paintChrome(root, step, ctx) {
    root.innerHTML = `
      <div class="fbwin-overlay">
        <div class="fbwin" role="dialog" aria-modal="true">
          <div class="fbwin__titlebar">
            <span class="fbwin__favicon">f</span>
            <span class="fbwin__titletext">${step.winTitle}</span>
            <span class="fbwin__winctrl"><span>&#8211;</span><span>&#9633;</span><span data-act="close">&#10005;</span></span>
          </div>
          <div class="fbwin__addressbar">
            <span class="lock">&#128274;</span>
            <span class="url">facebook.com${step.url}</span>
          </div>
          <div class="fbwin__progress"><i style="width:${Math.round((ctx.stepIndex / (ctx.totalSteps - 1)) * 100)}%"></i></div>
          <div class="fbwin__body" id="fbwin-body"></div>
          <div id="fbwin-footzone"></div>
        </div>
      </div>
    `;
    root.querySelector('[data-act="close"]').addEventListener("click", () => ctx.cancel());
    return root.querySelector("#fbwin-body");
  }

  function renderNavFoot(zone, { onCancel, onBack, onNext, nextLabel, nextEnabled, hideCancel, hideBack }) {
    zone.innerHTML = `
      <div class="fbwin__navfoot">
        <div>${hideCancel ? "" : `<button class="fb-mini-btn" data-nav="cancel">취소</button>`}</div>
        <div class="fbwin__navfoot-right">
          ${hideBack ? "" : `<button class="fb-mini-btn" data-nav="back">돌아가기</button>`}
          <button class="fb-mini-btn fb-mini-btn--primary" data-nav="next" ${nextEnabled ? "" : "disabled"}>${nextLabel || "다음"}</button>
        </div>
      </div>
    `;
    if (!hideCancel) zone.querySelector('[data-nav="cancel"]').addEventListener("click", onCancel);
    if (!hideBack) zone.querySelector('[data-nav="back"]').addEventListener("click", onBack);
    zone.querySelector('[data-nav="next"]').addEventListener("click", () => {
      if (zone.querySelector('[data-nav="next"]').disabled) return;
      onNext();
    });
  }

  function radioList(container, items, selectedId, onChange) {
    container.innerHTML = `<div class="fblist">${items
      .map(
        (it) => `
      <div class="fbrow ${it.id === selectedId ? "is-selected" : ""} ${it.disabled ? "is-disabled" : ""}" data-id="${it.id}">
        <div class="fbrow__icon ${it.round ? "fbrow__icon--circle" : ""}">${it.icon || ""}</div>
        <div class="fbrow__body">
          <div class="fbrow__name">${it.name}</div>
          ${it.desc ? `<div class="fbrow__desc">${it.desc}</div>` : ""}
        </div>
        <div class="fbrow__radio"></div>
      </div>`
      )
      .join("")}</div>`;
    container.querySelectorAll(".fbrow").forEach((row) => {
      if (row.classList.contains("is-disabled")) return;
      row.addEventListener("click", () => onChange(row.getAttribute("data-id")));
    });
  }

  /* ---------------- step definitions ---------------- */
  function buildSteps(sel) {
    return [
      /* 1: LOGIN */
      {
        winTitle: "Facebook - Chrome",
        url: "/login.php?skip_api_login=1&api_key=" + APP_ID,
        sideTitle: "Facebook 로그인",
        sideDesc: `
          <p>Meta(Facebook) 계정으로 로그인하는 화면입니다.</p>
          <p>이 화면은 Meta가 제공하는 화면이며, 메이크샵은 화면 구성이나 진행 순서를 임의로 바꿀 수 없습니다.</p>
          <p>로그인 정보가 확인되어야 다음 단계인 권한 동의 화면으로 넘어갈 수 있습니다.</p>
        `,
        custom: true,
        render(body, ctx) {
          body.innerHTML = `
            <div class="fbwin__brand">${fLogoSvg(56)}</div>
            <div style="margin-bottom:18px;">
              <input class="fbfield" id="fb-email" type="text" placeholder="이메일 또는 휴대폰 번호" value="${sel.email}"/>
              <input class="fbfield" id="fb-pw" type="password" placeholder="비밀번호" value="${sel.password || ""}"/>
              <button class="fbbtn fbbtn--primary" id="fb-login-btn">로그인</button>
              <a class="fbbtn--link">비밀번호를 잊으셨나요?</a>
              <hr class="fbdivider"/>
              <button class="fbbtn fbbtn--outline" id="fb-newacct-btn">새 계정 만들기</button>
            </div>
          `;
          const email = body.querySelector("#fb-email");
          const pw = body.querySelector("#fb-pw");
          const btn = body.querySelector("#fb-login-btn");
          function sync() {
            btn.disabled = !(email.value.trim() && pw.value.trim());
          }
          email.addEventListener("input", sync);
          pw.addEventListener("input", sync);
          sync();
          btn.addEventListener("click", () => {
            if (!(email.value.trim() && pw.value.trim())) return;
            sel.email = email.value.trim();
            sel.password = pw.value;
            ctx.next();
          });
          body.querySelector("#fb-newacct-btn").addEventListener("click", () =>
            UI.toast("프로토타입에서는 신규 Facebook 계정 생성을 시뮬레이션하지 않습니다.", "success")
          );
        },
        footStyle: "meta",
      },

      /* 2: OAUTH CONSENT */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "권한 동의",
        sideDesc: `
          <p>로그인한 Meta 계정으로 메이크샵 앱 연동을 진행할지 확인하는 동의 화면입니다.</p>
          <p>여기서 동의하면 이름과 프로필 사진 등 기본 정보가 메이크샵 앱에 전달됩니다.</p>
          <p>사용자의 별도 승인 없이는 메이크샵 앱이 Facebook에 게시물을 올릴 수 없습니다.</p>
        `,
        custom: true,
        render(body, ctx) {
          body.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; gap:14px; margin-bottom:18px;">
              <span style="font-size:26px;">&#8734;</span>
              <span style="font-size:18px; color:#ccd0d5;">&#8644;</span>
              <span style="width:44px;height:44px;border-radius:10px;background:#2952e3;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;">M</span>
            </div>
            <h2 class="fbwin__title">${sel.displayName}님으로 계속하시겠어요?</h2>
            <p class="fbwin__sub">MakeShop 앱에 회원님의 이름과 프로필 사진이 전송됩니다. 그러나 회원님의 승인 없이 MakeShop 앱이 Facebook에 게시할 수는 없습니다.</p>
            <a class="fbbtn--link" style="margin-top:-6px;">이 공유에 대해 자세히 알아보고 제공 설정을 상세히 살펴보세요.</a>
            <div style="display:flex; gap:10px; margin-top:16px;">
              <button class="fbbtn fbbtn--outline" id="fb-consent-cancel" style="flex:1;">취소</button>
              <button class="fbbtn fbbtn--primary" id="fb-consent-ok" style="flex:1.4;">${sel.displayName}님으로 계속</button>
            </div>
          `;
          body.querySelector("#fb-consent-cancel").addEventListener("click", () => ctx.cancel());
          body.querySelector("#fb-consent-ok").addEventListener("click", () => ctx.next());
        },
        footStyle: "links",
      },

      /* 3: SHOP START */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "Shop 시작",
        sideDesc: `
          <p>Meta Shop과 Facebook 광고 기능을 함께 시작할지 확인하는 화면입니다.</p>
          <p>Shop을 사용하면 Instagram 프로필, Facebook 페이지, 태그된 게시물에서 상품을 노출할 수 있습니다.</p>
          <p>Facebook 광고를 함께 선택하면 광고 계정과 픽셀 생성까지 이어서 진행됩니다.</p>
        `,
        custom: true,
        render(body, ctx) {
          body.innerHTML = `
            <div class="fbwin__brand"><span style="font-size:40px;">&#128717;</span></div>
            <h2 class="fbwin__title">Shop을 시작해보세요</h2>
            <div class="fbrow">
              <div class="fbrow__checkbox">&#10003;</div>
              <div class="fbrow__body">
                <div class="fbrow__name">Shop</div>
                <div class="fbrow__desc">사람들이 회원님의 Instagram 프로필, Facebook 페이지, 태그된 게시물에서 제품을 볼 수 있습니다</div>
              </div>
            </div>
            <div class="fbrow">
              <div class="fbrow__checkbox">&#10003;</div>
              <div class="fbrow__body">
                <div class="fbrow__name">Facebook 광고</div>
                <div class="fbrow__desc">광고 계정 및 픽셀을 만들어 Facebook과 Instagram에서 비즈니스의 광고를 빠르게 게재해보세요</div>
              </div>
            </div>
            <p class="fbwin__sub" style="text-align:left; margin-top:14px;">비즈니스 앱은 회원님의 비즈니스와 연결되는 타사 통합 서비스로, Meta에서 회원님의 비즈니스와의 지속적인 연결을 유지합니다. Facebook에서 회원님의 비즈니스 이름과 도메인을 받습니다.</p>
            <div style="display:flex; gap:10px; margin-top:16px;">
              <button class="fbbtn fbbtn--outline" id="fb-shop-cancel" style="flex:1;">취소</button>
              <button class="fbbtn fbbtn--primary" id="fb-shop-ok" style="flex:1;">시작하기</button>
            </div>
          `;
          body.querySelector("#fb-shop-cancel").addEventListener("click", () => ctx.cancel());
          body.querySelector("#fb-shop-ok").addEventListener("click", () => ctx.next());
        },
        footStyle: "links",
      },

      /* 4: BUSINESS PORTFOLIO */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "비즈니스 포트폴리오 선택",
        sideDesc: `
          <p>Facebook 페이지, 픽셀, 카탈로그 등 비즈니스 자산을 관리할 계정(비즈니스 포트폴리오)을 선택하는 화면입니다.</p>
          <p>이후 만들거나 연결하는 모든 자산은 여기서 선택한 포트폴리오의 소유가 됩니다.</p>
          <p>새 포트폴리오가 필요하면 이 화면에서 바로 새로 만들 수도 있습니다.</p>
        `,
        render(body, ctx) {
          body.innerHTML = `
            <h2 class="fbstep-head">비즈니스 포트폴리오 선택</h2>
            <p class="fbstep-desc">Facebook 페이지, 픽셀 및 카탈로그 등의 비즈니스 자산을 관리하는 계정을 선택하세요. 만들거나 연결한 자산은 이 포트폴리오의 소유가 됩니다.</p>
            <a class="fbnewlink">새로 만들기</a>
            <div id="fb-list"></div>
          `;
          const items = [
            { id: "personal", name: sel.displayName, desc: "개인 계정" },
            { id: "biz", name: sel.portfolio, desc: "비즈니스 포트폴리오" },
          ];
          const list = body.querySelector("#fb-list");
          function paint() {
            radioList(list, items, sel.portfolioChoice, (id) => {
              sel.portfolioChoice = id;
              paint();
              ctx.setNextEnabled(true);
            });
          }
          paint();
          ctx.setNextEnabled(!!sel.portfolioChoice);
        },
        footStyle: "nav",
      },

      /* 5: FACEBOOK PAGE */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "Facebook 페이지 연결",
        sideDesc: `
          <p>메이크샵 쇼핑몰에 연결할 Facebook 페이지를 선택하는 화면입니다.</p>
          <p>선택한 페이지에 쇼핑몰 상품이 표시되어 고객이 페이지에서 바로 상품을 확인할 수 있습니다.</p>
          <p>연결할 페이지가 없다면 이 화면에서 새로 만들 수 있습니다.</p>
        `,
        render(body, ctx) {
          body.innerHTML = `
            <h2 class="fbstep-head">Facebook 페이지 연결</h2>
            <p class="fbstep-desc">MakeShop에 연결할 Facebook 페이지를 선택하세요. 페이지에 제품을 표시할 수 있습니다.</p>
            <a class="fbnewlink">새로 만들기</a>
            <div id="fb-list"></div>
          `;
          const items = [{ id: "page1", name: sel.page, desc: "팔로워 0명" }];
          const list = body.querySelector("#fb-list");
          function paint() {
            radioList(list, items, sel.pageChoice, (id) => {
              sel.pageChoice = id;
              paint();
              ctx.setNextEnabled(true);
            });
          }
          paint();
          ctx.setNextEnabled(!!sel.pageChoice);
        },
        footStyle: "nav",
      },

      /* 6: INSTAGRAM */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "Instagram 연결",
        sideDesc: `
          <p>Instagram 비즈니스 프로필을 연결할지 선택하는 화면입니다.</p>
          <p>연결하면 사람들이 Instagram에서도 쇼핑몰 상품을 발견하고 구매할 수 있게 됩니다.</p>
          <p>연결 가능한 계정이 없다면 이 단계를 건너뛸 수 있습니다.</p>
        `,
        render(body, ctx) {
          body.innerHTML = `
            <h2 class="fbstep-head">Instagram 연결</h2>
            <p class="fbstep-desc">사람들이 제품을 발견하고 구매할 수 있는 Instagram 비즈니스 프로필을 선택하세요.</p>
            <div id="fb-list"></div>
          `;
          const items = [
            { id: "skip", name: "Skip connecting to Instagram", desc: "사용할 수 있는 Instagram 계정이 없는 경우 선택하세요" },
            { id: "ig1", name: sel.displayName + `(@${sel.instagramHandle})`, desc: "쇼핑 사용 가능" },
          ];
          const list = body.querySelector("#fb-list");
          function paint() {
            radioList(list, items, sel.igChoice, (id) => {
              sel.igChoice = id;
              paint();
              ctx.setNextEnabled(true);
            });
          }
          paint();
          ctx.setNextEnabled(!!sel.igChoice);
        },
        footStyle: "nav",
      },

      /* 7: CATALOG */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "카탈로그 선택",
        sideDesc: `
          <p>상품 정보를 관리할 카탈로그를 선택하는 화면입니다.</p>
          <p>카탈로그에는 상품명, 가격, 이미지 등 상품 피드에 반영되는 정보가 담깁니다.</p>
          <p>이 화면에서 선택한 카탈로그를 기준으로 이후 상품 피드 탭이 동작합니다.</p>
        `,
        render(body, ctx) {
          body.innerHTML = `
            <h2 class="fbstep-head">카탈로그 선택</h2>
            <p class="fbstep-desc">카탈로그를 선택하여 인벤토리를 관리하고 제품이 표시된 광고를 게재해보세요.</p>
            <a class="fbnewlink">새로 만들기</a>
            <div id="fb-list"></div>
          `;
          const items = [{ id: "cat1", name: sel.catalog, desc: "카탈로그 #: 876358981474814" }];
          const list = body.querySelector("#fb-list");
          function paint() {
            radioList(list, items, sel.catalogChoice, (id) => {
              sel.catalogChoice = id;
              paint();
              ctx.setNextEnabled(true);
            });
          }
          paint();
          ctx.setNextEnabled(!!sel.catalogChoice);
        },
        footStyle: "nav",
      },

      /* 8: AD ACCOUNT */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "광고 계정 선택",
        sideDesc: `
          <p>광고를 집행할 Meta 광고 계정을 선택하는 화면입니다.</p>
          <p>개인 계정이나 연결되지 않은 포트폴리오는 대상에서 제외되어 선택할 수 없습니다.</p>
          <p>여기서 선택한 광고 계정이 이후 광고 관리 탭에 표시됩니다.</p>
        `,
        render(body, ctx) {
          body.innerHTML = `
            <h2 class="fbstep-head">광고 계정 선택</h2>
            <p class="fbstep-desc">제품 또는 서비스 광고를 게재할 비즈니스의 광고 계정을 선택하세요.</p>
            <a class="fbnewlink">새로 만들기</a>
            <div id="fb-list"></div>
          `;
          const items = [
            { id: "personal", name: sel.displayName, desc: "대상 아님", disabled: true },
            { id: "biz", name: sel.portfolio, desc: "대상 아님", disabled: true },
            { id: "ad1", name: sel.adAccount, desc: "계정 번호: " + sel.adAccountId },
          ];
          const list = body.querySelector("#fb-list");
          function paint() {
            radioList(list, items, sel.adAccountChoice, (id) => {
              sel.adAccountChoice = id;
              paint();
              ctx.setNextEnabled(true);
            });
          }
          paint();
          ctx.setNextEnabled(!!sel.adAccountChoice);
        },
        footStyle: "nav",
      },

      /* 9: PIXEL */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "Meta 픽셀 선택",
        sideDesc: `
          <p>웹사이트 방문자의 행동을 추적할 Meta 픽셀을 선택하는 화면입니다.</p>
          <p>픽셀 데이터를 활용하면 광고 성과 측정과 타겟팅 정확도를 높일 수 있습니다.</p>
          <p>새 픽셀이 필요한 경우 이 화면에서 바로 생성할 수 있습니다.</p>
        `,
        render(body, ctx) {
          body.innerHTML = `
            <h2 class="fbstep-head">Meta 픽셀 선택</h2>
            <p class="fbstep-desc">픽셀 데이터를 활용하여 웹사이트에서 발생한 활동을 파악하고 광고 결과를 측정해보세요.</p>
            <a class="fbnewlink">새로 만들기</a>
            <div id="fb-list"></div>
          `;
          const items = [{ id: "pixel1", name: sel.pixel, desc: "ID: " + sel.pixelId }];
          const list = body.querySelector("#fb-list");
          function paint() {
            radioList(list, items, sel.pixelChoice, (id) => {
              sel.pixelChoice = id;
              paint();
              ctx.setNextEnabled(true);
            });
          }
          paint();
          ctx.setNextEnabled(!!sel.pixelChoice);
        },
        footStyle: "nav",
      },

      /* 10: COMMERCE ACCOUNT */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "커머스 계정 확인",
        sideDesc: `
          <p>선택한 페이지에 연결된 커머스(상거래) 계정을 함께 연동할지 확인하는 화면입니다.</p>
          <p>커머스 계정은 Shops 기능과 결제·주문 관련 정보를 관리하는 데 사용됩니다.</p>
          <p>확인을 누르면 화면에 표시된 커머스 계정 그대로 연결이 진행됩니다.</p>
        `,
        render(body, ctx) {
          body.innerHTML = `
            <h2 class="fbstep-head">커머스 계정 확인</h2>
            <p class="fbstep-desc">선택된 페이지는 아래 상거래 계정에 연결되어 있습니다. 이 상거래 계정을 연결할지 확인해주세요.</p>
            <div id="fb-list"></div>
          `;
          const items = [{ id: "commerce1", name: sel.commerce, desc: "2067673590710840", round: true }];
          const list = body.querySelector("#fb-list");
          function paint() {
            radioList(list, items, sel.commerceChoice, (id) => {
              sel.commerceChoice = id;
              paint();
              ctx.setNextEnabled(true);
            });
          }
          paint();
          ctx.setNextEnabled(!!sel.commerceChoice);
        },
        footStyle: "nav",
      },

      /* 11: SETTINGS REVIEW */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "설정 확인",
        sideDesc: `
          <p>지금까지 선택한 비즈니스 포트폴리오, 페이지, Instagram, 카탈로그, 광고 계정, 커머스 계정, 픽셀 정보를 최종 확인하는 화면입니다.</p>
          <p>각 항목을 눌러 세부 설정을 다시 확인할 수 있습니다.</p>
          <p>'계속'을 클릭하면 Meta 이용약관에 동의한 것으로 처리되어 다음 단계로 진행됩니다.</p>
        `,
        custom: true,
        render(body, ctx) {
          const rows = [
            ["비즈니스 포트폴리오", sel.portfolio],
            ["Facebook 페이지", sel.page],
            ["Instagram 프로필", sel.igChoice === "skip" ? "연결 안 함" : "@" + sel.instagramHandle],
            ["카탈로그", sel.catalog],
            ["광고 계정", sel.adAccount],
            ["커머스 계정", sel.commerce],
            ["Meta 픽셀", sel.pixel],
          ];
          body.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; gap:14px; margin-bottom:14px;">
              <span style="width:36px;height:36px;border-radius:8px;background:#2952e3;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;">M</span>
              <span style="font-size:16px; color:#ccd0d5;">&#8594;</span>
              <span style="width:36px;height:36px;border-radius:50%;background:#e4e6eb;display:flex;align-items:center;justify-content:center;">&#128100;</span>
            </div>
            <h2 class="fbwin__title" style="font-size:15px;">설정 확인</h2>
            <p class="fbwin__sub" style="margin-top:-8px;">MakeShop이(가) 다음에 연결됩니다.</p>
            <div style="max-height:230px; overflow:auto; border-top:1px solid #f0f2f5;">
              ${rows.map(([k, v]) => `<div class="fbsummary-row"><span class="k">${k}</span><span class="v">${v} <span class="chev">&#8250;</span></span></div>`).join("")}
            </div>
            <p class="fbwin__sub" style="text-align:left; margin-top:12px;">이 비즈니스 앱은 회원님이 공유하도록 선택한 정보에 액세스하고 비즈니스 자산에 관한 기능을 관리할 수 있습니다. '계속'을 클릭하면 이용 약관에 동의하게 됩니다.</p>
            <div style="display:flex; gap:10px; margin-top:10px;">
              <button class="fbbtn fbbtn--outline" id="fb-review-cancel" style="flex:1;">취소</button>
              <button class="fbbtn fbbtn--primary" id="fb-review-ok" style="flex:1;">계속</button>
            </div>
          `;
          body.querySelector("#fb-review-cancel").addEventListener("click", () => ctx.cancel());
          body.querySelector("#fb-review-ok").addEventListener("click", () => ctx.next());
        },
        footStyle: "links",
      },

      /* 12: PERMISSIONS */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "권한 확인",
        sideDesc: `
          <p>메이크샵 앱에 어떤 권한이 허용되었는지 확인하는 화면입니다.</p>
          <p>이메일 수신, 카탈로그 관리, 비즈니스 확장 기능 관리, 광고 계정 관리 등의 권한 목록이 표시됩니다.</p>
          <p>권한을 임의로 해제하면 메이크샵 앱의 일부 기능이 정상적으로 동작하지 않을 수 있습니다.</p>
        `,
        render(body, ctx) {
          const perms = [
            ["&#9993;", "이메일 주소 정보 수신", sel.email],
            ["&#128230;", "제품 카탈로그 관리", sel.catalog],
            ["&#9881;", "비즈니스 확장 기능 관리", "추가 비즈니스 관리 확장 인터페이스 트리거"],
            ["&#128200;", "액세스 권한이 있는 광고 계정의 광고 관리", sel.adAccount],
          ];
          body.innerHTML = `
            <h2 class="fbstep-head">MakeShop 앱에 어떤 권한이 허용되었나요?</h2>
            <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:6px; padding:10px 12px; font-size:11px; color:#9a3412; margin-bottom:10px;">
              이 옵션을 해제하면 MakeShop 앱이 제대로 작동하지 않을 수 있습니다.
            </div>
            <div id="fb-perm-list">
              ${perms
                .map(
                  ([ico, name, desc]) => `
                <div class="fbperm-row"><span class="ico">${ico}</span><div><div style="font-weight:600;">${name}</div><div style="color:#8a8d91;">${desc}</div></div></div>`
                )
                .join("")}
            </div>
          `;
          ctx.setNextEnabled(true);
        },
        footStyle: "nav",
      },

      /* 13: COMMERCE SETUP COMPLETE */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "커머스 계정 설정 완료",
        sideDesc: `
          <p>Facebook 커머스 계정 연결을 마무리하는 화면입니다.</p>
          <p>자산이 아직 커머스 계정에 연결되어 있지 않다면 이 단계에서 새 커머스 계정이 자동으로 생성됩니다.</p>
          <p>Shops 기능을 사용하려면 커머스 제품 판매자 계약에 동의해야 합니다.</p>
        `,
        custom: true,
        render(body, ctx) {
          body.innerHTML = `
            <div class="fbwin__illust">&#128717;</div>
            <h2 class="fbwin__title" style="font-size:16px;">커머스 계정 설정 완료</h2>
            <p class="fbwin__sub">Facebook에 대한 커머스 계정 연결을 완료하세요. 자산이 아직 커머스 계정에 연결되지 않은 경우 새 커머스 계정이 생성됩니다.</p>
            <p class="fbwin__sub" style="font-size:11px;">Shops를 사용하려면 커머스 제품 판매자 계약을 준수해야 합니다. <a class="fbbtn--link" style="display:inline; margin:0;">더 알아보기</a></p>
            <div style="display:flex; gap:10px; margin-top:6px;">
              <button class="fbbtn fbbtn--outline" id="fb-commerce-cancel" style="flex:1;">취소</button>
              <button class="fbbtn fbbtn--primary" id="fb-commerce-ok" style="flex:1;">다음</button>
            </div>
          `;
          body.querySelector("#fb-commerce-cancel").addEventListener("click", () => ctx.cancel());
          body.querySelector("#fb-commerce-ok").addEventListener("click", () => ctx.next());
        },
        footStyle: "links",
      },

      /* 14: DONE */
      {
        winTitle: "Facebook으로 로그인 - Chrome",
        url: "/v22.0/dialog/oauth?app_id=" + APP_ID,
        sideTitle: "연동 완료",
        sideDesc: `
          <p>Meta 자산 연동이 모두 완료되었음을 안내하는 화면입니다.</p>
          <p>연동이 끝나면 더 많은 사람에게 비즈니스를 알리고, 구매 가능성이 높은 잠재 고객을 찾고, 웹사이트에서 발생한 행동 결과를 측정할 수 있습니다.</p>
          <p>완료를 누르면 메이크샵 어드민으로 돌아오고, 광고 만들기를 선택하면 Meta 광고 관리자로 이동합니다.</p>
        `,
        custom: true,
        render(body, ctx) {
          body.innerHTML = `
            <div class="fbwin__illust">&#127881;</div>
            <h2 class="fbwin__title" style="font-size:17px;">완료되었습니다!</h2>
            <p class="fbwin__sub">이제 웹사이트가 Facebook에 연결되었으므로 다음 작업을 수행할 수 있습니다:</p>
            <ul class="fbwin__done-list">
              <li><span class="num">1</span>더 많은 사람이 비즈니스를 발견하도록 유도해보세요</li>
              <li><span class="num">2</span>제품 및 서비스를 구매할 가능성이 높은 사람들을 찾을 수 있습니다</li>
              <li><span class="num">3</span>웹사이트에서 발생한 행동 결과를 측정할 수 있습니다</li>
            </ul>
            <div style="display:flex; gap:10px; margin-top:10px;">
              <button class="fbbtn fbbtn--outline" id="fb-done-finish" style="flex:1;">완료</button>
              <button class="fbbtn fbbtn--primary" id="fb-done-ads" style="flex:1.4;">광고 만들기</button>
            </div>
          `;
          body.querySelector("#fb-done-finish").addEventListener("click", () => ctx.finish(false));
          body.querySelector("#fb-done-ads").addEventListener("click", () => ctx.finish(true));
        },
        footStyle: "links",
      },
    ];
  }

  /* ---------------- controller ---------------- */
  function open({ onComplete, onCancel }) {
    const account = window.MOCK.account;
    const adAccount = window.MOCK.adAccount;
    const emailMatch = /\(([^)]+)\)/.exec(account.fbAccountLabel);
    const sel = {
      email: emailMatch ? emailMatch[1] : "user@example.com",
      password: "",
      displayName: account.fbAccountLabel.split("(")[0].trim(),
      portfolio: account.businessManagerName,
      portfolioChoice: "biz",
      page: account.pageName,
      pageChoice: "page1",
      instagramHandle: account.instagramUsername,
      igChoice: account.instagramConnected ? "ig1" : "skip",
      catalog: account.businessManagerName + " 카탈로그",
      catalogChoice: "cat1",
      adAccount: adAccount.name,
      adAccountId: adAccount.id,
      adAccountChoice: "ad1",
      pixel: "Meta 픽셀(" + account.businessManagerName + ")",
      pixelId: account.pixelId,
      pixelChoice: "pixel1",
      commerce: account.commerceAccountName,
      commerceChoice: "commerce1",
    };

    const steps = buildSteps(sel);
    let idx = 0;
    const root = overlayRoot();

    function paintStep() {
      const step = steps[idx];
      if (typeof SidePanel !== "undefined") SidePanel.setOverride(step.sideTitle, step.sideDesc);
      const ctx = {
        stepIndex: idx,
        totalSteps: steps.length,
        next: () => {
          if (idx < steps.length - 1) {
            idx++;
            paintStep();
          }
        },
        back: () => {
          if (idx > 0) {
            idx--;
            paintStep();
          }
        },
        cancel: () => {
          close();
          if (onCancel) onCancel();
        },
        finish: (wantsAds) => {
          close();
          if (onComplete) onComplete(sel, wantsAds);
        },
        setNextEnabled: (val) => {
          const btn = root.querySelector('[data-nav="next"]');
          if (btn) btn.disabled = !val;
        },
      };

      const body = paintChrome(root, step, ctx);
      const footZone = root.querySelector("#fbwin-footzone");

      if (step.footStyle === "meta") {
        footZone.innerHTML = `<div class="fbwin__foot"><span class="fbwin__meta-logo">&#8734; Meta</span></div>`;
      } else if (step.footStyle === "links") {
        footZone.innerHTML = `
          <div class="fbwin__footlinks">
            <span>문제가 있으신가요? <a>문의하기</a></span>
            <a>고객 센터</a>
          </div>`;
      } else if (step.footStyle === "nav") {
        renderNavFoot(footZone, {
          onCancel: ctx.cancel,
          onBack: ctx.back,
          onNext: ctx.next,
          nextEnabled: false,
          hideBack: idx === 0,
        });
      }

      step.render(body, ctx);
    }

    paintStep();
  }

  return { open };
})();
