#!/bin/bash

# Exit on first error
set -e

output() {
    echo "$(tput bold) $1$(tput sgr0)"
}

# execute config file given as parameter; default to testnet
BUILD=testnet
if [ "$1" != "" ]; then
    BUILD="$1"
fi

if [ ! -f src/config/config.$BUILD.js ]; then
    output "💥  Config file './src/config/config.$BUILD.js' not found!"
    exit 1
fi

output "🎩  Using config file src/config/config.$BUILD.js"

# replace icon sprite URL in file $1
replace_icon_sprite_url() {
    OLD_PATH="..\/..\/..\/node_modules\/@nimiq\/style\/nimiq-style.icons.svg"
    NEW_PATH="\/assets\/nimiq-style.icons.svg"

    sed -i -e "s/$OLD_PATH/$NEW_PATH/g" $1
}

# replace core lib URL in file $1
replace_core_lib_url() {
    OLD_PATH="..\/..\/..\/node_modules\/@nimiq\/core-web"
    NEW_PATH="\/assets\/nimiq"

    sed -i -e "s/$OLD_PATH/$NEW_PATH/g" $1
}

# Before writing any files, verify integrity of Nimiq lib
output "🧐  Validating Nimiq Core files integrity"

# For Nimiq Core v1.4.3
hashsums=\
"131abbc8c240d8c887bb48370f0c8d902d2a8f3a40ffb2aa629b98add599c9b6  node_modules/@nimiq/core-web/web-offline.js
 a658ca600c43789c8daff47578ea5758e7a1a2a5fee1b249e7bb5ce691d126cd  node_modules/@nimiq/core-web/worker-wasm.wasm
 d61df01adc927cb2832314ef5634b9ea97092acacb09beb7628b1a98a0962c70  node_modules/@nimiq/core-web/worker-wasm.js
 154b1251428363c8658c99acbf55b31eef177c0d447767a506952924a37494a9  node_modules/@nimiq/core-web/worker-js.js
 5670830478ac20a634b1436cd24cc3ba2eda23e8f8a7a30f54958920046435ce  node_modules/@nimiq/core-web/worker.js"

echo "$hashsums" | sha256sum --check

if [ ! $? -eq 0 ]; then
    output "💥  Nimiq Core file integrity check failed!"
    exit 1;
fi

# cleanup
output "💣  Clearing dist directory"
rm -rf dist

# create folder structure
output "👷  Creating folder structure"
mkdir -p dist/request
mkdir -p dist/assets/nimiq
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

    output "🛠️   Building request $REQUEST"

    # create directory for request
    mkdir dist/request/$REQUEST

    # get all local js files included in request's index.html, which are not in a bundle and not marked as manual
    LIST_JS="$(grep '<script' $DIR/index.html | grep -v 'bundle-' | grep -v -E 'manual' | cut -d\" -f2)"

    # concat them
    for url in $LIST_JS; do
        cat $DIR/$url >> dist/request/$REQUEST/$JS_BUNDLE
    done

    replace_icon_sprite_url dist/request/$REQUEST/$JS_BUNDLE

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
        /<script.*web-offline\.js/ {
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

    replace_core_lib_url dist/request/${REQUEST}/index.html
    replace_icon_sprite_url dist/request/${REQUEST}/index.html
done

# prepare bundle lists
LIST_JS_COMMON=$(echo $LIST_JS_COMMON | tr " " "\n" | sort -ur) # sort common bundle reverse for nicer order
LIST_JS_TOPLEVEL=$(echo $LIST_JS_TOPLEVEL | tr " " "\n" | sort -u)
# for CSS the order is very important, so sorting is not possible, thus we have to put the list here manually
LIST_CSS_TOPLEVEL="../../../node_modules/@nimiq/style/nimiq-style.min.css ../../nimiq-style.css ../../common.css ../../components/PasswordInput.css ../../components/PasswordBox.css"

# generate bundle files
output "📦  Generating bundle files"
# put constants and config first
cat src/lib/Constants.js >> dist/request/$JS_COMMON_BUNDLE
cat src/config/config.$BUILD.js >> dist/request/$JS_COMMON_BUNDLE
# (since all urls are relative to request directories, we simply use the create request directory as the base)
for url in $LIST_JS_COMMON; do
    cat src/request/create/$url >> dist/request/$JS_COMMON_BUNDLE
done

replace_icon_sprite_url dist/request/$JS_COMMON_BUNDLE

for url in $LIST_JS_TOPLEVEL; do
    cat src/request/create/$url >> dist/request/$JS_TOPLEVEL_BUNDLE
done

replace_icon_sprite_url dist/request/$JS_TOPLEVEL_BUNDLE

for url in $LIST_CSS_TOPLEVEL; do
    cat src/request/create/$url >> dist/request/$CSS_TOPLEVEL_BUNDLE
done

# copy assets
output "🐑  Copying static assets"
cp -rv src/assets/* dist/assets/
cp -v src/lib/QrScannerWorker.js dist/lib/
cp -v node_modules/@nimiq/style/nimiq-style.icons.svg dist/assets/
# copy service worker (which has to be in root to work)
cp -v src/ServiceWorker.js dist

# copy Nimiq files
output "‼️   Copying Nimiq files"
cp -v node_modules/@nimiq/core-web/web-offline.js \
      node_modules/@nimiq/core-web/web-offline.js.map \
      node_modules/@nimiq/core-web/worker-wasm.wasm \
      node_modules/@nimiq/core-web/worker-wasm.js \
      node_modules/@nimiq/core-web/worker-js.js \
      node_modules/@nimiq/core-web/worker.js \
      node_modules/@nimiq/core-web/worker.js.map \
      dist/assets/nimiq

output "✔️   Finished building into ./dist"
