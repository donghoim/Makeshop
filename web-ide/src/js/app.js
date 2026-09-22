import { html, ReactDOM } from './lib.js';
import { StoreProvider } from './store.js';
import { App } from '../components/App.js';

var root = ReactDOM.createRoot(document.getElementById('root'));
root.render(html`<${StoreProvider}><${App} /></${StoreProvider}>`);
