/* global TRANSLATIONS */
/* global Nimiq */
/* global I18n */
/* global LanguagePicker */
/* global RecoveryWords */
I18n.initialize(TRANSLATIONS, 'en');
const languagePicker = new LanguagePicker();
document.body.appendChild(languagePicker.getElement());

/** @type {HTMLElement} */
const $privateKey = (document.querySelector('#private-key'));
/** @type {HTMLElement} */
const $mnemonicType = (document.querySelector('#mnemonic-type'));
/** @type {HTMLElement} */
const $recoveryWords = (document.querySelector('#recovery-words'));
/** @type {HTMLElement} */
const $recoveryWordsInput = (document.querySelector('#recovery-words-input'));
/** @type {HTMLElement} */
const $resetFields = (document.querySelector('#reset-fields'));
/** @type {HTMLElement} */
const $fillRandomly = (document.querySelector('.fill-randomly'));
/** @type {HTMLElement} */
const $fillCorrectly = (document.querySelector('.fill-correctly'));
/** @type {HTMLElement} */
const $startApi = (document.querySelector('.start-api'));

const input = new RecoveryWords(null, true);
input.on(RecoveryWords.Events.COMPLETE, (/** @param {Array<string>} words */ words, mnemonicType) => {
    $mnemonicType.textContent = mnemonicType;
    switch (mnemonicType) {
        case Nimiq.MnemonicUtils.MnemonicType.BIP39:
        case Nimiq.MnemonicUtils.MnemonicType.UNKNOWN:
            $privateKey.textContent = Nimiq.BufferUtils.toHex(Nimiq.MnemonicUtils.mnemonicToEntropy(words).serialize());
            break;
        case Nimiq.MnemonicUtils.MnemonicType.LEGACY:
            $privateKey.textContent = Nimiq.BufferUtils.toHex(Nimiq.MnemonicUtils.legacyMnemonicToEntropy(words).serialize());
            break;
        default:
            throw new Error('Invalid mnemonic type');
    }
});
const recoveryWords = new RecoveryWords(null, false);

(async () => {
    await Nimiq.WasmHelper.doImportBrowser();
    Nimiq.GenesisConfig.test();
    recoveryWords.entropy = Nimiq.Entropy.generate();
})();


$recoveryWords.appendChild(recoveryWords.$el);
$recoveryWordsInput.appendChild(input.$el);

/**
 *
 * @param {RecoveryWordsInputField} field
 * @param {string} word
 * @param {number} index
 */
function putWord(field, word, index) {
    setTimeout(() => {
        field.dom.input.value = word;
        field._value = word;
        field._onBlur();
    }, index * 50);
}

$resetFields.addEventListener('click', () => {
    input.$fields.forEach(field => {
        field.dom.input.value = '';
        field._onBlur();
    });
    document.querySelectorAll('button').forEach(button => button.removeAttribute('disabled'));
});

$fillRandomly.addEventListener('click', () => {
    input.$fields.forEach((field, index) => {
        putWord(field, Nimiq.MnemonicUtils.DEFAULT_WORDLIST[Math.floor(Math.random() * 2048)], index);
    });
    document.querySelectorAll('button.fill').forEach(button => button.setAttribute('disabled', 'disabled'));
});

$fillCorrectly.addEventListener('click', () => {
    const randomEntropy = Nimiq.Entropy.generate();
    const words = Nimiq.MnemonicUtils.entropyToMnemonic(randomEntropy);
    for (let i = 0; i < 24; i++) {
        putWord(input.$fields[i], words[i], i);
    }
});

$startApi.addEventListener('click', async () => {
    const keyguard = window.open('../src/request/import-words/');

    // We need this check because we call the rpcServer object directly and not via RPC Client
    function checkIfKeyguardReady(resolve) {
        if (keyguard.rpcServer !== undefined) {
            resolve();
        } else {
            self.setTimeout(() => checkIfKeyguardReady(resolve), 25);
        }
    }

    await new Promise(res => checkIfKeyguardReady(res));

    const result = await keyguard.rpcServer.request();

    if (result) {
        console.log(result);
        keyguard.close();
    }
});
