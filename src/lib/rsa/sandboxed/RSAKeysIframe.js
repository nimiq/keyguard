/* global forge */

/**
 * @typedef {{command: 'generateKey', seed: string, keySize: number}} GenerateKeyCommand
 * ...add new command types here and add them to the `Command` union type below
 *
 * @typedef {GenerateKeyCommand} Command
 */

/** @type {HTMLSpanElement} */
const $loading = (document.querySelector('#loading'));

/**
 * @param {any} key
 * @returns {ArrayBuffer}
 */
function key2ArrayBuffer(key) {
    const bytes = /** @type {string} */ (forge.asn1.toDer(key).getBytes());
    const buffer = new ArrayBuffer(bytes.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i++) {
        view[i] = bytes.charCodeAt(i);
    }
    return buffer;
}

window.addEventListener('message', async event => {
    if (event.source === event.target) {
        // console.log("Ignored same-window event:", event);
        return;
    }

    /** @type {Command} */
    const data = event.data;
    if (!('command' in data) || data.command !== 'generateKey') return;
    console.debug('RSA iframe MSG:', data);

    $loading.textContent = '(generating...)';
    await new Promise(res => window.setTimeout(res, 50)); // Give DOM time to update

    // PRNG-seeded RSA key generation
    const prng = forge.random.createInstance();
    prng.seedFileSync = needed => {
        // console.log('Need', needed, 'bytes of randomness, have', data.seed.length);
        let seed = '';
        while (seed.length < needed) {
            seed += data.seed;
        }
        return seed.substring(0, needed);
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

    /** @type {Window} */ (event.source).postMessage({
        privateKey: key2ArrayBuffer(privateKeyInfo),
        publicKey: key2ArrayBuffer(publicKeyInfo),
    }, '*');

    $loading.textContent = '';
});
