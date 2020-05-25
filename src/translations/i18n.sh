#!/bin/bash

FICHIERS=$(ls -1 src/translations/*.json)
OUTPUT_FILE=src/translations/index.js

echo "/* eslint-disable */
const TRANSLATIONS = {" > $OUTPUT_FILE

for fichier in $FICHIERS; do
    basename=${fichier##*/}
    basename=${basename%.json}
    echo "${basename}: $(cat $fichier)," >> $OUTPUT_FILE
done

echo "};

if (typeof module !== 'undefined') module.exports = TRANSLATIONS;
else window.TRANSLATIONS = TRANSLATIONS;
" >> $OUTPUT_FILE
