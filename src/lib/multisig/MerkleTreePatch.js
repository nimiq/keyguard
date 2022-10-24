/* global Nimiq */
/* eslint-disable valid-jsdoc */

/**
 * Monkey patch the Nimiq core MerkleTree class until it gets actually shipped with the Nimiq core web-offline package.
 */
class MerkleTreePatch { // eslint-disable-line no-unused-vars
    static apply() {
        if (typeof Nimiq.MerkleTree !== 'undefined') {
            // @ts-ignore
            if (Nimiq.MerkleTree.__isMonkeyPatch) {
                // Patch already applied
                return;
            }
            throw new Error('MerkleTree monkey patch not required anymore. Please remove it.');
        } else {
            class MerkleTree {
                /**
                 * @param {any[]} values
                 * @param {(o: any) => Nimiq.Hash} [fnHash]
                 * @returns {Nimiq.Hash}
                 */
                static computeRoot(values, fnHash = MerkleTree._hash) {
                    return MerkleTree._computeRoot(values, fnHash);
                }

                /**
                * @param {any[]} values
                * @param {(o: any) => Nimiq.Hash} fnHash
                * @returns {Nimiq.Hash}
                * @private
                */
                static _computeRoot(values, fnHash) {
                    const len = values.length;
                    if (len === 0) {
                        return Nimiq.Hash.light(new Uint8Array(0));
                    }
                    if (len === 1) {
                        return fnHash(values[0]);
                    }

                    const mid = Math.round(len / 2);
                    const left = values.slice(0, mid);
                    const right = values.slice(mid);
                    const leftHash = MerkleTree._computeRoot(left, fnHash);
                    const rightHash = MerkleTree._computeRoot(right, fnHash);
                    return Nimiq.Hash.light(
                        /** @type {Uint8Array} */
                        (Nimiq.BufferUtils.concatTypedArrays(leftHash.serialize(), rightHash.serialize())),
                    );
                }

                /**
                * @param {Nimiq.Hash | Uint8Array | { hash: () => Nimiq.Hash } | { serialize: () => Uint8Array }} o
                * @returns {Nimiq.Hash}
                * @private
                */
                static _hash(o) {
                    if (o instanceof Nimiq.Hash) {
                        return o;
                    }
                    if ('hash' in o && typeof o.hash === 'function') {
                        return o.hash();
                    }
                    if ('serialize' in o && typeof o.serialize === 'function') {
                        return Nimiq.Hash.light(o.serialize());
                    }
                    if (o instanceof Uint8Array) {
                        return Nimiq.Hash.light(o);
                    }
                    throw new Error('MerkleTree objects must be Uint8Array or have a .hash()/.serialize() method');
                }
            }
            // @ts-ignore
            MerkleTree.__isMonkeyPatch = true;
            Nimiq.Class.register(MerkleTree);
        }
    }
}
