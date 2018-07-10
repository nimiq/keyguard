class ValidateWords extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = ValidateWords._createElement($el);

        this.$buttons = this.$el.querySelectorAll('button');
        this.$targetIndex = this.$el.querySelector('.target-index');
        this.$el.addEventListener('click', e => this._onClick(e));

        this.$skip = this.$el.querySelector('.skip');
        if (this.$skip) {
            this.$skip.addEventListener('click', () => this.fire(ValidateWords.Events.VALIDATED));
        }
    }

    /**
     * @param {HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');

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

    set mnemonic(mnemonic) {
        if (!mnemonic) return;
        this._mnemonic = mnemonic.split(/\s+/g);
    }

    reset() {
        if (!this._mnemonic) return;
        this._round = 0;
        this.mnemonic = this._mnemonic.join(' ');
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
        this.requiredWords = [0, 1, 2].map(this._generateIndex);
    }

    _generateIndex(index) {
        return Math.floor(Math.random() * 8) + index * 8;
    }

    _setContent(round) {
        this._set(
            this._generateWords(this.requiredWords[round]), // wordlist
            this.requiredWords[round] + 1, // targetIndex
            this._mnemonic[this.requiredWords[round]] // targetWord
        );
    }

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
     * @param {number} targetIndex
     * @param {string} targetWord
     */
    _set(wordList, targetIndex, targetWord) {
        this.$el.querySelectorAll('.correct').forEach(button => button.classList.remove('correct'));
        this.$el.querySelectorAll('.wrong').forEach(button => button.classList.remove('wrong'));
        this.setWordList(wordList);
        this.setTargetIndex(targetIndex);
        this._targetWord = targetWord;
    }

    setWordList(wordList) {
        this._wordList = wordList;
        wordList.forEach((word, index) => this.$buttons[index].textContent = word);
        this.$buttons.forEach(button => button.removeAttribute('disabled'));
    }

    setTargetIndex(index) {
        this.$targetIndex.textContent = index;
    }

    _onClick(e) {
        if (e.target.localName !== 'button') return;
        this._onButtonPressed(e.target);
    }

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

    _showAsWrong($button) {
        $button.classList.add('wrong');
        // this.animate('shake', $button);
    }

    _showAsCorrect($button) {
        $button.classList.add('correct');
    }
}

ValidateWords.Events = {
    VALIDATED: 'validated',
    BACK: 'back'
};