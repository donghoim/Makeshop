import { html, useEffect } from '../js/lib.js';
import { useStore } from '../js/store.js';

export function Toast() {
  var store = useStore();
  var toast = store.state.toast;

  useEffect(function () {
    if (!toast) return;
    var timer = setTimeout(function () {
      store.dispatch({ type: 'HIDE_TOAST' });
    }, 2400);
    return function () { clearTimeout(timer); };
  }, [toast && toast.id]);

  if (!toast) return null;

  return html`
    <div class="toast">
      <span class="toast__dot"></span>
      <span>${toast.message}</span>
    </div>
  `;
}
