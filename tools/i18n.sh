#!/bin/bash
# This script is used to generate the src/translations/index.js file containing all translations

# Exit on first error
set -e

# Use default C locale to ensure consistent sorting despite the locale or the
# operating system.
export LC_ALL=C

FILES=$(ls -1 src/translations/*.json)
OUTPUT_FILE=src/translations/index.js

echo "/* eslint-disable */
const TRANSLATIONS = {" > $OUTPUT_FILE

for file in $FILES; do
    # retieving the 2 letter language code from the file path
    # example: `de` from `src/translations/de.json`
    basename=${file##*/}
    basename=${basename%.json}
    echo "${basename}: $(cat $file)," >> $OUTPUT_FILE
done

echo "};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
" >> $OUTPUT_FILE
