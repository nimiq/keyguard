// @ts-expect-error Cannot read types
import * as NimiqPoS from '../../node_modules/@nimiq/albatross-wasm/web/index.js';

// Move any defined `Nimiq` global to `NimiqPoW`
// @ts-expect-error window.NimiqPoW is not defined
window.NimiqPoW = window.Nimiq;

// Overwrite the global `Nimiq` with the PoS version
// @ts-expect-error window.Nimiq is not defined
window.Nimiq = NimiqPoS;
