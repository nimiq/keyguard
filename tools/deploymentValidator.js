#!/usr/bin/env node

/*
 * Validates a deployed Keyguard over HTTP.
 *
 * Usage: node tools/deploymentValidator.js <base-url>
 *    or: DEPLOY_URL=https://... node tools/deploymentValidator.js
 *
 * The Keyguard's security rests on headers the application itself cannot set: frame-ancestors
 * decides who may embed a key manager, and it differs per path. Those headers live in the server
 * config -- CloudFront response-headers policies, configured on the distribution rather than in
 * this repository -- so nothing in this repository fails when they drift. This does.
 *
 * The expectations below mirror the nginx config that served keyguard.nimiq-testnet.com until the
 * cutover, as of 2026-08-14:
 *
 *     node tools/deploymentValidator.js https://keyguard.nimiq-testnet.com
 *
 * They are testnet-specific: FRAME_ANCESTORS names the nimiq-testnet.com embedders, so pointing
 * this at mainnet keyguard.nimiq.com -- which still runs that nginx config -- fails those checks
 * on the nimiq.com origins it sends instead, and /build-info.json, which only the S3 workflow
 * writes.
 *
 * It also re-derives every SRI hash from what the CDN actually serves, which catches a partial
 * upload: HTML pinning bundles that were never published, or published under a different encoding.
 */

const { createHash } = require('crypto');

const BASE = (process.argv[2] || process.env.DEPLOY_URL || '').replace(/\/+$/, '');

const TIMEOUT_MS = 30000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

/**
 * A floor, not a count: it exists so that a scrape which silently matches nothing cannot pass as
 * "all hashes verified". /request/create/ links 8 today.
 */
const MIN_SRI_RESOURCES = 4;

/**
 * A year, matching `www` and the apex of nimiq-testnet.com and the nginx still serving mainnet
 * keyguard.nimiq.com. The testnet nginx sent six months, and the CloudFront policies reproduced
 * that until the distribution's max-age override was dropped. This constant and that policy move
 * together: whichever lands first, the deploy between them fails here.
 */
const HSTS = 'max-age=31536000; includeSubDomains; preload';

/** The sources each policy allows, as a set: the order a policy lists them in carries no meaning. */
const FRAME_ANCESTORS = {
    /** Not embeddable at all -- the default for every Keyguard page. */
    NONE: ["'none'"],
    /** The generic iframe, embedded by the Hub, the Wallet and the Safe. */
    IFRAME: [
        'https://safe.nimiq-testnet.com',
        'https://wallet.nimiq-testnet.com',
        'https://hub.nimiq-testnet.com',
    ],
    /** The swap iframe, which the Safe never embeds. */
    SWAP: ['https://wallet.nimiq-testnet.com', 'https://hub.nimiq-testnet.com'],
    /** The RSA sandbox, embedded only by the Keyguard itself. */
    SELF: ["'self'"],
};

const {
    NONE, IFRAME, SWAP, SELF,
} = FRAME_ANCESTORS;

/**
 * Every directive the policy carries besides `frame-ancestors`, which is the only one that varies
 * per path. Asserting `frame-ancestors` alone was not enough: it let `frame-src` sit at `'none'`
 * unnoticed, which blocks the RSA sandbox iframe below, and would have let any other directive be
 * dropped or widened just as quietly. The set is compared exactly, so an added directive fails too.
 *
 * @type {[string, string[]][]}
 */
const SHARED_CSP = [
    ['default-src', ["'self'", "'unsafe-eval'"]],
    ['connect-src', ["'self'", 'https://api.coingecko.com']],
    ['img-src', ['http:', 'https:', 'blob:', 'data:']],
    ['child-src', ["'self'", 'blob:']],
    ['worker-src', ["'self'", 'blob:']],
    // `'self'`, not `'none'`: src/lib/Key.js frames /lib/rsa/sandboxed/RSAKeysIframe.html to derive
    // the RSA key sign-multisig-transaction needs. A header CSP is enforced alongside the page's
    // meta CSP rather than in place of it, so `'none'` here vetoes what the page permits and the
    // iframe never loads -- the request hangs rather than failing.
    ['frame-src', ["'self'"]],
    ['media-src', ["'none'"]],
    ['object-src', ["'none'"]],
    ['style-src', ["'self'"]],
    ['font-src', ["'self'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'none'"]],
    ['block-all-mixed-content', []],
];

