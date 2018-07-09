#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * @param {string} p - Directory to search
 */
function listDirectories(p) {
    return fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
}

/**
 * Find all files recursively in specific folder with specific extension, e.g:
 * findFilesInDir('./project/src', '.html') ==> ['./project/src/a.html','./project/src/build/index.html']
 * @param  {string} startPath    Path relative to this file or other file which requires this files
 * @param  {string} filter       Extension name, e.g: '.html'
 * @return {string[]}               Result files with path string in an array
 */
function find(startPath, filter) {
    /** @type {string[]} */
    let results = [];

    if (!fs.existsSync(startPath)) {
        throw new Error(`${startPath} does not exist`);
    }

    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            results = results.concat(find(filename, filter)); // recurse
        } else if (filename.indexOf(filter) >= 0) {
            results.push(filename);
        }
    }

    return results;
}

/**
 * @param {string} path
 */
function classNameFromPath(path) {
    return path.split('/').slice(-1)[0].split('.')[0]
}

// Build class-path map
const classPath = new Map();
find('src', '.js').forEach(file => {
    const className = classNameFromPath(file);
    classPath.set(className, file);
});
classPath.set('TRANSLATIONS', 'src/translations/index.js');
classPath.set('Nimiq', 'https://cdn.nimiq.com/web-offline.js');
classPath.delete('index');

/**
 * Recursively collect class dependencies from files' global definitions.
 *
 * @param {string} startFile
 * @param {string[]} deps
 */
function findDependencies(startFile, deps) {

    // Create a new regex object to reset the readIndex
    const depRegEx = /global ([a-zA-Z0-9,\s]+) \*/g;

    // Get global variable
    const contents = fs.readFileSync(startFile).toString();
    /** @type {string[]} */
    let fileDeps = [];
    let fileDepMatch;
    while ((fileDepMatch = depRegEx.exec(contents)) !== null) {
        const fileDep = fileDepMatch[1];
        fileDeps = fileDeps.concat(fileDep.split(/,\s*/g));
    }

    fileDeps.forEach(dep => {
        // CustomError classes
        if (dep.slice(-5) === 'Error') dep = 'errors';
        if (dep === 'runKeyguard') dep = 'common';

        if (deps.indexOf(dep) > -1) return;

        deps.push(dep);

        if (dep === 'Nimiq') return;

        const depPath = classPath.get(dep);
        if (!depPath) throw new Error(`Unknown dependency: ${dep}`);

        // deps are passed by reference
        findDependencies(depPath, deps); // recurse
    });

    return deps;
}

/**
 * @param {string} indexPath
 */
function findScripts(indexPath) {
    const scriptRegEx = /<script.+src="(.+)".*?>/g;

    const contents = fs.readFileSync(indexPath).toString();

    /** @type {string[]} */
    const scripts = [];
    let scriptMatch;
    while ((scriptMatch = scriptRegEx.exec(contents)) !== null) {
        const scriptPath = scriptMatch[1];
        scripts.push(scriptPath);
    }

    return scripts;
}

const requests = listDirectories('src/request');

// console.log("requests:", requests);
// console.log("classPath:", classPath);

let hasMissingScripts = false;
let hasUnneededScripts = false;

console.log(); // Print empty line

requests.forEach(request => {
    // Find API class
    const apiFile = find(`src/request/${request}`, 'Api.js')[0];
    // console.log("apiFile:", apiFile);

    if (!apiFile) throw new Error(`Request >${request}< has no API class file`);

    // Collect API dependencies
    const deps = findDependencies(apiFile, [classNameFromPath(apiFile)]);
    // console.log("deps:", deps);

    const relativeDepsPaths = deps.map(dep => {
        const file = classPath.get(dep);
        return file
            .replace(`src/request/${request}/`, '')
            .replace('src/request', '..')
            .replace('src', '../..');
    });
    // console.log("relativeDepsPaths:", relativeDepsPaths);

    // Get findScripts from index.html
    const scripts = findScripts(`src/request/${request}/index.html`);
    // console.log("scripts:", scripts);

    // Find missing and unneeded scripts
    const unneededScripts = scripts.slice();
    const missingScripts = relativeDepsPaths.filter(depPath => {
        const index = unneededScripts.indexOf(depPath);
        index > -1 && unneededScripts.splice(index, 1);

        return scripts.indexOf(depPath) === -1;
    }).reverse();

    if (missingScripts.length) {
        hasMissingScripts = true;
        console.error('\x1b[31m%s\x1b[0m', `ERROR: Missing scripts in ${request}:`);
        console.log(missingScripts);
        console.log(); // Print empty line
    }

    // console.log(unneededScripts);
    if (unneededScripts.length) {
        hasUnneededScripts = true;
        console.warn('\x1b[33m%s\x1b[0m', `WARN: Unneeded scripts in ${request}:`);
        console.log(unneededScripts);
        console.log(); // Print empty line
    }

    if (!missingScripts.length && !unneededScripts.length) {
        console.log('\x1b[32m%s\x1b[0m', `OK: Scripts complete in ${request}`);
        console.log(); // Print empty line
    }
});

if (hasMissingScripts || hasUnneededScripts) process.exit(1);
