#!/usr/bin/env node

/*
 * Verifies that the ref being deployed is an annotated tag carrying a valid signature.
 *
 * The deploy is driven by a published release, so the tag under test is the release's tag
 * (TAG_NAME); for a manual workflow_dispatch it is whatever ref the run was started on.
 *
 * Chain of custody: deploy.sh cuts annotated, GPG-signed tags (`git tag -a -s`), and the SSH
 * deployment path carries that signature all the way to the server. This asserts the equivalent so
 * the S3 path is not a weaker way to ship the same bytes.
 *
 * GitHub validates the signature against the keys registered on the tagger's account, so there is
 * no keyring to manage on the runner. That also means this step needs nothing from the repository
 * beyond the ref name, and runs on the runner's preinstalled Node before any dependency is
 * installed or any build script is executed.
 *
 * Environment:
 *   GITHUB_TOKEN      required, needs `contents: read`
 *   TAG_NAME          the release's tag; falls back to the ref the run was started on
 *   ALLOW_UNSIGNED    'true' downgrades a signature failure to a warning (workflow_dispatch only).
 *                     It does not relax ALLOWED_TAGGERS, which is a separate question.
 *   ALLOWED_TAGGERS   optional comma-separated tagger allowlist; unset means "any valid signature"
 */

const API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';
const REPOSITORY = process.env.GITHUB_REPOSITORY;
const TAG_NAME = process.env.TAG_NAME || '';
const REF_NAME = TAG_NAME || process.env.GITHUB_REF_NAME;
// A release always carries a tag. Outside a release event, trust the ref the runner resolved.
const IS_TAG = !!TAG_NAME || process.env.GITHUB_REF_TYPE === 'tag';
const TOKEN = process.env.GITHUB_TOKEN;
const ALLOW_UNSIGNED = process.env.ALLOW_UNSIGNED === 'true';
const ALLOWED_TAGGERS = (process.env.ALLOWED_TAGGERS || '').split(',').map(entry => entry.trim()).filter(Boolean);

/**
 * Fail the step, unless the run explicitly opted out of signature enforcement -- in which case the
 * problem is downgraded to a warning and the caller stops looking at the signature, without ending
 * the run: the tagger allowlist still has to be applied. The remedy is only worth printing when the
 * deploy is actually being stopped.
 *
 * @param {string} problem
 * @param {string} [remedy]
 * @returns {null} no signer could be established, for the caller to pass on
 */
function reject(problem, remedy) {
    if (!ALLOW_UNSIGNED) {
        console.log(`::error::${problem}${remedy ? `. ${remedy}` : ''}`);
        process.exit(1);
    }
    console.log(`::warning::${problem}, continuing because allow_unsigned is set`);
    return null;
}

/**
 * Encode a ref for use in a URL path without escaping its separators, so that tags containing a
 * slash still address the right endpoint.
 *
 * @param {string} ref
 * @returns {string}
 */
function encodeRef(ref) {
    return ref.split('/').map(encodeURIComponent).join('/');
}

/**
 * @param {string} endpoint
 * @returns {Promise<any>}
 */
async function api(endpoint) {
    const response = await fetch(`${API_URL}/${endpoint}`, {
        headers: {
            accept: 'application/vnd.github+json',
            authorization: `Bearer ${TOKEN}`,
            'user-agent': 'nimiq-keyguard-deploy',
            'x-github-api-version': '2022-11-28',
        },
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        throw new Error(`GET ${endpoint} returned HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
}

/**
 * Resolve the ref to an annotated tag and check the signature GitHub verified for it.
 *
 * @returns {Promise<string|null>} the signer's email, or null if no signature could be verified and
 *                                 allow_unsigned permitted the run to go on regardless
 */
async function verifiedTagger() {
    if (!IS_TAG) {
        return reject(`'${REF_NAME}' is not a tag`,
            'Deploy a signed tag, or re-run workflow_dispatch with allow_unsigned=true.');
    }

    // Annotated tags point at a tag object; lightweight tags point straight at the commit and can
    // never carry a signature.
    const ref = await api(`repos/${REPOSITORY}/git/ref/tags/${encodeRef(/** @type {string} */ (REF_NAME))}`);
    if (ref.object.type !== 'tag') {
        return reject(`'${REF_NAME}' is a lightweight tag and cannot carry a signature`,
            'Cut deployable tags with `git tag -a -s`, as deploy.sh does.');
    }

    const tag = await api(`repos/${REPOSITORY}/git/tags/${ref.object.sha}`);
    const verification = tag.verification || {};
    const tagger = (tag.tagger && tag.tagger.email) || 'unknown';

    console.log(`tag ${REF_NAME}: verified=${verification.verified} reason=${verification.reason} tagger=${tagger}`);

    if (verification.verified !== true) {
        return reject(`tag ${REF_NAME} signature is not verified (${verification.reason})`,
            "Check that the signing key is registered on the tagger's GitHub account.");
    }

    return tagger;
}

/**
 * @returns {Promise<void>}
 */
async function main() {
    if (!TOKEN) {
        console.log('::error::GITHUB_TOKEN is not set');
        process.exit(1);
    }

    const tagger = await verifiedTagger();

    // Optional: restrict who may cut a deployable tag. An unset allowlist means "any valid
    // signature", which is already gated by the environment's required reviewers.
    //
    // Deliberately outside reject(): an untrusted signer is a different problem from an unsigned
    // tag, and allow_unsigned must not wave it through. Where the signature did not verify there is
    // no signer to compare, so an allowlist and allow_unsigned together cannot both be honoured --
    // the allowlist wins.
    if (ALLOWED_TAGGERS.length) {
        if (!tagger) {
            console.log(`::error::ALLOWED_TAGGERS is set, but '${REF_NAME}' has no verified signer to check`);
            process.exit(1);
        }
        if (!ALLOWED_TAGGERS.includes(tagger)) {
            console.log(`::error::tagger ${tagger} is not in ALLOWED_TAGGERS`);
            process.exit(1);
        }
    }

    if (tagger) console.log(`tag ${REF_NAME} is signed by ${tagger} and verified by GitHub`);
}

main().catch(/** @param {Error} error */ error => {
    console.log(`::error::${error.message}`);
    process.exit(1);
});
