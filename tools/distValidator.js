#!/usr/bin/env node

/*
 * Validates a freshly built dist/ before it is deployed.
 *
 * Usage: node tools/distValidator.js <testnet|mainnet>
 *
 * tools/build.sh assembles dist/ by copying files out of node_modules, rewriting import paths and
 * substituting HASH placeholders. Every one of those steps fails silently -- a missing file, an
 * unsubstituted placeholder or a surviving node_modules import all produce a dist/ that looks fine
 * and 404s in the browser. This checks the invariants the build never asserts for itself.
 *
 * The extension allowlist additionally guards the deployment: .github/scripts/s3-sync.sh uploads
 * dist/ in one pass per content type, so a dependency bump that introduces an unknown file
 * extension must fail here rather than land in S3 with a guessed type. The origin sends `nosniff`,
 * which makes a wrong content type a hard failure in the browser, not a cosmetic one.
 */

const fs = require('fs');
const path = require('path');
const funcs = require('./functions');

const DIST = 'dist';

const BUILD = process.argv[2];

/** Files that must exist and be non-empty, whatever else the build produced. */
const REQUIRED_FILES = [
    'dist/index.html',
    'dist/request/index.html',
    'dist/redirect.js',
    'dist/ServiceWorker.js',
    'dist/favicon.ico',
    'dist/lib/Nimiq.mjs',
    'dist/lib/QrScannerWorker.js',
    'dist/lib/rsa/sandboxed/RSAKeysIframe.html',
    'dist/assets/nimiq-style.icons.svg',
    'dist/assets/nimiq-pow/worker-wasm.wasm',
    'dist/assets/nimiq-pos/web/index.js',
    // The two cross-origin-embeddable endpoints. The CloudFront response-headers policies are
    // keyed on these exact paths, so their absence would silently drop a frame-ancestors policy.
    'dist/request/iframe/index.html',
    'dist/request/swap-iframe/index.html',
];

/** Shared bundles that every request page links with an SRI hash. */
const REQUIRED_BUNDLES = ['common', 'toplevel', 'bitcoin', 'polygon'];

/** Extensions s3-sync.sh has an upload rule for. */
const ALLOWED_EXTENSIONS = new Set([
    'css', 'gitkeep', 'html', 'ico', 'js', 'json', 'map', 'mjs', 'png', 'svg', 'wasm', 'woff2',
]);

/** Files that legitimately carry no extension at all. */
const ALLOWED_EXTENSIONLESS = new Set(['LICENSE']);

let hasErrors = false;

/**
 * @param {string} message
 */
function fail(message) {
    hasErrors = true;
    console.error('\x1b[31m%s\x1b[0m', `ERROR: ${message}`);
}

/**
 * @param {string} message
 */
function ok(message) {
    console.log('\x1b[32m%s\x1b[0m', `OK: ${message}`);
}

/**
 * List the entries of a directory that match a pattern. Returns [] for a missing directory, so the
 * caller reports "no match" rather than crashing on a build that never created it.
 *
 * @param {string} dirPath
 * @param {RegExp} pattern
 * @returns {string[]}
 */
