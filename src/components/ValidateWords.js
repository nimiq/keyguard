/* global Nimiq */
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

        /** @type {HTMLFormElement} */
        this.$skip = (this.$el.querySelector('.skip'));

        /** @type {HTMLFormElement} */
        this.$backWords = (this.$el.querySelector('.back-words'));

        this.$skip.addEventListener('click', () => this.fire(ValidateWords.Events.SKIPPED));
        this.$backWords.addEventListener('click', () => this.fire(ValidateWords.Events.BACK));
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
            <a class="secondary back-words">Back to words</a>
            <a class="secondary skip">Skip</a>
        `;

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
        this.$el.querySelectorAll('.correct').forEach(button => button.classList.remove('correct'));
        this.$el.querySelectorAll('.wrong').forEach(button => button.classList.remove('wrong'));
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
    _setWordList(wordList) {
        this._wordList = wordList;
        wordList.forEach((word, index) => {
            this.$buttons[index].textContent = word;
        });
        this.$buttons.forEach(button => button.removeAttribute('disabled'));
    }

    /**
     * @param {number} index
     */
    _setTargetIndex(index) {
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
            ValidateWords._showAsWrong($button);
            const correctButtonIndex = this._wordList.indexOf(this._targetWord);
            ValidateWords._showAsCorrect(this.$buttons[correctButtonIndex]);
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
        $button.classList.add('wrong');
        // this.animate('shake', $button);
    }

    /**
     * @param {HTMLButtonElement} $button
     * @private
     */
    static _showAsCorrect($button) {
        $button.classList.add('correct');
    }
}

ValidateWords.Events = {
    SKIPPED: 'skipped',
    VALIDATED: 'validated',
    BACK: 'back',
};
