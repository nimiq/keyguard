I18n.initialize(TRANSLATIONS, 'en');
const languagePicker = new LanguagePicker();
document.body.appendChild(languagePicker.getElement());

const input = new RecoveryWordsInput();
/** @type {HTMLElement} */
const $privateKey = (document.querySelector('#private-key'));
/** @type {HTMLElement} */
const $recoveryWords = (document.querySelector('#recovery-words'));
/** @type {HTMLElement} */
const $resetFields = (document.querySelector('#reset-fields'));
/** @type {HTMLElement} */
const $fillRandomly = (document.querySelector('#fill-randomly'));

input.on(RecoveryWordsInput.Events.COMPLETE, /** @param {Nimiq.PrivateKey} privateKey */ privateKey => {
    $privateKey.textContent = privateKey.toHex();
    //document.querySelectorAll('button.fill').forEach(button => button.setAttribute('disabled', 'disabled'));
});

$recoveryWords.appendChild(input.$el);

/** @type {Uint8Array} */
const randomKey = (window.crypto.getRandomValues(new Uint8Array(32)));
const words = MnemonicPhrase.keyToMnemonic(randomKey).split(' ');

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
    input.$fields.forEach((field, index) => {
        field.dom.input.value = '';
        field._onBlur();
        field._showInput();
    });
    document.querySelectorAll('button').forEach(button => button.removeAttribute('disabled'));
});

$fillRandomly.addEventListener('click', () => {
    input.$fields.forEach((field, index) => {
        putWord(field, MnemonicPhrase.DEFAULT_WORDLIST[Math.floor(Math.random() * 2048)], index);
    });
    document.querySelectorAll('button.fill').forEach(button => button.setAttribute('disabled', 'disabled'));
});
