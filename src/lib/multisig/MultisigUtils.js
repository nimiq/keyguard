/* global Nimiq */
/* global MerkleTreePatch */
/* global wasm_bindgen */

class MultisigUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {Nimiq.PublicKey[]} publicKeys
     * @param {number} signersRequired
     * @returns {Nimiq.Address}
     */
    static calculateAddress(publicKeys, signersRequired) {
        publicKeys.sort((a, b) => a.compare(b));
        const combinations = [
            ...(
                // @ts-ignore Generator is not generic in Keyguard's old TS version
                /** @type {Generator<Nimiq.PublicKey[]>} */
                (Nimiq.ArrayUtils.k_combinations(publicKeys, signersRequired))
            ),
        ];
        const multiSigKeys = combinations.map(combination => Nimiq.PublicKey.sum(combination));
        multiSigKeys.sort((a, b) => a.compare(b));
        MerkleTreePatch.apply();
        const merkleRoot = Nimiq.MerkleTree.computeRoot(multiSigKeys);
        return Nimiq.Address.fromHash(merkleRoot);
    }

    /**
     * Aggregate commitment secrets with scalar multiplication in WASM
     * @param {Uint8Array[]} secrets
     * @param {Uint8Array} bScalar
     * @returns {Promise<Nimiq.RandomSecret>}
     */
    static async aggregateSecrets(secrets, bScalar) {
        const scriptId = 'multisig-wasm';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = '../../lib/multisig/wasm/pkg/multisig.js'; // Relative path from a request URL
            /** @type {Promise<void>} */
            const loadPromise = new Promise(resolve => script.addEventListener('load', () => resolve()));
            document.head.appendChild(script);
            await loadPromise;

            // `wasm_bindgen` is a global variable from the script above
            await wasm_bindgen('../../lib/multisig/wasm/pkg/multisig_bg.wasm'); // Relative path from a request URL
        }

        const concatenatedSecrets = new Uint8Array(secrets.reduce((sum, secret) => sum + secret.length, 0));
        let writePos = 0;
        for (const secret of secrets) {
            concatenatedSecrets.set(secret, writePos);
            writePos += secret.length;
        }
        const secret = wasm_bindgen.aggregate_secrets(concatenatedSecrets, bScalar);
        return new Nimiq.RandomSecret(secret);
    }
}
