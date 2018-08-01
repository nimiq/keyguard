/* global Nimiq */
/* global MnemonicPhrase */
class RecoveryWords extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = this._createElement($el);
        this.$wordsContainer = /** @type {HTMLElement} */ (this.$el.querySelector('.words-container'));

        const $button = /** @type {HTMLElement} */ (this.$el.querySelector('button'));
        $button.addEventListener('click', () => this.fire(RecoveryWords.Events.CONTINUE));
    }

    /**
     * @param {HTMLElement} [$el]
     * @returns {Element}
     * */
    _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('recovery-words');

        $el.innerHTML = `
            <h1>Backup your 24 Recovery Words</h1>
            <h2 secondary>
                Write down and physically store the complete following list of 24 Account Recovery Words
                at a <strong>SAFE and SECRET</strong> place to recover this account in the future.
            </h2>
            <div class="grow"></div>
            <div class="words-container">
                <div class="title" data-i18n="recovery-words-title">Recovery Words</div>
            </div>
            <div class="spacing-bottom center warning">
                <strong>Anyone with access to these words can steal all your funds!</strong>
            </div>
            <div class="grow"></div>
            <button>Continue</button>`;

        return $el;
    }

    /**
     * @param {Nimiq.Entropy} entropy
     */
    set entropy(entropy) {
        const words = Nimiq.MnemonicUtils.entropyToMnemonic(entropy, Nimiq.MnemonicUtils.DEFAULT_WORDLIST);
        this.$wordsContainer.querySelectorAll('.word-section').forEach((elem) => this.$wordsContainer.removeChild(elem));

        const section = document.createElement('div');
        section.classList.add('word-section');
        for (let wordIndex = 0; wordIndex < 24; wordIndex++) {

            const content = document.createElement('span');
            content.classList.add('word-content');
            content.textContent = words[wordIndex];
            content.title = `word #${wordIndex + 1}`;

            const word = document.createElement('div');
            word.classList.add('word');
            word.appendChild(content);
            section.appendChild(word);
        }
        this.$wordsContainer.appendChild(section);
    }

    /** @returns {Element} */
    getElement() {
        return this.$el;
    }
}

RecoveryWords.Events = {
    CONTINUE: 'continue',
};
