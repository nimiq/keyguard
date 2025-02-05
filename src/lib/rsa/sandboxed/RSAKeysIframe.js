/* global forge */

/**
 * @typedef {{command: 'generateKey', seed: Uint8Array, keySize: number}} GenerateKeyCommand
 * ...add new command types here and add them to the `Command` union type below
 *
 * @typedef {GenerateKeyCommand} Command
 */

if (// Refuse to run if:
    // - In a top level window
    window.self === window.top
    // - Iframe is embedded in another domain
    || window.location.origin !== new URL(document.referrer).origin
    // - Iframe can access parent page and is thus not sandboxed
    || !!window.frameElement
) throw new Error('Only allowed to run in a sandboxed iframe');

const $loading = /** @type {HTMLSpanElement} */ (document.querySelector('#loading'));

/**
 * @param {forge.asn1.Asn1} key
 * @returns {Uint8Array}
 */
function keyToUint8Array(key) {
    const bytes = forge.asn1.toDer(key).getBytes();
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        result[i] = bytes.charCodeAt(i);
    }
    return result;
}

window.addEventListener('message', async event => {
    if (event.origin !== window.location.origin) return; // Reject messages from other origins

    /** @type {Command} */
    const data = event.data;
    if (!('command' in data) || data.command !== 'generateKey') return;
    console.debug('RSA iframe MSG:', data);
    if (!(data.seed instanceof Uint8Array) || typeof data.keySize !== 'number') throw new Error('Invalid RSA command');

    $loading.textContent = '(generating...)';
    await new Promise(res => window.setTimeout(res, 50)); // Give DOM time to update

    // PRNG-seeded RSA key generation
    const prng = forge.random.createInstance();
    const seedByteBuffer = new forge.util.ByteStringBuffer(data.seed.buffer);
    const seed = seedByteBuffer.getBytes();
    prng.seedFileSync = needed => {
        // console.log('Need', needed, 'bytes of randomness, have', seed.length);
        let result = '';
        while (result.length < needed) {
            result += seed;
        }
        return result.substring(0, needed);
    };


    /**
     * The async version of Forge's pki.rsa.generateKeyPair uses WebWorkers. Sadly, those cannot be
     * created in sandboxed iframes without `allow-same-origin` (https://stackoverflow.com/a/30567964/4204380).
     */
    const keyPair = forge.pki.rsa.generateKeyPair({ bits: data.keySize, prng });
    // const keyPair = await new Promise((resolve, reject) => forge.pki.rsa.generateKeyPair(
    //     { bits: data.keySize, prng, workers: -1, workerScript: './node-forge/prime.worker.min.js' },
    //     (error, keyPair) => {
    //         if (error) {
    //             reject(error);
    //             return;
    //         }

    //         resolve(keyPair);
    //     },
    // ));

    // console.log({ keyPair });

    // Export to ASN1 notation
    const rsaPrivateKey = forge.pki.privateKeyToAsn1(keyPair.privateKey);
    // Wrap into PKCS#8 format (to be understandable by `window.crypto.subtle.importKey`)
    const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);

    // Export to ASN1 notation (already in SPKI format)
    const publicKeyInfo = forge.pki.publicKeyToAsn1(keyPair.publicKey);

    const privateKey = keyToUint8Array(privateKeyInfo);
    const publicKey = keyToUint8Array(publicKeyInfo);
    /** @type {Window} */ (event.source).postMessage({
        privateKey,
        publicKey,
    }, {
        targetOrigin: window.location.origin, // Only allow responses back to the same origin.
        transfer: [privateKey.buffer, publicKey.buffer], // Transfer ArrayBuffers without copying them.
    });

    $loading.textContent = '';
});