/**
 * What RSAKeysIframe.html adds. `sandbox` is one of the two directives a document cannot set for
 * itself in a meta tag (`frame-ancestors` is the other), and it is what gives the iframe the null
 * origin that makes `'self'` unsatisfiable -- hence the `'unsafe-inline'`, for the scripts
 * tools/build.sh inlines into it. See the comment atop src/lib/rsa/sandboxed/RSAKeysIframe.html.
 *
 * @type {[string, string[]][]}
 */
const RSA_SANDBOX_CSP = [
    ['sandbox', ['allow-scripts']],
    ['script-src', ["'self'", "'unsafe-eval'", "'unsafe-inline'"]],
];

const JS = 'application/javascript';
const HTML = 'text/html';

const PROBES = [
    { path: '/', contentType: HTML, frameAncestors: NONE },
    { path: '/request/create/', contentType: HTML, frameAncestors: NONE },
    { path: '/request/sign-transaction/', contentType: HTML, frameAncestors: NONE },
    { path: '/ServiceWorker.js', contentType: JS, frameAncestors: NONE },
    { path: '/redirect.js', contentType: JS, frameAncestors: NONE },
    { path: '/lib/Nimiq.mjs', contentType: JS, frameAncestors: NONE },
    { path: '/assets/nimiq-pos/web/index.js', contentType: JS, frameAncestors: NONE },
    { path: '/assets/nimiq-pow/worker-wasm.wasm', contentType: 'application/wasm', frameAncestors: NONE },
    { path: '/assets/nimiq-style.icons.svg', contentType: 'image/svg+xml', frameAncestors: NONE },
    { path: '/build-info.json', contentType: 'application/json', frameAncestors: NONE },
    // The three cross-origin-embeddable paths, each with its own policy.
    { path: '/request/iframe/', contentType: HTML, frameAncestors: IFRAME },
    { path: '/request/swap-iframe/', contentType: HTML, frameAncestors: SWAP },
    {
        path: '/lib/rsa/sandboxed/RSAKeysIframe.html',
        contentType: HTML,
        frameAncestors: SELF,
        extraCsp: RSA_SANDBOX_CSP,
    },
];

/** The page whose SRI hashes are re-derived from the CDN. */
const SRI_PAGE = '/request/create/';

let hasErrors = false;

/**
 * @param {string} message
 */
function fail(message) {
    hasErrors = true;
    console.error('\x1b[31m%s\x1b[0m', `  FAIL ${message}`);
}

/**
 * @param {string} message
 */
function pass(message) {
    console.log(`  ok   ${message}`);
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => { setTimeout(resolve, ms); });
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Fetch without following redirects, so a 301 to some other host is a failure rather than an
 * invisible pass. Retries transient errors only: a 404 is a deployment bug and must not be masked
 * by a retry, which is also how `curl --retry` behaves without `-f`.
 *
 * @param {string} url
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url) {
    let lastError = new Error(`could not fetch ${url}`);

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const response = await fetch(url, {
                redirect: 'manual',
                signal: AbortSignal.timeout(TIMEOUT_MS),
            });
            const transient = response.status >= 500 || response.status === 429;
            if (!transient || attempt === RETRY_ATTEMPTS) return response;
            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            if (attempt === RETRY_ATTEMPTS) throw error;
            lastError = /** @type {Error} */ (error);
        }
        // eslint-disable-next-line no-await-in-loop
        await sleep(RETRY_DELAY_MS);
    }

    throw lastError;
}

/**
 * @param {string} label
 * @param {string|null} actual
 * @param {string} expected
 */
function expect(label, actual, expected) {
    if (actual && actual.includes(expected)) {
        pass(`${label}: ${actual}`);
    } else {
        fail(`${label}: got '${actual || '<missing>'}', want *${expected}*`);
    }
}

