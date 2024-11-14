// @ts-expect-error Cannot read types
import * as Albatross from '../../node_modules/@nimiq/albatross-wasm/web/index.js';
// @ts-expect-error window.Albatross is not defined (because we already define Albatross as a global)
window.Albatross = Albatross;
