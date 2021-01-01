#!/bin/bash
# This script is used to generate the src/translations/index.js file containing all translations

# Exit on first error
set -e

# Use default C locale to ensure consistent sorting despite the locale or the
# operating system.
export LC_ALL=C

SUPPORTED_LANGUAGES="de en es fr ru uk zh"
OUTPUT_FILE=src/translations/index.js

echo "/* eslint-disable */
const TRANSLATIONS = {" > $OUTPUT_FILE

for lang in $SUPPORTED_LANGUAGES; do
    file=src/translations/${lang}.json
    echo "${lang}: $(cat $file)," >> $OUTPUT_FILE
done

echo "};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
" >> $OUTPUT_FILE
