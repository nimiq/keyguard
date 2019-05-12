#!/bin/bash

# Exit on first error
set -e

output() {
    echo "$(tput bold) $1$(tput sgr0)"
}

# Check for a working implementation of sha256sum
SHA256SUM=""
which sha256sum > /dev/null && SHA256SUM="sha256sum"
# For (at least) MacPorts on MacOS, the GNU coreutils have been prefixed with 'g'
# to be easily seperateable from the BSD ones
[ -z "${SHA256SUM}" ] && which gsha256sum > /dev/null && SHA256SUM="gsha256sum"
# Yes, that leaves the possibility that the current version of shasum doesn't
# support the SHA256 algorithm. But I don't think that's rather common by now...
[ -z "${SHA256SUM}" ] && which shasum > /dev/null && SHA256SUM="shasum -a 256"

if [ -z "${SHA256SUM}" ]; then
  output "Please install sha256sum or shasum first."
  exit 1
fi

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
    OLD_PATH="\.\.\/\.\.\/\.\.\/node_modules\/@nimiq\/style\/nimiq-style.icons.svg"
    NEW_PATH="\/assets\/nimiq-style.icons.svg"

    sed -i -e "s/$OLD_PATH/$NEW_PATH/g" $1
}

# replace font url in file $1
replace_font_url() {
    OLD_PATH="(\.\.\/)*assets\/fonts"
    NEW_PATH="\/assets\/fonts"

    sed -i -r -e "s/$OLD_PATH/$NEW_PATH/g" $1
}