function listMatching(dirPath, pattern) {
    if (!fs.existsSync(dirPath)) return [];
    return fs.readdirSync(dirPath).filter(entry => pattern.test(entry));
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function isNonEmptyFile(filePath) {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile() && fs.statSync(filePath).size > 0;
}

/**
 * Every file the build promises, present and non-empty.
 */
function checkRequiredFiles() {
    const missing = REQUIRED_FILES.filter(filePath => !isNonEmptyFile(filePath));
    if (missing.length) {
        missing.forEach(filePath => fail(`missing or empty: ${filePath}`));
    } else {
        ok(`all ${REQUIRED_FILES.length} required files present`);
    }
}

/**
 * One built request directory per source request, each with its page and its hashed bundle.
 */
function checkRequestDirectories() {
    const sourceRequests = funcs.listDirectories('src/request');
    const builtRequests = funcs.listDirectories(`${DIST}/request`);

    // Compared by name rather than by count: build.sh starts from `rm -rf dist`, so a directory
    // dist/ has and src/ does not is a request that was renamed and would ship under both names.
    const missing = sourceRequests.filter(request => !builtRequests.includes(request));
    const unexpected = builtRequests.filter(request => !sourceRequests.includes(request));

    if (missing.length) fail(`not built: ${missing.join(', ')}`);
    if (unexpected.length) fail(`built, but no such request in src/request: ${unexpected.join(', ')}`);
    if (!missing.length && !unexpected.length) ok(`${builtRequests.length} request directories built`);

    builtRequests.forEach(request => {
        const dirPath = `${DIST}/request/${request}`;
        if (!isNonEmptyFile(`${dirPath}/index.html`)) fail(`missing ${dirPath}/index.html`);
        // The glob mirrors add_hash_to_file_name(): index.<8 hex chars>.js
        if (!listMatching(dirPath, /^index\..+\.js$/).length) fail(`no hashed JS bundle in ${dirPath}`);
    });
}

/**
 * The shared bundles, which only exist once the HASH placeholders have been substituted.
 */
function checkSharedBundles() {
    REQUIRED_BUNDLES.forEach(bundle => {
        if (!listMatching(`${DIST}/request`, new RegExp(`^${bundle}\\..+\\.js$`)).length) {
            fail(`missing ${DIST}/request/${bundle}.<hash>.js`);
        }
    });

    if (!listMatching(`${DIST}/request`, /^toplevel\..+\.css$/).length) {
        fail(`missing ${DIST}/request/toplevel.<hash>.css`);
    }

    ok('shared bundles present');
}

/**
 * The rewrites build.sh performs in place. A survivor of any of these 404s in production.
 *
 * @param {string[]} files
 */
function checkRewrites(files) {
    const unsubstituted = files.filter(filePath => path.basename(filePath).includes('HASH'));
    if (unsubstituted.length) {
        unsubstituted.forEach(filePath => fail(`unsubstituted HASH placeholder in filename: ${filePath}`));
    }

    const nimiqMjs = `${DIST}/lib/Nimiq.mjs`;
    if (isNonEmptyFile(nimiqMjs) && fs.readFileSync(nimiqMjs, 'utf8').includes('node_modules')) {
        fail('Nimiq.mjs still imports from node_modules');
    }

    const rsaIframe = `${DIST}/lib/rsa/sandboxed/RSAKeysIframe.html`;
    if (isNonEmptyFile(rsaIframe) && fs.readFileSync(rsaIframe, 'utf8').includes('RSA_IFRAME_FORGE_CONTENTS')) {
        fail('forge.min.js was not inlined into RSAKeysIframe.html');
    }

    if (!hasErrors) ok('build rewrites applied');
}

/**
 * build.sh appends src/config/config.$BUILD.js to the common bundle (build.sh:248). Assert that the
 * requested config -- and only that config -- actually made it in, so a mainnet build can never be
 * deployed to testnet or the reverse.
 *
 * @param {string} build
 */
function checkConfig(build) {
    const configPath = `src/config/config.${build}.js`;
    if (!fs.existsSync(configPath)) {
        fail(`unknown build config '${build}': ${configPath} does not exist`);
        return;
    }

    /**
     * @param {string} source
     * @returns {string|null}
     */
    const allowedOrigin = source => {
        const match = source.match(/ALLOWED_ORIGIN:\s*'([^']+)'/);
        return match ? match[1] : null;
    };

    const expected = allowedOrigin(fs.readFileSync(configPath, 'utf8'));
    if (!expected) {
        fail(`could not read ALLOWED_ORIGIN out of ${configPath}`);
        return;
    }

    const bundles = listMatching(`${DIST}/request`, /^common\..+\.js$/);
    if (!bundles.length) return; // already reported by checkSharedBundles()

    const bundle = fs.readFileSync(`${DIST}/request/${bundles[0]}`, 'utf8');

    // config.local.js allows any origin ('*'), which no substring search can meaningfully look for.
    // Local builds are not a deploy target, so say the check was skipped rather than pass silently.
    if (!expected.startsWith('https://')) {
        console.log(`SKIP: ${build} ALLOWED_ORIGIN is '${expected}', which cannot be located in the bundle`);
        return;
    }

    if (!bundle.includes(expected)) {
        fail(`${build} ALLOWED_ORIGIN (${expected}) missing from the common bundle`);
        return;
    }

    // The other deployable configs' origins must be absent: 'https://hub.nimiq.com' is not a
    // substring of 'https://hub.nimiq-testnet.com', so this catches a bundle built for the wrong
    // network. Wildcard origins are skipped for the reason above.
    const conflicting = fs.readdirSync('src/config')
        .filter(entry => entry !== `config.${build}.js`)
        .map(entry => allowedOrigin(fs.readFileSync(`src/config/${entry}`, 'utf8')))
        .filter(origin => origin && origin.startsWith('https://') && origin !== expected && bundle.includes(origin));

    if (conflicting.length) {
        fail(`common bundle built for ${build} also contains foreign origin(s): ${conflicting.join(', ')}`);
        return;
    }

    ok(`common bundle carries the ${build} config (${expected})`);
}

/**
 * Every file in dist/ must be covered by one of s3-sync.sh's typed upload passes.
 *
 * @param {string[]} files
 */
function checkFileTypes(files) {
    /** @type {Map<string, string[]>} */
    const unhandled = new Map();

    files.forEach(filePath => {
        const base = path.basename(filePath);
        if (ALLOWED_EXTENSIONLESS.has(base)) return;

        // Deliberately not path.extname(), which reports '' for dotfiles such as .gitkeep.
        const dot = base.lastIndexOf('.');
        const extension = dot === -1 ? '<none>' : base.slice(dot + 1);
        if (extension !== '<none>' && ALLOWED_EXTENSIONS.has(extension)) return;

        const seen = unhandled.get(extension) || [];
        seen.push(filePath);
        unhandled.set(extension, seen);
    });

    unhandled.forEach((paths, extension) => {
        const label = extension === '<none>' ? 'no file extension' : `unhandled extension .${extension}`;
        fail(`${label}, no upload rule in s3-sync.sh: ${paths.slice(0, 5).join(', ')}`
            + `${paths.length > 5 ? ` (and ${paths.length - 5} more)` : ''}`);
    });

    if (!unhandled.size) ok(`all ${files.length} files covered by an upload rule`);
}

if (!BUILD) {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: usage: node tools/distValidator.js <testnet|mainnet>');
    process.exit(1);
}

if (!fs.existsSync(DIST)) {
    console.error('\x1b[31m%s\x1b[0m', `ERROR: ${DIST}/ was not created -- run \`yarn build ${BUILD}\` first`);
    process.exit(1);
}

// funcs.find() filters by substring, so '' matches every file below dist/.
const distFiles = funcs.find(DIST, '');

checkRequiredFiles();
checkRequestDirectories();
checkSharedBundles();
checkRewrites(distFiles);
checkConfig(BUILD);
checkFileTypes(distFiles);

const totalBytes = distFiles.reduce((sum, filePath) => sum + fs.statSync(filePath).size, 0);
console.log(`${DIST}/: ${distFiles.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB`);

if (hasErrors) process.exit(1);
