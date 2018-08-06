const fs = require('fs');
const { spawnSync } = require('child_process');

const localizedFiles = spawnSync('grep', ['-i', '-r', '-l', 'i18n', 'src'], { shell: true })
    .stdout.toString()
    .replace('src/lib/I18n.js\n', '')
    .replace('src/translations/index.js\n', '')
    .trim()
    .split('\n');

// console.log(localizedFiles);

/**
 * @param {string} filePath
 * @returns {object}
 */
function findI18nKeysAndStrings(filePath) {
    const textContentRegEx = /data-i18n="(.*?)".*?>(.*?)</g;
    const placeholderRegEx = /data-i18n-placeholder="(.*?)"(?:.*?placeholder="(.*?)")?/g;
    const phraseRegEx = /translatePhrase('(.*?)')/g;

    // Get global variable
    const contents = fs.readFileSync(filePath).toString();

    /** @type {object} */
    const dict = {};

    let textMatch;
    while ((textMatch = textContentRegEx.exec(contents)) !== null) { // eslint-disable-line no-cond-assign
        const key = textMatch[1];
        const phrase = textMatch[2];
        dict[key] = phrase;
    }

    let placeholderMatch;
    while ((placeholderMatch = placeholderRegEx.exec(contents)) !== null) { // eslint-disable-line no-cond-assign
        const key = placeholderMatch[1];
        const phrase = placeholderMatch[2] || '- not found -';
        dict[key] = phrase;
    }

    let phraseMatch;
    while ((phraseMatch = phraseRegEx.exec(contents)) !== null) { // eslint-disable-line no-cond-assign
        const key = phraseMatch[1];
        const phrase = false;
        dict[key] = phrase;
    }

    return dict;
}

const REF_DICT = {
    _language: 'English',
};

localizedFiles.forEach(filePath => {
    Object.assign(REF_DICT, findI18nKeysAndStrings(filePath));
});

// console.log(REF_DICT);

const DICT = require('../src/translations/index.js');

// console.log(DICT);

let allLanguagesComplete = true;

// Validate completeness of each language
Object.keys(DICT).forEach(lang => {
    const langDict = DICT[lang];
    let complete = true;

    Object.keys(REF_DICT).forEach(/** @param {string} key */ key => {
        if (!langDict[key]) {
            console.error('\x1b[31m%s\x1b[0m', `ERROR: Missing translation for >${lang}<: ${key}`);
            complete = false;
        } else if (lang === 'en') {
            // Strip line breaks and indentation
            const inDict = langDict[key].replace('/\n/g', '').replace(/\s+/g, ' ');
            const inRef = REF_DICT[key].replace('/\n/g', '').replace(/\s+/g, ' ');

            if (inDict !== inRef) {
                console.error(
                    '\x1b[33m%s\x1b[0m',
                    `WARN: Different english for >${key}< in dict vs. DOM:\n\t${inDict}\n\t${inRef}`,
                );
            }
        }
    });

    if (complete) {
        console.log('\x1b[32m%s\x1b[0m', `OK: Translation valid for >${lang}<`);
    } else {
        allLanguagesComplete = false;
    }
});

if (!allLanguagesComplete) process.exit(1);