/**
 * Split a policy into directive name -> sources, normalising the whitespace between sources so the
 * comparison does not depend on how the policy happens to be formatted.
 *
 * @param {string|null} csp
 * @returns {Map<string, string[]>}
 */
function parseCsp(csp) {
    /** @type {Map<string, string[]>} */
    const directives = new Map();
    if (!csp) return directives;

    for (const entry of csp.split(';')) {
        const parts = entry.trim().split(/\s+/).filter(part => part.length > 0);
        if (parts.length > 0) directives.set(parts[0], parts.slice(1));
    }
    return directives;
}

/**
 * @param {string[]} sources
 * @returns {string}
 */
function sortedSources(sources) {
    return [...sources].sort().join(' ');
}

/**
 * Compare a whole policy without depending on the order anything is written in. nginx and a
 * CloudFront response-headers policy are configured separately, and a policy that lists the same
 * directives, or the same sources within one, in another order is the same policy.
 *
 * The directive names are checked as an exact set before the sources are, so a policy that has
 * gained or lost a directive says so once rather than once per directive.
 *
 * @param {string|null} csp
 * @param {[string, string[]][]} expected
 */
function expectCsp(csp, expected) {
    const actual = parseCsp(csp);

    const names = [...actual.keys()].sort().join(' ');
    const wanted = expected.map(([name]) => name).sort().join(' ');
    if (names !== wanted) {
        fail(`csp directives: got '${names || '<missing>'}', want '${wanted}'`);
        return;
    }

    for (const [name, sources] of expected) {
        const got = /** @type {string[]} */ (actual.get(name));
        const directive = [name, ...got].join(' ');
        if (sortedSources(got) === sortedSources(sources)) {
            pass(`${name}: ${directive}`);
        } else {
            fail(`${name}: got '${directive}', want these sources in any order: `
                + `${[name, ...sources].join(' ')}`);
        }
    }
}

/**
 * @typedef {object} Probe
 * @property {string} path
 * @property {string} contentType
 * @property {string[]} frameAncestors
 * @property {[string, string[]][]} [extraCsp] - directives this path adds to SHARED_CSP
 */

/**
 * @param {Probe} probe
 * @returns {Promise<Response|null>}
 */
async function probePath(probe) {
    console.log(`--- ${probe.path}`);

    let response;
    try {
        response = await fetchWithRetry(`${BASE}${probe.path}`);
    } catch (error) {
        fail(`request failed: ${messageOf(error)}`);
        return null;
    }

    if (response.status !== 200) {
        fail(`HTTP ${response.status}`);
        return response;
    }

    expect('content-type', response.headers.get('content-type'), probe.contentType);
    expect('cache-control', response.headers.get('cache-control'), 'no-cache');
    expect('strict-transport-security', response.headers.get('strict-transport-security'), HSTS);
    expect('x-content-type-options', response.headers.get('x-content-type-options'), 'nosniff');
    expect('referrer-policy', response.headers.get('referrer-policy'), 'strict-origin');
    expectCsp(response.headers.get('content-security-policy'), [
        ...SHARED_CSP,
        ...(probe.extraCsp || []),
        ['frame-ancestors', probe.frameAncestors],
    ]);

    // frame-ancestors is the control that actually stops clickjacking; X-Frame-Options ALLOW-FROM
    // has been inert in every modern browser for years, so it is only checked for presence, and for
    // DENY on the paths nothing may embed.
    const xFrameOptions = response.headers.get('x-frame-options');
    if (!xFrameOptions) {
        fail('x-frame-options: missing');
    } else if (probe.frameAncestors === FRAME_ANCESTORS.NONE && xFrameOptions !== 'DENY') {
        fail(`x-frame-options: got '${xFrameOptions}', want DENY on a non-embeddable path`);
    } else {
        pass(`x-frame-options: ${xFrameOptions}`);
    }

    return response;
}

/**
 * @typedef {object} SriResource
 * @property {string|null} url - null when a tag carries an integrity hash but no src or href
 * @property {string} integrity
 */

