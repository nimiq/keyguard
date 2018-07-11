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
            <div class="info-box">
                <i class="info-icon"></i>
                <p class="info-text">Move your mouse over the numbers or tap them to reveal each word.</p>
            </div>
            <div class="spacing-bottom center warning">
                <strong>Anyone with access to these words can steal all your funds!</strong>
            </div>
            <div class="grow"></div>
            <button>Continue</button>`;

        return $el;
    }

    /**
     * @param {Uint8Array} privateKey
     */
    set privateKey(privateKey) {
        const phrase = MnemonicPhrase.keyToMnemonic(privateKey);
        const words = phrase.split(/\s+/g);

        for (let sectionIndex = 0; sectionIndex < 3; sectionIndex++) {
            const section = document.createElement('div');
            section.classList.add('word-section', `section-${sectionIndex + 1}`);
            for (let wordIndex = sectionIndex * 8; wordIndex < (sectionIndex + 1) * 8; wordIndex++) {
                const placeholder = document.createElement('span');
                placeholder.classList.add('word-placeholder');
                placeholder.textContent = `${wordIndex + 1}`;

                const content = document.createElement('span');
                content.classList.add('word-content');
                content.textContent = words[wordIndex];
                content.title = `word #${wordIndex + 1}`;

                const word = document.createElement('div');
                word.classList.add('word');
                word.appendChild(placeholder);
                word.appendChild(content);
                section.appendChild(word);
            }
            this.$wordsContainer.appendChild(section);
        }
    }

    /** @returns {Element} */
    getElement() {
        return this.$el;
    }
}

RecoveryWords.Events = {
    CONTINUE: 'continue',
};
