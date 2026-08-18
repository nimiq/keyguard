#!/usr/bin/env node

/*
 * Refuses to deploy a commit whose CI never passed.
 *
 * A release can be cut from any commit, and publishing one is a decision to ship rather than
 * evidence that the code holds up. `Complete Check` (.github/workflows/complete-check.yml) runs
 * typecheck, lint, tests, both builds and the dist/ validation on every push, so its conclusion for
 * this exact commit is that evidence -- and nothing else in the deploy re-establishes it: the
 * workflow only builds.
 *
 * A check that is still running is waited out rather than failed, because cutting a release
 * immediately after a push is normal and the deploy has a reviewer to wait for anyway.
 *
 * Environment:
 *   GITHUB_TOKEN           required, needs `checks: read`
 *   GITHUB_SHA             the commit to judge
 *   ALLOW_FAILING_CHECKS   'true' downgrades every failure below to a warning (dispatch only)
 *   CHECKS_TIMEOUT_SECONDS how long to wait for a check that has not finished yet, default 900
 */

const { api } = require('./github-api');

const REPOSITORY = process.env.GITHUB_REPOSITORY;
const SHA = process.env.GITHUB_SHA;
const ALLOW_FAILING = process.env.ALLOW_FAILING_CHECKS === 'true';
const TIMEOUT_MS = Number(process.env.CHECKS_TIMEOUT_SECONDS || 900) * 1000;
const POLL_INTERVAL_MS = 20000;

/**
 * The check runs that must have passed, by the name GitHub reports them under: a check run is named
 * after the job that produced it, so this is complete-check.yml's `build` job. Rename that job and
 * this has to follow -- which is the point, since a check nobody can find is a check nobody runs.
 */
const REQUIRED = ['build'];

/** What a check run may conclude with and still count as passed. */
const ACCEPTED = new Set(['success', 'skipped', 'neutral']);

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => { setTimeout(resolve, ms); });
}

/**
 * The most recent run of each check on this commit, keyed by name. A re-run leaves the earlier
 * attempt in the list, and it is the latest attempt that decides.
 *
 * @returns {Promise<Map<string, any>>}
 */
async function latestCheckRuns() {
    const response = await api(`repos/${REPOSITORY}/commits/${SHA}/check-runs?per_page=100`);

    /** @type {Map<string, any>} */
    const latest = new Map();
    for (const run of response.check_runs || []) {
        const previous = latest.get(run.name);
        if (!previous || (run.started_at || '') >= (previous.started_at || '')) latest.set(run.name, run);
    }
    return latest;
}

/**
 * The required checks that have not reported a completed run yet.
 *
 * @param {Map<string, any>} runs
 * @returns {string[]}
 */
function unfinishedChecks(runs) {
    return REQUIRED.filter(name => !runs.has(name) || runs.get(name).status !== 'completed');
}

/**
 * Judge one required check against the runs that reported.
 *
 * @param {Map<string, any>} runs
 * @param {string} name
 * @returns {string|null} what is wrong with it, or null if it passed
 */
function problemWith(runs, name) {
    const run = runs.get(name);
    if (!run) return `no check run named '${name}' ever reported for ${SHA}`;
    if (run.status !== 'completed') return `check '${name}' is still ${run.status} (${run.html_url})`;
    if (!ACCEPTED.has(run.conclusion)) return `check '${name}' concluded '${run.conclusion}' (${run.html_url})`;
    console.log(`check '${name}': ${run.conclusion}`);
    return null;
}

/**
 * @returns {Promise<void>}
 */
async function main() {
    const deadline = Date.now() + TIMEOUT_MS;

    /** @type {Map<string, any>} */
    let runs = new Map();

    do {
        // eslint-disable-next-line no-await-in-loop
        runs = await latestCheckRuns();
        const unfinished = unfinishedChecks(runs);
        if (!unfinished.length) break;
        console.log(`waiting for ${unfinished.join(', ')} on ${SHA}`);
        // eslint-disable-next-line no-await-in-loop
        if (Date.now() < deadline) await sleep(POLL_INTERVAL_MS);
    } while (Date.now() < deadline);

    const problems = REQUIRED.map(name => problemWith(runs, name)).filter(Boolean);

    if (!problems.length) {
        console.log(`${SHA} passed ${REQUIRED.join(', ')}`);
        return;
    }

    problems.forEach(problem => {
        if (ALLOW_FAILING) {
            console.log(`::warning::${problem}, continuing because allow_failing_checks is set`);
        } else {
            console.log(`::error::${problem}`);
        }
    });

    if (!ALLOW_FAILING) process.exit(1);
}

main().catch(/** @param {Error} error */ error => {
    console.log(`::error::${error.message}`);
    process.exit(1);
});
