/* global Nimiq */
/* global MnemonicPhrase */
class ValidateWords extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = ValidateWords._createElement($el);

        this.$buttons = this.$el.querySelectorAll('button');
        this.$targetIndex = /** @type {HTMLElement} */ (this.$el.querySelector('.target-index'));
        this.$el.addEventListener('click', this._onClick.bind(this));

        this.$skip = this.$el.querySelector('.skip');

        if (this.$skip) {
            this.$skip.addEventListener('click', () => this.fire(ValidateWords.Events.VALIDATED));
        }

        this._round = 0;
        /** @type {number[]} */
        this._requiredWords = [];
        /** @type {string[]} */
        this._mnemonic = [];
        /** @type {string[]} */
        this._wordList = [];
        /** @type {string} */
        this._targetWord = '';
    }

    /**
     * @param {HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('validate-words');

        $el.innerHTML = `<h1>Validate Recovery Words</h1>
            <p>Please select the following word from your list:</p>
            <div class="grow"></div>
            <div class="target-index"></div>
            <div class="word-list">
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
                <button class="small"></button>
            </div>
            <div class="grow"></div>
            <span class="skip">[Skip]</span>
            <a class="secondary" href="#recovery-words">Back to words</a>`;

        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {Uint8Array} privateKey
     */
    set privateKey(privateKey) {
        this.mnemonic = MnemonicPhrase.keyToMnemonic(privateKey);
    }

    /**
     * @param {string} mnemonic
     */
    set mnemonic(mnemonic) {
        if (!mnemonic) return;
        this._mnemonic = mnemonic.split(/\s+/g);
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
        this._requiredWords = [0, 1, 2].map(this._generateIndex);
    }

    /**
     * @param {number} round
     * @returns {number}
     * @private
     */
    _generateIndex(round) {
        return Math.floor(Math.random() * 8) + round * 8;
    }

    /**
     * @param {number} round
     * @private
     */
    _setContent(round) {
        this.$el.querySelectorAll('.correct').forEach(button => button.classList.remove('correct'));
        this.$el.querySelectorAll('.wrong').forEach(button => button.classList.remove('wrong'));
        const wordList = this._generateWords(this._requiredWords[round]);
        this.setWordList(wordList);
        const targetIndex = this._requiredWords[round] + 1;
        this.setTargetIndex(targetIndex);
        this._targetWord = this._mnemonic[this._requiredWords[round]];
    }

    /**
     * @param {number} wordIndex
     * @returns {string[]}
     * @private
     */
    _generateWords(wordIndex) {
        const words = {};

        words[this._mnemonic[wordIndex]] = wordIndex;

        // Select 7 additional unique words from the mnemonic phrase
        while (Object.keys(words).length < 8) {
            const index = Math.floor(Math.random() * 24);
            words[this._mnemonic[index]] = index;
        }

        return Object.keys(words).sort();
    }

    // per round

    /**
     * @param {string[]} wordList
     */
    setWordList(wordList) {
        this._wordList = wordList;
        wordList.forEach((word, index) => {
            this.$buttons[index].textContent = word;
        });
        this.$buttons.forEach(button => button.removeAttribute('disabled'));
    }

    /**
     * @param {number} index
     */
    setTargetIndex(index) {
        this.$targetIndex.textContent = index.toString();
    }

    /**
     * @param {DOMEvent} e
     * @private
     */
    _onClick(e) {
        if (e.target && e.target.localName !== 'button') return;
        this._onButtonPressed(/** @type {HTMLButtonElement} */ (e.target));
    }

    /**
     * @param {HTMLButtonElement} $button
     * @private
     */
    _onButtonPressed($button) {
        this.$buttons.forEach(button => button.setAttribute('disabled', 'disabled'));

        if ($button.textContent !== this._targetWord) {
            // wrong choice
            this._showAsWrong($button);
            const correctButtonIndex = this._wordList.indexOf(this._targetWord);
            this._showAsCorrect(this.$buttons[correctButtonIndex]);
            setTimeout(() => this.reset(), 820);
        } else {
            // correct choice
            this._showAsCorrect($button);
            setTimeout(() => this._next(), 500);
        }
    }

    /**
     * @param {HTMLButtonElement} $button
     * @private
     */
    _showAsWrong($button) {
        $button.classList.add('wrong');
        // this.animate('shake', $button);
    }

    /**
     * @param {HTMLButtonElement} $button
     * @private
     */
    _showAsCorrect($button) {
        $button.classList.add('correct');
    }
}

ValidateWords.Events = {
    VALIDATED: 'validated',
    BACK: 'back',
};
