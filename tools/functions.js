const fs = require('fs');
const path = require('path');

/**
 * List directories in a directory
 *
 * @param {string} dirPath - Directory to search
 * @returns {string[]}
 */
function listDirectories(dirPath) {
    return fs.readdirSync(dirPath).filter(
        /**
         * @param {string} file
         * @returns {boolean}
         * */
        file => fs.statSync(path.join(dirPath, file)).isDirectory(),
    );
}

/**
 * Find all files recursively in specific folder with a specific ending, e.g:
 * findFilesInDir('./project/src', '.html')
 *
 * @param  {string} startPath - Path relative to this file or other file which requires this files
 * @param  {string} filter - Extension name, e.g: '.html'
 * @returns {string[]} - Result files with path string in an array
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
 * Get the filename without its file extension
 *
 * @param {string} fullPath
 * @returns {string}
 */
function stripExtension(fullPath) {
    return fullPath.split('/').slice(-1)[0].split('.')[0];
}

/**
 * Recursively collect class dependencies from files' global definitions.
 *
 * @param {string} startFile
 * @param {object} class2Path
 * @param {string[]} deps
 * @returns {string[]}
 */
function findDependencies(startFile, class2Path, deps) {
    // Create a new regex object to reset the readIndex
    const depRegEx = /global ([a-zA-Z0-9,\s]+) \*/g;

    // Get global variable
    const contents = fs.readFileSync(startFile).toString();
    /** @type {string[]} */
    let fileDeps = [];
    let fileDepMatch;
    while ((fileDepMatch = depRegEx.exec(contents)) !== null) { // eslint-disable-line no-cond-assign
        const fileDep = fileDepMatch[1];
        fileDeps = fileDeps.concat(fileDep.split(/,\s*/g));
    }

    fileDeps.forEach(dep => {
        // CustomError classes
        if (dep.slice(-5) === 'Error') dep = 'errors';
        if (dep === 'runKeyguard' || dep === 'loadNimiq') dep = 'common';

        if (deps.indexOf(dep) > -1) return;

        deps.push(dep);

        if (dep === 'Nimiq' || dep === 'CONFIG') return;

        const depPath = class2Path.get(dep);
        if (!depPath) throw new Error(`Unknown dependency ${dep} referenced from ${startFile}`);

        // deps are passed by reference
        findDependencies(depPath, class2Path, deps); // recurse
    });

    return deps;
}

/**
 * Retrieve all script pathes from an HTML file
 *
 * @param {string} indexPath
 * @returns {string[]}
 */
function findScripts(indexPath) {
    const scriptRegEx = /<script.+src="(.+)".*?>/g;

    const contents = fs.readFileSync(indexPath).toString();

    /** @type {string[]} */
    const scripts = [];
    let scriptMatch;
    while ((scriptMatch = scriptRegEx.exec(contents)) !== null) { // eslint-disable-line no-cond-assign
        const scriptPath = scriptMatch[1];
        scripts.push(scriptPath);
    }

    return scripts;
}

module.exports = {
    listDirectories,
    find,
    stripExtension,
    findDependencies,
    findScripts,
};
