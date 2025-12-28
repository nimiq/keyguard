#!/bin/bash

# Exit on first error
set -e

# Use default C locale to ensure consistent sorting despite the locale or the
# operating system.
export LC_ALL=C

output() {
    echo "$(tput bold) $1$(tput sgr0)"
}

# Check for a working implementation of sha256sum
SHA256SUM=""
command -v sha256sum > /dev/null && SHA256SUM="sha256sum"
# For (at least) MacPorts on MacOS, the GNU coreutils have been prefixed with 'g'
# to be easily seperateable from the BSD ones
[ -z "${SHA256SUM}" ] && command -v gsha256sum > /dev/null && SHA256SUM="gsha256sum"
# Yes, that leaves the possibility that the current version of shasum doesn't
# support the SHA256 algorithm. But I don't think that's rather common by now...
[ -z "${SHA256SUM}" ] && command -v shasum > /dev/null && SHA256SUM="shasum -a 256"

if [ -z "${SHA256SUM}" ]; then
  output "Please install sha256sum or shasum first."
  exit 1
fi

# Detecting whether we're using GNU or BSD sed. There is a small but significant
# idiosyncrasy regarding the inplace option (-i).
# Fair warning: Yes, that's quite a hack, but distinguishing GNU and BSD utils
# isn't that easy.
if sed --in-place 2>&1 | head -1 | grep -q "illegal"; then
  # For BSD
  function inplace_sed() {
    sed -i "" "$@"
  }
else
  # For GNU
  function inplace_sed() {
    sed -i"" "$@"
  }
fi

# execute config file given as parameter
if [ -z "$1" ]; then
    echo "ERROR: Please specify which network to build for by appending 'testnet' or 'mainnet' to the build command."
    exit 1
fi

if [ "$1" != "" ]; then
    BUILD="$1"
fi

if [ ! -f src/config/config.$BUILD.js ]; then
    output "💥  Config file './src/config/config.$BUILD.js' not found!"
    exit 1
fi

output "🎩  Using config file src/config/config.$BUILD.js"

# replace Nimiq PoS import path in file $1
replace_nimiq_import_path() {
    OLD_PATH="\.\.\/\.\.\/node_modules\/@nimiq\/core"
    NEW_PATH="\.\.\/assets\/nimiq-pos"

    inplace_sed "s/$OLD_PATH/$NEW_PATH/g" $1
}

# replace icon sprite URL in file $1
replace_icon_sprite_url() {
    OLD_PATH="\.\.\/\.\.\/\.\.\/node_modules\/@nimiq\/style\/nimiq-style.icons.svg"
    NEW_PATH="\/assets\/nimiq-style.icons.svg"

    inplace_sed "s/$OLD_PATH/$NEW_PATH/g" $1
}

# add file hash to file name and return new file name
add_hash_to_file_name() {
    filename=$(basename $1)
    dirname=$(dirname $1)
    hash=$(${SHA256SUM} "$1" | cut -c -8)
    newname=${filename/HASH/$hash}

    mv $1 $dirname/$newname
    echo $newname
}

