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
    // Reject messages from other origins
    if (event.origin !== window.location.origin) return;
    // Ignore messages from the iframe itself (sometimes triggered by browser extensions)
    if (event.source === event.target) return;

    /** @type {Command} */
    const data = event.data;
    if (!('command' in data) || data.command !== 'generateKey') return;
    console.debug('RSA iframe MSG:', data);
    if (!(data.seed instanceof Uint8Array) || typeof data.keySize !== 'number') throw new Error('Invalid RSA command');

    const $loading = /** @type {HTMLSpanElement} */ (document.querySelector('#loading'));
    $loading.textContent = '(generating...)';
    // The RSA key generation is computationally expensive. Before we start the process, give the DOM time to update,
    // especially the parent page. Otherwise, the iframe also blocks DOM updates of the parent page in browsers which do
    // not run the iframe on a separate thread, like Firefox.
    await new Promise(res => window.setTimeout(res, 50));

    // PRNG-seeded RSA key generation
    const prng = forge.random.createInstance();
    const seedByteBuffer = new forge.util.ByteStringBuffer(data.seed.buffer);
    const seed = seedByteBuffer.getBytes();
    prng.seedFileSync = needed => {
        // console.log('Need', needed, 'bytes of randomness, have', seed.length);
        if (needed > seed.length) {
            throw new Error(`Seed does not provide enough entropy. ${needed} bytes needed`);
        }
        // Note, there's no reason to truncate the entropy if we have more than needed, as any excess will be used, too
        // (github.com/digitalbazaar/forge/blob/a0a4a4264bedb3296974b9675349c9c190144aeb/lib/prng.js#L210).
        // Additionally, note that `forge.prng` does in fact reseed the prng every time new random data is requested
        // (github.com/digitalbazaar/forge/blob/a0a4a4264bedb3296974b9675349c9c190144aeb/lib/prng.js#L90-L95). A quick
        // experiment showed that a `forge.rsa.generateKeyPair` does trigger two reseeds. So if there is excess data,
        // instead of returning the entire entropy, one could also think about returning a new entropy slice each time.
        // Therefore, one might consider returning two individual slices of `needed` bytes each, and requiring a seed of
        // total length `2 * needed`. However, looking at the linked comment, it seems like the frequent seeding is
        // mostly out of paranoia and not strictly required.
        // Overall, returning the full, non-truncated seed in a single slice on all reseeds is a good middle ground.
        // Finally note, that reseeding with the same seed does not mean the same random numbers are generated, as the
        // reseeding algorithm also takes the previous seeding result and the reseeding iteration count into account
        // (https://github.com/digitalbazaar/forge/blob/2bb97afb5058285ef09bcf1d04d6bd6b87cffd58/lib/prng.js#L217).
        return seed;
    };


    // Use the synchronous version of forge.rsa.generateKeyPair and not the asynchronous version with WebWorkers because
    // - WebWorkers cannot be created in sandboxed iframes without `allow-same-origin`:
    //   https://stackoverflow.com/a/30567964/4204380.
    // - Using multiple WebWorkers introduces race conditions, which causes the key generation to not be deterministic
    //   anymore, even if a deterministically seeded PRNG is used, see documentation on `primeincFindPrimeWithWorkers`:
    //   https://github.com/digitalbazaar/forge/blob/a0a4a4264bedb3296974b9675349c9c190144aeb/lib/prime.js#L150-L153
    //   If using WebWorkers, that method is called via `generateKeyPair` > `_generateKeyPair` > `generateProbablePrime`
    //   > `primeincFindPrime` > `primeincFindPrimeWithWorkers`.
    // Unfortunately, this blocks the main thread in some browsers like Firefox, where same origin iframes are running
    // on the same thread as the main window. In Chrome, that is not the case thanks to its oop iframes.
    const keyPair = forge.pki.rsa.generateKeyPair({ bits: data.keySize, prng });

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