/**
 * Collect every subresource the page pins with an SRI hash. Attribute order is not assumed:
 * tools/build.sh emits src before integrity today, and this must keep working if that changes.
 *
 * @param {string} html
 * @returns {SriResource[]}
 */
function extractSriResources(html) {
    const tags = html.match(/<(?:script|link)\b[^>]*>/gi) || [];

    /** @type {SriResource[]} */
    const resources = [];

    for (const tag of tags) {
        const integrity = tag.match(/\sintegrity\s*=\s*"([^"]+)"/i);
        if (!integrity) continue;
        const url = tag.match(/\s(?:src|href)\s*=\s*"([^"]+)"/i);
        resources.push({ url: url ? url[1] : null, integrity: integrity[1] });
    }

    return resources;
}

/**
 * Re-derive each SRI hash from the bytes the CDN serves. fetch() decodes gzip and brotli the way a
 * browser does, which is what makes this meaningful: SRI is computed over the decoded body, so a
 * CDN that re-compresses must still produce the hash the HTML pins.
 *
 * @param {SriResource[]} resources
 * @returns {Promise<number>}
 */
async function verifySriResources(resources) {
    let verified = 0;

    for (const resource of resources) {
        if (!resource.url) {
            fail(`integrity="${resource.integrity}" on a tag with no src or href`);
            continue;
        }

        const expected = resource.integrity.trim().split(/\s+/)
            .find(hash => hash.startsWith('sha256-'));
        if (!expected) {
            fail(`${resource.url}: no sha256 hash in integrity="${resource.integrity}"`);
            continue;
        }

        const url = new URL(resource.url, `${BASE}/`).href;
        let response;
        try {
            // eslint-disable-next-line no-await-in-loop
            response = await fetchWithRetry(url);
        } catch (error) {
            fail(`${resource.url}: request failed: ${messageOf(error)}`);
            continue;
        }

        if (response.status !== 200) {
            fail(`${resource.url}: HTTP ${response.status}`);
            continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const body = Buffer.from(await response.arrayBuffer());
        const actual = `sha256-${createHash('sha256').update(body).digest('base64')}`;
        if (actual !== expected) {
            fail(`SRI ${resource.url} (html=${expected} served=${actual})`);
        } else {
            verified += 1;
        }
    }

    return verified;
}

/**
 * @returns {Promise<void>}
 */
async function checkSri() {
    console.log(`--- SRI (${SRI_PAGE})`);

    let html;
    try {
        const response = await fetchWithRetry(`${BASE}${SRI_PAGE}`);
        if (response.status !== 200) {
            fail(`could not fetch ${SRI_PAGE} for SRI verification: HTTP ${response.status}`);
            return;
        }
        html = await response.text();
    } catch (error) {
        fail(`could not fetch ${SRI_PAGE} for SRI verification: ${messageOf(error)}`);
        return;
    }

    const resources = extractSriResources(html);
    const verified = await verifySriResources(resources);

    if (verified < MIN_SRI_RESOURCES) {
        fail(`verified only ${verified} SRI-protected resources, expected at least ${MIN_SRI_RESOURCES}`);
    } else {
        pass(`verified ${verified} SRI-protected resources`);
    }
}

/**
 * @returns {Promise<void>}
 */
async function main() {
    if (!BASE) {
        console.error('\x1b[31m%s\x1b[0m', 'ERROR: usage: node tools/deploymentValidator.js <base-url>');
        process.exit(1);
    }

    console.log(`Validating deployment at ${BASE}`);

    for (const probe of PROBES) {
        // Sequential on purpose: a failing deployment should not be hit with 13 parallel requests,
        // and the output stays readable.
        // eslint-disable-next-line no-await-in-loop
        await probePath(probe);
    }

    await checkSri();

    if (hasErrors) {
        console.error('\x1b[31m%s\x1b[0m', `\nERROR: deployment at ${BASE} failed validation`);
        process.exit(1);
    }

    console.log('\x1b[32m%s\x1b[0m', `\nOK: deployment at ${BASE} is valid`);
}

main();