# replace font url in file $1
replace_font_url() {
    OLD_PATH="(\.\.\/)*assets\/fonts"
    NEW_PATH="\/assets\/fonts"

    inplace_sed -E "s/$OLD_PATH/$NEW_PATH/g" $1
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

# Before writing any files, verify integrity of Nimiq PoW lib
output "🧐  Validating Nimiq PoW files integrity"

nimiq_pow_hashsums=\
"8edc158d4a0e2baece54262aa5817e3db44946d3c8af9271fd9f4bc7b4fde91e  node_modules/@nimiq/core-web/web-offline.js
 a658ca600c43789c8daff47578ea5758e7a1a2a5fee1b249e7bb5ce691d126cd  node_modules/@nimiq/core-web/worker-wasm.wasm
 d61df01adc927cb2832314ef5634b9ea97092acacb09beb7628b1a98a0962c70  node_modules/@nimiq/core-web/worker-wasm.js
 154b1251428363c8658c99acbf55b31eef177c0d447767a506952924a37494a9  node_modules/@nimiq/core-web/worker-js.js
 272dae22e5235f17526ba19a60b2418f1b5926e0f7e683f782bd54aa6db3b945  node_modules/@nimiq/core-web/worker.js"
echo "$nimiq_pow_hashsums" | ${SHA256SUM} --check

if [ ! $? -eq 0 ]; then
    output "💥  Nimiq PoW file integrity check failed!"
    exit 1;
fi

# Before writing any files, verify integrity of Nimiq PoS lib
output "🧐  Validating Nimiq PoS files integrity"

nimiq_pos_hashsums=\
"49bf18fbd44ca9b3bf8b331508f92d2fe48087a27c7d0034120fc7fc0d383951  node_modules/@nimiq/core/launcher/browser/client-proxy.mjs
 955cceee2e144efe114fec23ae202e010dae6edd12ef802d0d239fb36fdf537f  node_modules/@nimiq/core/launcher/browser/cryptoutils-worker-proxy.mjs
 f26f70a14ee0ffa85261500dd786f51aa6051e523c9a4627ab8ba064ff8934dc  node_modules/@nimiq/core/launcher/browser/transfer-handlers.mjs
 f00e4c72cdbc653dfcc426c80337c0555f0b94b8883bd791b324aa95edfd498a  node_modules/@nimiq/core/lib/web/index.mjs
 0ec8db9acefe632eb46205a9cd7de4351bafb83fad792508b0f61449ccf9f4ec  node_modules/@nimiq/core/web/comlink.min.js
 64a91ba6922851ba36ba21944bcc6a14e8a57f805203fa92925190175a882297  node_modules/@nimiq/core/web/comlink.min.js.map
 7b8c1509c4e7ec89948110c9f459409d381d1ee92b0a0d30bf112a568a8fc7a6  node_modules/@nimiq/core/web/comlink.min.mjs
 e8d70f535e0d6d1bca2dfb7a8afb96b068f87c1e0b44d864e0b54d8ec4589173  node_modules/@nimiq/core/web/comlink.min.mjs.map
 dd9833c434200f9338f01eac7e5462dfa146b235bc0ab57ed846bf076f6c5cd3  node_modules/@nimiq/core/web/crypto.js
 7d22aeda13488a0f5a9d92064f3e66335c40c33c00c875ae255dd8a23b5804b7  node_modules/@nimiq/core/web/crypto-wasm/index_bg.wasm
 7a6a3507481a5f9e943a2e77735712640e63fa02908722f1cf5b651e0751ff95  node_modules/@nimiq/core/web/crypto-wasm/index.js
 7a48cc3f66857626c3c175ba6688bd1cfd54abdfffe90388fa291494b9e1a261  node_modules/@nimiq/core/web/index.js
 2a6bc25e8a4e0de114a44eb19a817d9ac8a8ff33dbd9332ee91b758c578d92a2  node_modules/@nimiq/core/web/main-wasm/index_bg.wasm
 03830c861d0d7fe0c801f8f8e9133c18f1fc9e50f769c6b9df89ba497e13bae6  node_modules/@nimiq/core/web/main-wasm/index.js
 0436d25dd54159b106c7d2f5f37d1710fd029dca60a067898a20a89218a74d1c  node_modules/@nimiq/core/web/worker.js
 d8fa020399ac535d9c948c1be04d48739e7f4d7310c1a3a500def16419d65883  node_modules/@nimiq/core/web/worker-wasm/index_bg.wasm
 7807684cf26c9b4972ec607bb7fe9fa81ade11da2678d60bcb94132466ed7ec5  node_modules/@nimiq/core/web/worker-wasm/index.js"
echo "$nimiq_pos_hashsums" | ${SHA256SUM} --check

if [ ! $? -eq 0 ]; then
    output "💥  Nimiq PoS file integrity check failed!"
    exit 1;
fi

# Before writing any files, verify integrity of Bitcoin lib
output "🧐  Validating BitcoinJS file integrity"

# For bitcoinjs-lib v5.2.0 and Buffer v5.6.0
bitcoinjs_hashsum="5a02ae59046a7ee4f386f5828097aa21bdf52657acca4ae472d5e89e8332ba43  src/lib/bitcoin/BitcoinJS.js"
echo "$bitcoinjs_hashsum" | ${SHA256SUM} --check

if [ ! $? -eq 0 ]; then
    output "💥  BitcoinJS file integrity check failed!"
    exit 1;
fi

# Before writing any files, verify integrity of Ethers lib
output "🧐  Validating EthersJS file integrity"

ethersjs_hashsum="943c82a542394951457cd34743ba694b199b841fe02870c199a0aca411ed14d0  node_modules/ethers/dist/ethers.umd.js"
echo "$ethersjs_hashsum" | ${SHA256SUM} --check

if [ ! $? -eq 0 ]; then
    output "💥  EthersJS file integrity check failed!"
    exit 1;
fi

# cleanup
output "💣  Clearing dist directory"
rm -rf dist

# create folder structure
output "👷  Creating folder structure"
mkdir -p dist/request
mkdir -p dist/assets/nimiq-pow
mkdir -p dist/assets/nimiq-pos
mkdir -p dist/lib
mkdir -p dist/lib/rsa/sandboxed

# bundle names
JS_BUNDLE="index.HASH.js"
CSS_BUNDLE="index.HASH.css"

JS_COMMON_BUNDLE="common.HASH.js"
JS_TOPLEVEL_BUNDLE="toplevel.HASH.js"
JS_BITCOIN_BUNDLE="bitcoin.HASH.js"
JS_POLYGON_BUNDLE="polygon.HASH.js"
CSS_TOPLEVEL_BUNDLE="toplevel.HASH.css"

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
    LIST_JS_BITCOIN="$LIST_JS_BITCOIN$(grep '<script' $DIR/index.html | grep 'bundle-bitcoin' | cut -d\" -f2) "
    LIST_JS_POLYGON="$LIST_JS_POLYGON$(grep '<script' $DIR/index.html | grep 'bundle-polygon' | cut -d\" -f2) "
done

# prepare bundle lists
LIST_JS_COMMON=$(echo $LIST_JS_COMMON | tr " " "\n" | sort -ur) # sort common bundle reverse for nicer order
LIST_JS_TOPLEVEL=$(echo $LIST_JS_TOPLEVEL | tr " " "\n" | awk '!x[$0]++')
LIST_JS_BITCOIN=$(echo $LIST_JS_BITCOIN | tr " " "\n" | sort -u)
LIST_JS_POLYGON=$(echo $LIST_JS_POLYGON | tr " " "\n" | sort -u)
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

replace_nimiq_import_path dist/request/$JS_COMMON_BUNDLE
replace_icon_sprite_url dist/request/$JS_COMMON_BUNDLE

for url in $LIST_JS_TOPLEVEL; do
    cat src/request/create/$url >> dist/request/$JS_TOPLEVEL_BUNDLE
done

replace_icon_sprite_url dist/request/$JS_TOPLEVEL_BUNDLE

for url in $LIST_JS_BITCOIN; do
    cat src/request/create/$url >> dist/request/$JS_BITCOIN_BUNDLE
done

for url in $LIST_JS_POLYGON; do
    cat src/request/create/$url >> dist/request/$JS_POLYGON_BUNDLE
done

for url in $LIST_CSS_TOPLEVEL; do
    cat src/request/create/$url >> dist/request/$CSS_TOPLEVEL_BUNDLE
done

replace_font_url dist/request/$CSS_TOPLEVEL_BUNDLE

# collect script integrity hashes
JS_COMMON_BUNDLE_HASH=$(make_file_hash dist/request/$JS_COMMON_BUNDLE)
JS_TOPLEVEL_BUNDLE_HASH=$(make_file_hash dist/request/$JS_TOPLEVEL_BUNDLE)
JS_BITCOIN_BUNDLE_HASH=$(make_file_hash dist/request/$JS_BITCOIN_BUNDLE)
JS_POLYGON_BUNDLE_HASH=$(make_file_hash dist/request/$JS_POLYGON_BUNDLE)
CSS_TOPLEVEL_BUNDLE_HASH=$(make_file_hash dist/request/$CSS_TOPLEVEL_BUNDLE)

# add file hash to bundle file names and overwrite bundle variables with the new file names
JS_COMMON_BUNDLE=$(add_hash_to_file_name dist/request/$JS_COMMON_BUNDLE)
JS_TOPLEVEL_BUNDLE=$(add_hash_to_file_name dist/request/$JS_TOPLEVEL_BUNDLE)
JS_BITCOIN_BUNDLE=$(add_hash_to_file_name dist/request/$JS_BITCOIN_BUNDLE)
JS_POLYGON_BUNDLE=$(add_hash_to_file_name dist/request/$JS_POLYGON_BUNDLE)
CSS_TOPLEVEL_BUNDLE=$(add_hash_to_file_name dist/request/$CSS_TOPLEVEL_BUNDLE)

NIMIQ_POW_LIB_HASH=$(make_file_hash node_modules/@nimiq/core-web/web-offline.js)

# copy Nimiq PoS loader, replace import path and calculate the integrity hash
cp -v src/lib/Nimiq.mjs dist/lib/
replace_nimiq_import_path dist/lib/Nimiq.mjs
NIMIQ_POS_LOADER_HASH=$(make_file_hash dist/lib/Nimiq.mjs)

# process index.html scripts and links for each request
output "🛠️   Building request index.html files"
for DIR in src/request/*/ ; do
    REQUEST=$(basename $DIR)

    JS_BUNDLE_HASH=$(make_file_hash dist/request/$REQUEST/$JS_BUNDLE)
    JS_BUNDLE_NAME=$(add_hash_to_file_name dist/request/$REQUEST/$JS_BUNDLE)

    if [ "$REQUEST" != "iframe" ] && [ "$REQUEST" != "swap-iframe" ]; then
        CSS_BUNDLE_HASH=$(make_file_hash dist/request/$REQUEST/$CSS_BUNDLE)
        CSS_BUNDLE_NAME=$(add_hash_to_file_name dist/request/$REQUEST/$CSS_BUNDLE)
    fi

    # replace scripts and links by bundles in built index.html
    awk '
        BEGIN {
            skip_script = 0
            skip_link = 0
        }
        /<script.*web-offline\.js/ {
            split($0, space, "<") # Preserve intendation.
            print space[1] "<script defer src=\"/assets/nimiq-pow/web-offline.js\" integrity=\"sha256-'${NIMIQ_POW_LIB_HASH}'\"></script>"
            next
        }
        /<script.*Nimiq\.mjs/ {
            split($0, space, "<") # Preserve intendation.
            print space[1] "<script defer src=\"/lib/Nimiq.mjs\" type=\"module\" integrity=\"sha256-'${NIMIQ_POS_LOADER_HASH}'\"></script>"
            next
        }
        /<script.*type="module"/ {
            print
            next
        }
        /<script/ {
            # Replace first script tag with bundles, delete all others
            if (!skip_script) {
                skip_script = 1
                split($0, space, "<") # Preserve intendation.
                print space[1] "<script defer src=\"/request/'${JS_COMMON_BUNDLE}'\" integrity=\"sha256-'${JS_COMMON_BUNDLE_HASH}'\"></script>"
                if("'$REQUEST'" != "iframe" && "'$REQUEST'" != "swap-iframe") {
                    print space[1] "<script defer src=\"/request/'${JS_TOPLEVEL_BUNDLE}'\" integrity=\"sha256-'${JS_TOPLEVEL_BUNDLE_HASH}'\"></script>"
                }
                if("'$REQUEST'" == "create" || "'$REQUEST'" == "import" || "'$REQUEST'" == "derive-btc-xpub" || "'$REQUEST'" == "sign-btc-transaction" || "'$REQUEST'" == "sign-swap" || "'$REQUEST'" == "swap-iframe") {
                    print space[1] "<script defer src=\"/request/'${JS_BITCOIN_BUNDLE}'\" integrity=\"sha256-'${JS_BITCOIN_BUNDLE_HASH}'\"></script>"
                }
                if("'$REQUEST'" == "create" || "'$REQUEST'" == "import" || "'$REQUEST'" == "derive-polygon-address" || "'$REQUEST'" == "sign-polygon-transaction" || "'$REQUEST'" == "sign-swap" || "'$REQUEST'" == "swap-iframe") {
                    print space[1] "<script defer src=\"/request/'${JS_POLYGON_BUNDLE}'\" integrity=\"sha256-'${JS_POLYGON_BUNDLE_HASH}'\"></script>"
                }
                print space[1] "<script defer src=\"/request/'${REQUEST}'/'${JS_BUNDLE_NAME}'\" integrity=\"sha256-'${JS_BUNDLE_HASH}'\"></script>"
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
                print space[1] "<link rel=\"stylesheet\" href=\"/request/'${REQUEST}'/'${CSS_BUNDLE_NAME}'\" integrity=\"sha256-'${CSS_BUNDLE_HASH}'\">"
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

# Build RSA iframe
output "🔑  Building RSA Iframe"

# Integrity check that forge.min.js is from node-forge 1.3.1
nodeforge_hashsum="dc67fd132427ad96c9666c844b39565413c40ddb1f2d063c53512fbf6d387dfd  src/lib/rsa/sandboxed/forge.min.js"
echo "$nodeforge_hashsum" | ${SHA256SUM} --check

# Note: requests in a sandboxed iframe are considered cross origin requests, and are thus blocked by adblockers
# (adblockers block loading scripts off a *.nimiq.com domain when the request does not originate from that same origin).
# Therefore we inline the scripts here to avoid loading external scripts.
cp src/lib/rsa/sandboxed/RSAKeysIframe.html dist/lib/rsa/sandboxed/
inplace_sed \
    -e 's/<script src="\.\/[^"]*">/<script>/' \
    -e '/RSA_IFRAME_FORGE_CONTENTS/{r src/lib/rsa/sandboxed/forge.min.js' -e 'd}' \
    -e '/RSA_IFRAME_SCRIPT_CONTENTS/{r src/lib/rsa/sandboxed/RSAKeysIframe.js' -e 'd}' \
    dist/lib/rsa/sandboxed/RSAKeysIframe.html

# copy assets
output "🐑  Copying static assets"
cp -v favicon.ico dist
cp -rv src/assets/* dist/assets/
cp -v src/lib/QrScannerWorker.js dist/lib/
cp -v node_modules/@nimiq/style/nimiq-style.icons.svg dist/assets/
# copy service worker (which has to be in root to work)
cp -v src/service-worker/ServiceWorker.js dist

# copy Nimiq PoW files
output "‼️   Copying Nimiq PoW files"
cp -v node_modules/@nimiq/core-web/web-offline.js \
      node_modules/@nimiq/core-web/worker-wasm.wasm \
      node_modules/@nimiq/core-web/worker-wasm.js \
      node_modules/@nimiq/core-web/worker-js.js \
      node_modules/@nimiq/core-web/worker.js \
      dist/assets/nimiq-pow

# copy Nimiq PoS files
output "‼️   Copying Nimiq PoS files"
mkdir -p dist/assets/nimiq-pos/launcher
cp -vr node_modules/@nimiq/core/launcher/browser dist/assets/nimiq-pos/launcher/browser
mkdir -p dist/assets/nimiq-pos/lib
cp -vr node_modules/@nimiq/core/lib/web dist/assets/nimiq-pos/lib/web
cp -vr node_modules/@nimiq/core/web dist/assets/nimiq-pos/web

output "✔️   Finished building into ./dist"