# Replace xxd -r -p with a nice bash function
function hex_to_binary() {
    for (( i=0; i<${#1}; i+=2 )); do
        printf "\x${1:$i:2}"
    done
}

# generate a base64 file integrity hash
make_file_hash() {
    hex_to_binary "$(${SHA256SUM} "$1" | cut -d' ' -f1)" | base64
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

echo "$hashsums" | ${SHA256SUM} --check

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
output "🛠️   Building request bundles"
for DIR in src/request/*/ ; do
    REQUEST=$(basename $DIR)

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
    LIST_CSS="$(grep '<link' $DIR/index.html | grep -v 'favicon' | grep -v 'bundle-' | grep -v -E 'http://|https://' | cut -d\" -f4)"

    # concat them
    for url in $LIST_CSS; do
        cat $DIR/$url >> dist/request/$REQUEST/$CSS_BUNDLE
    done

    # replace font url if css file exists
    if [ -f dist/request/$REQUEST/$CSS_BUNDLE ]; then
        replace_font_url dist/request/$REQUEST/$CSS_BUNDLE
    fi

    # collect bundle files
    LIST_JS_COMMON="$LIST_JS_COMMON$(grep '<script' $DIR/index.html | grep 'bundle-common' | cut -d\" -f2) "
    LIST_JS_TOPLEVEL="$LIST_JS_TOPLEVEL$(grep '<script' $DIR/index.html | grep 'bundle-toplevel' | cut -d\" -f2) "
done

# prepare bundle lists
LIST_JS_COMMON=$(echo $LIST_JS_COMMON | tr " " "\n" | sort -ur) # sort common bundle reverse for nicer order
LIST_JS_TOPLEVEL=$(echo $LIST_JS_TOPLEVEL | tr " " "\n" | sort -u)
# for CSS the order is very important, so sorting is not possible, thus we have to put the list here manually
LIST_CSS_TOPLEVEL="../../../node_modules/@nimiq/style/nimiq-style.min.css ../../nimiq-style.css ../../common.css ../../components/PasswordInput.css ../../components/PasswordBox.css"

# generate bundle files
output "📦  Generating common bundles"
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

replace_font_url dist/request/$CSS_TOPLEVEL_BUNDLE

# collect script integrity hashes
JS_COMMON_BUNDLE_HASH=$(make_file_hash dist/request/$JS_COMMON_BUNDLE)
JS_TOPLEVEL_BUNDLE_HASH=$(make_file_hash dist/request/$JS_TOPLEVEL_BUNDLE)
CSS_TOPLEVEL_BUNDLE_HASH=$(make_file_hash dist/request/$CSS_TOPLEVEL_BUNDLE)

CORE_LIB_PATH="/assets/nimiq"
CORE_LIB_HASH=$(make_file_hash node_modules/@nimiq/core-web/web-offline.js)

# process index.html scripts and links for each request
output "🛠️   Building request index.html files"
for DIR in src/request/*/ ; do
    REQUEST=$(basename $DIR)

    JS_BUNDLE_HASH=$(make_file_hash dist/request/$REQUEST/$JS_BUNDLE)
    if [ "$REQUEST" != "iframe" ]; then
        CSS_BUNDLE_HASH=$(make_file_hash dist/request/$REQUEST/$CSS_BUNDLE)
    fi

    # replace scripts and links by bundles in built index.html
    awk '
        BEGIN {
            skip_script = 0
            skip_link = 0
        }
        /<script.*web-offline\.js/ {
            split($0, space, "<") # Preserve intendation.
            print space[1] "<script defer src=\"'${CORE_LIB_PATH}'/web-offline.js\" integrity=\"sha256-'${CORE_LIB_HASH}'\"></script>"
            next
        }
        /<script/ {
            # Replace first script tag with bundles, delete all others
            if (!skip_script) {
                skip_script = 1
                split($0, space, "<") # Preserve intendation.
                print space[1] "<script defer src=\"/request/'${JS_COMMON_BUNDLE}'\" integrity=\"sha256-'${JS_COMMON_BUNDLE_HASH}'\"></script>"
                if("'$REQUEST'" != "iframe") {
                    print space[1] "<script defer src=\"/request/'${JS_TOPLEVEL_BUNDLE}'\" integrity=\"sha256-'${JS_TOPLEVEL_BUNDLE_HASH}'\"></script>"
                }
                print space[1] "<script defer src=\"/request/'${REQUEST}'/'${JS_BUNDLE}'\" integrity=\"sha256-'${JS_BUNDLE_HASH}'\"></script>"
            }
            next
        }
        /<link.*https?/ {
            print
            next
        }
        /<link.*favicon/{
            print
            next
        }
        /<link/ {
            if (!skip_link) {
                skip_link = 1
                split($0, space, "<") # Preserve intendation.
                print space[1] "<link rel=\"stylesheet\" href=\"/request/'${CSS_TOPLEVEL_BUNDLE}'\" integrity=\"sha256-'${CSS_TOPLEVEL_BUNDLE_HASH}'\">"
                print space[1] "<link rel=\"stylesheet\" href=\"/request/'${REQUEST}'/'${CSS_BUNDLE}'\" integrity=\"sha256-'${CSS_BUNDLE_HASH}'\">"
            }
            next
        }
        { print }
    ' $DIR/index.html > dist/request/${REQUEST}/index.html

    replace_icon_sprite_url dist/request/${REQUEST}/index.html
done

# copy root redirect script
cp src/redirect.js dist

# replace scripts in redirect page and output result in dist
REDIRECT_HASH=$(make_file_hash dist/redirect.js)
awk '
    BEGIN {
        skip_script = 0
        skip_link = 0
    }
    /<script/ {
        # Replace first script tag
        if (!skip_script) {
            skip_script = 1
            # Preserve whitespace / intendation. Note: 1 is first array index in awk
            split($0, space, "<")
            print space[1] "<script defer src=\"/request/'${JS_COMMON_BUNDLE}'\" integrity=\"sha256-'${JS_COMMON_BUNDLE_HASH}'\"></script>"
            print space[1] "<script defer src=\"/redirect.js\" integrity=\"sha256-'${REDIRECT_HASH}'\"></script>"
        }
        next
    }
    { print }
' src/index.html > dist/index.html
# make redirect file available at /request/ too
cp dist/index.html dist/request

# copy assets
output "🐑  Copying static assets"
cp -v favicon.ico dist
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
