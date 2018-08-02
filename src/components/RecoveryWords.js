/* global Nimiq */
/* global I18n */
/* global MnemonicPhrase */
/* global RecoveryWordsInputField */
/* global AnimationUtils */
class RecoveryWords extends Nimiq.Observable {
    /**
     *
     * @param {HTMLElement} [$el]
     * @param {boolean} providesInput
     */
    constructor($el, providesInput) {
        super();
        this._mnemonic = '';
        /** @type{Object[]} */ this.$fields = [];
        this.$el = this._createElement($el, providesInput);
    }

    /**
     * @param {Nimiq.Entropy | Uint8Array} entropy
     */
    set entropy(entropy) {
        const words = Nimiq.MnemonicUtils.entropyToMnemonic(entropy, Nimiq.MnemonicUtils.DEFAULT_WORDLIST);
        // this.$wordsContainer.querySelectorAll('.word-section').forEach((elem) => this.$wordsContainer.removeChild(elem));

        for (let i = 0; i < 24; i++) {
            this.$fields[i].textContent = words[i];
        }
    }

    /**
     * @param {HTMLElement} [$el]
     * @param {boolean} input
     * @returns {HTMLElement}
     * */
    _createElement($el, input=true) {
        $el = $el || document.createElement('div');
        $el.classList.add('recovery-words');

        $el.innerHTML = `
            <div class="words-container">
                <div class="title" data-i18n="recovery-words-title">Recovery Words</div>
                <div class="word-section"> </div>
            </div>
        `;

        const wordSection = /** @type {HTMLElement} */ ($el.querySelector('.word-section'));

        for (let i = 0; i < 24; i++) {
            if (input) {
                const field = new RecoveryWordsInputField(i);
                field.element.classList.add('word');
                field.element.dataset.i = i.toString();
                field.on(RecoveryWordsInputField.Events.VALID, this._onFieldComplete.bind(this));
                field.on(RecoveryWordsInputField.Events.FOCUS_NEXT, this._setFocusToNextInput.bind(this));

                this.$fields.push(field);
                wordSection.appendChild(field.element);
            } else {
                const content = document.createElement('span');
                content.classList.add('word-content');
                content.title = `word #${i + 1}`;
                this.$fields.push(content);

                const word = document.createElement('div');
                word.classList.add('word');
                word.classList.add('recovery-words-input-field');
                word.appendChild(content);
                wordSection.appendChild(word);
            }
        }

        I18n.translateDom($el);

        return $el;
    }

    focus() {
        this.$fields[0].focus();
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /**
     * @param {RecoveryWordsInputField} field
     */
    _onFieldComplete(field) {
        if (!field.value) return;

        this._checkPhraseComplete();
    }

    _checkPhraseComplete() {
        const check = this.$fields.find(field => !field.complete);
        if (typeof check !== 'undefined') return;

        const words = this.$fields.map(field => field.value).join(' ');
        try {
            const type = Nimiq.MnemonicUtils.getMnemonicType(words); // throws on invalid mnemonic
            this.fire(RecoveryWords.Events.COMPLETE, words, type);
        } catch (e) {
            if (e.message !== 'Invalid checksum') console.error(e); // eslint-disable-line no-console
            else this._animateError(); // wrong words
        }
    }

    /**
     * @param {number} index
     * @param {?string} paste
     */
    _setFocusToNextInput(index, paste) {
        if (index < this.$fields.length) {
            this.$fields[index].focus();
            if (paste) {
                this.$fields[index].fillValueFrom(paste);
            }
        }
    }

    _animateError() {
        AnimationUtils.animate('shake', this.$el);
    }
}

RecoveryWords.Events = {
    COMPLETE: 'recovery-words-complete'
};
