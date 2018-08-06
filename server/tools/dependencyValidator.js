#!/usr/bin/env node

const funcs = require('./functions');

// Build class-path map
const class2Path = new Map();
funcs.find('src', '.js').forEach(file => {
    const className = funcs.stripExtension(file);
    class2Path.set(className, file);
});
class2Path.set('TRANSLATIONS', 'src/translations/index.js');
// Use this once key-derivation branch is merged:
// class2Path.set('Nimiq', 'https://cdn.nimiq.com/web-offline.js');
class2Path.set('Nimiq', 'https://cdn.nimiq-network.com/branches/key-derivation/web-offline.js');
class2Path.delete('index');

const requests = funcs.listDirectories('src/request');

// console.log("requests:", requests);
// console.log("class2Path:", class2Path);

let hasMissingScripts = false;
let hasUnneededScripts = false;

requests.forEach(/** @param {string} request */ request => {
    // Find entry file
    const entryFile = funcs.find(`src/request/${request}`, 'index.js')[0];
    // console.log("entryFile:", entryFile);

    if (!entryFile) throw new Error(`Request >${request}< has no index.js file`);

    // Collect API dependencies
    const deps = funcs.findDependencies(entryFile, class2Path, ['index']);
    // console.log("deps:", deps);

    const relativeDepsPaths = deps.map(dep => {
        if (dep === 'index') return 'index.js';
        const file = class2Path.get(dep);
        return file
            .replace(`src/request/${request}/`, '')
            .replace('src/request', '..')
            .replace('src', '../..');
    });
    // console.log("relativeDepsPaths:", relativeDepsPaths);

    // Get findScripts from index.html
    const scripts = funcs.findScripts(`src/request/${request}/index.html`);
    // console.log("scripts:", scripts);

    // Find missing and unneeded scripts
    const unneededScripts = scripts.slice();
    const missingScripts = relativeDepsPaths.filter(depPath => {
        const index = unneededScripts.indexOf(depPath);
        if (index > -1) unneededScripts.splice(index, 1);

        return scripts.indexOf(depPath) === -1;
    }).reverse();

    if (missingScripts.length) {
        hasMissingScripts = true;
        console.error('\x1b[31m%s\x1b[0m', `ERROR: Missing scripts in ${request}:`);
        console.log(missingScripts);
    }

    // console.log(unneededScripts);
    if (unneededScripts.length) {
        hasUnneededScripts = true;
        console.warn('\x1b[31m%s\x1b[0m', `Error: Unneeded scripts in ${request}:`);
        console.log(unneededScripts);
    }

    if (!missingScripts.length && !unneededScripts.length) {
        console.log('\x1b[32m%s\x1b[0m', `OK: Scripts complete in ${request}`);
    }
});

if (hasMissingScripts || hasUnneededScripts) process.exit(1);
