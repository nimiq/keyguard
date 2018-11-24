#!/bin/bash

# Note: Not sure if we use this. It's not straightforward to install on OSX
# if ! which envsubst > /dev/null 2>&1; then
#  echo "You don't seem to have envsubst yet. Go get it! Using sed as an" \
#    "alternative approach is to slow... :("
#  exit 1
# fi

# cleanup
rm -rf dist

# create folder structure
mkdir -p dist/request
mkdir -p dist/assets
mkdir -p dist/lib

# current git commit hash to create unique filenames to
# overwrite browser cache (inspired by Vue's build output)
HASH=$(git rev-parse --short=8 HEAD)

# bundle names
JS_BUNDLE="index.$HASH.js"
CSS_BUNDLE="index.$HASH.css"

# bundle files for each request
for DIR in src/request/*/ ; do
    REQUEST=$(basename $DIR)

    echo $REQUEST

    # create directory for request
    mkdir dist/request/$REQUEST

    # get all local js files included in request's index.html
    LIST_JS="$(grep '<script' $DIR/index.html | grep -v -E 'http://|https://' | cut -d\" -f2)"

    # concat them
    for url in $LIST_JS; do
       cat $DIR/$url >> dist/request/$REQUEST/$JS_BUNDLE
    done

    # get all local css files included in request's index.html
    LIST_CSS="$(grep '<link' $DIR/index.html | grep -v -E 'http://|https://' | cut -d\" -f4)"

    # concat them
    for url in $LIST_CSS; do
       cat $DIR/$url >> dist/request/$REQUEST/$CSS_BUNDLE
    done

    # replace scripts and links by bundle in built index.html
    # and replace CSP strings with ENV variables for configuration
    # XXX: using envsubst as a first suggestion. if it is kept, the one should
    #      make sure to whitelist only known environment variables in there :)
    # ENV_TO_REPLACE='' # e.g. '${VAR1} $VAR2'
    awk '
    BEGIN {
      skip_script = 0
      skip_link = 0
    }
    /<script.*https?/ {
      print
      next
    }
    /<script/ {
      # Replace first script tag with bundle, delete all others
      if (!skip_script) {
        skip_script = 1
        # Preserve whitespace / intendation. Note: 1 ist first array index in awk
        split($0, space, "<")
        print space[1] "<script defer src=\"/request/'${REQUEST}'/'${JS_BUNDLE}'\"></script>"
      }
      next
    }
    /<link.*https?/ {
      print
      next
    }
    /<link/ {
      if (!skip_link) {
        skip_link = 1
        split($0, space, "<")
        print space[1] "<link rel=\"stylesheet\" href=\"/request/'${REQUEST}'/'${CSS_BUNDLE}'\">"
      }
      next
    }
    { print }
    ' $DIR/index.html > dist/request/${REQUEST}/index.html

    # | envsubst "${ENV_TO_REPLACE}"
done

# copy assets
cp -rv src/assets/* dist/assets/
cp -v src/lib/QrScannerWorker* dist/lib/

