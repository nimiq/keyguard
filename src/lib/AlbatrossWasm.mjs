// @ts-expect-error Cannot read types
import * as Nimiq from '../../node_modules/@nimiq/albatross-wasm/web/index.js';
// @ts-expect-error window.Nimiq is not defined (because we already define Albatross as a global)
window.Nimiq = Nimiq;
