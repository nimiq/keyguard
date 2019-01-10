#!/bin/bash

# execute config file given as parameter; default to testnet
CONFIG_FILE=testnet
if [ "$1" != "" ]; then
    CONFIG_FILE="$1"
fi

if [ ! -f config/$CONFIG_FILE.conf ]; then
    echo "Config file not found!"
    exit 1
fi

source config/$CONFIG_FILE.conf

# replace string $1 by environment variable $2 in file $3
replace_config_variable() {
    VARNAME="$2"

    VALUE=$(ECHO "${!VARNAME}")

    if [ "$VALUE" != "" ]; then
        sed -i -e "s/$1/$VALUE/g" $3
    fi
}

# ease configuration of allowed origin by adding quotes
if [ "$KEYGUARD_ALLOWED_ORIGIN" != "" ]; then
    KEYGUARD_ALLOWED_ORIGIN="'$KEYGUARD_ALLOWED_ORIGIN'"
fi

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

JS_COMMON_BUNDLE="common.$HASH.js"
JS_TOPLEVEL_BUNDLE="toplevel.$HASH.js"
CSS_TOPLEVEL_BUNDLE="toplevel.$HASH.css"

# bundle files for each request
for DIR in src/request/*/ ; do
    REQUEST=$(basename $DIR)

    echo $REQUEST

    # create directory for request
    mkdir dist/request/$REQUEST

    # get all local js files included in request's index.html, which are not in a bundle
    LIST_JS="$(grep '<script' $DIR/index.html | grep -v 'bundle-' | grep -v -E 'http://|https://' | cut -d\" -f2)"

    # concat them
    for url in $LIST_JS; do
        cat $DIR/$url >> dist/request/$REQUEST/$JS_BUNDLE
    done

    replace_config_variable "CONFIG_ALLOWED_ORIGIN" "KEYGUARD_ALLOWED_ORIGIN" dist/request/$REQUEST/$JS_BUNDLE

    # get all local css files included in request's index.html, which are not in a bundle
    LIST_CSS="$(grep '<link' $DIR/index.html | grep -v 'bundle-' | grep -v -E 'http://|https://' | cut -d\" -f4)"

    # concat them
    for url in $LIST_CSS; do
        cat $DIR/$url >> dist/request/$REQUEST/$CSS_BUNDLE
    done

    # collect bundle files
    LIST_JS_COMMON="$LIST_JS_COMMON$(grep '<script' $DIR/index.html | grep 'bundle-common' | cut -d\" -f2) "
    LIST_JS_TOPLEVEL="$LIST_JS_TOPLEVEL$(grep '<script' $DIR/index.html | grep 'bundle-toplevel' | cut -d\" -f2) "

    # replace scripts and links by bundles in built index.html
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
            # Replace first script tag with bundles, delete all others
            if (!skip_script) {
                skip_script = 1
                # Preserve whitespace / intendation. Note: 1 is first array index in awk
                split($0, space, "<")
                print space[1] "<script defer src=\"/request/'${JS_COMMON_BUNDLE}'\"></script>"
                if("'$REQUEST'" != "iframe") {
                    print space[1] "<script defer src=\"/request/'${JS_TOPLEVEL_BUNDLE}'\"></script>"
                }
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
                print space[1] "<link rel=\"stylesheet\" href=\"/request/'${CSS_TOPLEVEL_BUNDLE}'\">"
                print space[1] "<link rel=\"stylesheet\" href=\"/request/'${REQUEST}'/'${CSS_BUNDLE}'\">"
            }
            next
        }
        { print }
    ' $DIR/index.html > dist/request/${REQUEST}/index.html

    replace_config_variable "https:\/\/cdn.nimiq-testnet.com" "KEYGUARD_CDN" dist/request/${REQUEST}/index.html
done

# prepare bundle lists
LIST_JS_COMMON=$(echo $LIST_JS_COMMON | tr " " "\n" | sort -ur) # sort common bundle reverse for nicer order
LIST_JS_TOPLEVEL=$(echo $LIST_JS_TOPLEVEL | tr " " "\n" | sort -u)
# for CSS the order is very important, so sorting is not possible, thus we have to put the list here manually
LIST_CSS_TOPLEVEL="../../../node_modules/@nimiq/style/nimiq-style.min.css ../../../node_modules/@nimiq/style/nimiq-style-icons.min.css ../../nimiq-style.css ../../common.css ../../components/PassphraseInput.css ../../components/PassphraseBox.css"

# generate bundle files
# (since all urls are relative to request directories, we simply use the create request directory as the base)
for url in $LIST_JS_COMMON; do
    cat src/request/create/$url >> dist/request/$JS_COMMON_BUNDLE
    replace_config_variable "CONFIG_ALLOWED_ORIGIN" "KEYGUARD_ALLOWED_ORIGIN" dist/request/$JS_COMMON_BUNDLE
done
for url in $LIST_JS_TOPLEVEL; do
    cat src/request/create/$url >> dist/request/$JS_TOPLEVEL_BUNDLE
    replace_config_variable "CONFIG_ALLOWED_ORIGIN" "KEYGUARD_ALLOWED_ORIGIN" dist/request/$JS_COMMON_BUNDLE
done
for url in $LIST_CSS_TOPLEVEL; do
    cat src/request/create/$url >> dist/request/$CSS_TOPLEVEL_BUNDLE
done

# copy assets
cp -rv src/assets/* dist/assets/
cp -v src/lib/QrScannerWorker* dist/lib/

