/* global Nimiq */
/* global I18n */
/* global AnimationUtils */

class ValidateWords extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        super();

        /** @type {number} */
        this._round = 0;
        /** @type {number[]} */
        this._requiredWords = [];
        /** @type {string[]} */
        this._mnemonic = [];
        /** @type {string[]} */
        this._wordList = [];
        /** @type {string} */
        this._targetWord = '';

        this.$el = ValidateWords._createElement($el);

        this.$buttons = this.$el.querySelectorAll('button');
        this.$targetIndex = /** @type {HTMLElement} */ (this.$el.querySelector('.target-index'));
        this.$el.addEventListener('click', this._onClick.bind(this));
        /** @type {HTMLElement} */
        this.$textHint = (this.$el.querySelector('p'));
    }

    /**
     * @param {HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('validate-words');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="target-index"></div>
            <p data-i18n="validate-words-text" class="nq-text">Please select the correct word from your list of recovery words.</p>
            <div class="word-list">
                <button class="nq-button light-blue"></button>
                <button class="nq-button light-blue"></button>
                <button class="nq-button light-blue"></button>
                <button class="nq-button light-blue"></button>
                <button class="nq-button light-blue"></button>
                <button class="nq-button light-blue"></button>
            </div>
        `;
        /* eslint-enable max-len */

        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {Nimiq.Entropy | Uint8Array} entropy
     */
    set entropy(entropy) {
        const words = Nimiq.MnemonicUtils.entropyToMnemonic(entropy, Nimiq.MnemonicUtils.DEFAULT_WORDLIST);
        this.setWords(words);
    }

    /**
     * @param {string[]} mnemonic
     */
    setWords(mnemonic) {
        if (!mnemonic) return;
        this._mnemonic = mnemonic;
        this.reset();
    }

    reset() {
        if (!this._mnemonic) return;
        this._round = 0;
        this._generateIndices();
        this._setContent(this._round);
    }

    _next() {
        this._round += 1;
        if (this._round < 3) {
            this._setContent(this._round);
        } else {
            this.fire(ValidateWords.Events.VALIDATED);
        }
    }

    _generateIndices() {
        this._requiredWords = [0, 1, 2].map(ValidateWords._generateIndex);
    }

    /**
     * @param {number} index
     * @returns {number}
     * @private
     */
    static _generateIndex(index) {
        return Math.floor(Math.random() * 8) + index * 8;
    }

    /**
     * @param {number} round
     * @private
     */
    _setContent(round) {
        this.$el.querySelectorAll('.blink-green').forEach(button => button.classList.remove('blink-green'));
        this.$el.querySelectorAll('.green').forEach(button => button.classList.remove('green'));
        this.$el.querySelectorAll('.red').forEach(button => button.classList.remove('red'));
        this.$el.querySelectorAll('.shake').forEach(button => button.classList.remove('shake'));
        const wordList = this._generateWords(this._requiredWords[round]);
        this._setWordList(wordList);
        const targetIndex = this._requiredWords[round] + 1;
        this._setTargetIndex(targetIndex);
        this._targetWord = this._mnemonic[this._requiredWords[round]];
    }

    /**
     * @param {number} wordIndex
     * @returns {string[]}
     * @private
     */
    _generateWords(wordIndex) {
        /** @type {{[word: string]: number}} */
        const words = {};

        words[this._mnemonic[wordIndex]] = wordIndex;

        // Select 5 additional unique words from the mnemonic phrase
        while (Object.keys(words).length < 6) {
            const index = Math.floor(Math.random() * 24);
            words[this._mnemonic[index]] = index;
        }

        return Object.keys(words).sort();
    }

    // per round

    /**
     * @param {string[]} wordList
     */
    _setWordList(wordList) {
        this._wordList = wordList;
        wordList.forEach((word, index) => {
            this.$buttons[index].textContent = word;
        });
        this.$buttons.forEach(button => {
            button.disabled = false;
            button.classList.remove('inverse');
        });
    }

    /**
     * @param {number} index
     */
    _setTargetIndex(index) {
        this.$targetIndex.textContent = index.toString();
        this.$textHint.textContent = I18n.translatePhrase(`validate-words-${index}-hint`);
    }

    /**
     * @param {Event} e
     * @private
     */
    _onClick(e) {
        const target = /** @type {HTMLButtonElement} */ (e.target);
        if (target && target.localName !== 'button') return;
        this._onButtonPressed(target);
    }

    /**
     * @param {HTMLButtonElement} $button
     * @private
     */
    _onButtonPressed($button) {
        this.$buttons.forEach(button => {
            button.disabled = true;
            button.classList.add('inverse');
        });

        if ($button.textContent !== this._targetWord) {
            // wrong choice
            ValidateWords._showAsWrong($button);
            const correctButtonIndex = this._wordList.indexOf(this._targetWord);
            ValidateWords._showAsCorrect(this.$buttons[correctButtonIndex], false);
            setTimeout(() => this.reset(), 820);
        } else {
            // correct choice
            ValidateWords._showAsCorrect($button);
            setTimeout(() => this._next(), 500);
        }
    }

    /**
     * @param {HTMLButtonElement} $button
     * @private
     */
    static _showAsWrong($button) {
        $button.classList.add('red');
        AnimationUtils.animate('shake', $button);
    }

    /**
     * @param {HTMLButtonElement} $button
     * @param {boolean} [clicked]
     * @private
     */
    static _showAsCorrect($button, clicked = true) {
        if (clicked) {
            $button.classList.add('green');
        } else {
            $button.classList.add('blink-green');
        }
    }
}

ValidateWords.Events = {
    VALIDATED: 'validate-words-validated',
    BACK: 'validate-words-back',
};
