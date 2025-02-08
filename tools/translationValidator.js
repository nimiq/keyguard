const fs = require('fs');
const { spawnSync } = require('child_process');

const localizedFiles = spawnSync('grep', ['-i', '-r', '-l', 'i18n', 'src'], { shell: true })
    .stdout.toString()
    .replace('src/translations/index.js\n', '')
    .trim()
    .split('\n');

// console.log(localizedFiles);

const REF_DICT = {
    _language: ['English'],
};

/**
 * @param {string} filePath
 */
function findI18nKeysAndStrings(filePath) {
    const textContentRegEx = /data-i18n="(.*?)".*?>\s*(.*?)\s*</gs;
    const placeholderRegEx = /data-i18n-placeholder="(.*?)"(?:.*?placeholder="(.*?)")?/g;
    const phraseRegEx = /translatePhrase\('(.*?)'/g;

    // Get global variable
    const contents = fs.readFileSync(filePath).toString();

    let textMatch;
    while ((textMatch = textContentRegEx.exec(contents)) !== null) { // eslint-disable-line no-cond-assign
        const key = textMatch[1];
        const phrase = textMatch[2];
        if (!REF_DICT[key]) {
            REF_DICT[key] = [];
        }
        REF_DICT[key].push(phrase);
    }

    let placeholderMatch;
    while ((placeholderMatch = placeholderRegEx.exec(contents)) !== null) { // eslint-disable-line no-cond-assign
        const key = placeholderMatch[1];
        const phrase = placeholderMatch[2] || '- not found -';
        if (!REF_DICT[key]) {
            REF_DICT[key] = [];
        }
        REF_DICT[key].push(phrase);
    }

    let phraseMatch;
    while ((phraseMatch = phraseRegEx.exec(contents)) !== null) { // eslint-disable-line no-cond-assign
        const key = phraseMatch[1];
        const phrase = false;
        if (!REF_DICT[key]) {
            REF_DICT[key] = [];
        }
        REF_DICT[key].push(phrase);
    }
}

localizedFiles.forEach(filePath => {
    findI18nKeysAndStrings(filePath); // Updates REF_DICT directly
});

// console.log(REF_DICT);

const DICT = require('../src/translations/index.js');

const unusedDICT = Object.assign({}, DICT.en);

// remove 24 validate words beforehand, as they are used as dynamic templatestrings.
for (let index = 1; index < 25; index++) {
    delete unusedDICT[`validate-words-${index}-hint`];
}

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
            delete unusedDICT[key];
            REF_DICT[key].forEach(ref => {
                const inRef = ref && ref.replace('/\n/g', '').replace(/\s+/g, ' ');
                if (inRef !== false && inDict !== inRef) {
                    console.error(
                        '\x1b[33m%s\x1b[0m',
                        `WARN: Different english for >${key}< in dict vs. DOM:\n\t${inDict}\n\t${inRef}`,
                    );
                }
            });
        }
    });

    if (complete) {
        console.log('\x1b[32m%s\x1b[0m', `OK: Translation valid for >${lang}<`);
    } else {
        allLanguagesComplete = false;
    }
});

if (Object.keys(unusedDICT).length) {
    console.error(
        '\x1b[33m%s\x1b[0m',
        'WARN: Unused in DOM:',
        unusedDICT,
    );
}

if (!allLanguagesComplete) process.exit(1);
