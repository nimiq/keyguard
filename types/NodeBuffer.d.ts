import _NodeBuffer from '../node_modules/buffer';

export as namespace NodeBuffer;
export = _NodeBuffer;

declare global {
    const NodeBuffer: typeof _NodeBuffer;
}
