/* global Observable */
/* global Nimiq */
/* global I18n */
/* global RecoveryWordsInputField */
/* global AnimationUtils */
/* global TemplateTags */

class RecoveryWords extends Observable {
    /**
     *
     * @param {?HTMLElement} [$el]
     * @param {boolean} [providesInput]
     */
    constructor($el, providesInput) {
        super();

        /** @type {(RecoveryWordsInputField | HTMLSpanElement)[]} */
        this.$fields = [];

        /** @type {HTMLElement} */
        this.$el = this._createElement($el, providesInput);

        /**
         * @type {?{words: Array<string>, type: number}}
         * @private
         */
        this._mnemonic = null;
    }

    /**
     * Set the recovery words.
     * @param {string[]} words
     */
    setWords(words) {
        let providesInput = false;
        for (let i = 0; i < 24; i++) {
            const field = this.$fields[i];
            const word = words[i] || '';
            if ('value' in field) {
                field.value = word;
                providesInput = true;
            } else if ('textContent' in field) {
                field.textContent = word;
            }
        }
        if (!providesInput) return;
        this._checkPhraseComplete();
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {boolean} input
     * @returns {HTMLElement}
     * */
    _createElement($el, input = true) {
        $el = $el || document.createElement('div');
        $el.classList.add('recovery-words');

        $el.innerHTML = TemplateTags.noVars`
            <div class="words-container">
                <div class="word-section"></div>
            </div>
        `;

        const wordSection = /** @type {HTMLElement} */ ($el.querySelector('.word-section'));

        for (let i = 0; i < 24; i++) {
            if (input) {
                const field = new RecoveryWordsInputField(i);
                field.element.classList.add('word');
                field.element.dataset.i = i.toString();
                field.on(RecoveryWordsInputField.Events.VALID, this._onFieldComplete.bind(this));
                field.on(RecoveryWordsInputField.Events.INVALID, this._onFieldIncomplete.bind(this));
                field.on(RecoveryWordsInputField.Events.FOCUS_NEXT, this._setFocusToNextInput.bind(this));

                this.$fields.push(field);
                wordSection.appendChild(field.element);
            } else {
                const content = document.createElement('span');
                content.classList.add('word-content');
                content.title = `word #${i + 1}`;
                this.$fields.push(content);

                const $wordNumber = document.createElement('span');
                $wordNumber.classList.add('word-number');
                $wordNumber.textContent = `${i < 9 ? '0' : ''}${i + 1}`;

                const word = document.createElement('div');
                word.classList.add('word', 'complete');
                word.classList.add('recovery-words-input-field');
                word.appendChild($wordNumber);
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

    clear() {
        this.setWords(new Array(24));
    }

    wrongSeedPhrase() {
        this._animateError();
        window.setTimeout(() => this.clear(), 500);
    }

    _onFieldComplete() {
        this._checkPhraseComplete();
    }

    _onFieldIncomplete() {
        if (this._mnemonic) {
            this._mnemonic = null;
            this.fire(RecoveryWords.Events.INCOMPLETE);
        }
    }

    async _checkPhraseComplete() {
        // Check if all fields are complete
        if (this.$fields.some(field => 'complete' in field && !field.complete)) {
            this._onFieldIncomplete();
            return;
        }

        try {
            const mnemonic = this.$fields.map(field => ('value' in field ? field.value : '-'));
            if (this._mnemonic && this._mnemonic.words.join(' ') === mnemonic.join(' ')) {
                // The words haven't changed and don't need to be processed again. This happens especially, when pasting
                // multiple words at once, which triggers multiple _onFieldComplete and _checkPhaseComplete calls.
                return;
            }
            const type = Nimiq.MnemonicUtils.getMnemonicType(mnemonic); // throws on invalid mnemonic
            this._mnemonic = { words: mnemonic, type };
            this.fire(RecoveryWords.Events.COMPLETE, mnemonic, type);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage !== 'Invalid checksum') {
                console.error(error); // eslint-disable-line no-console
            } else {
                // wrong words
                if (this._mnemonic) this._mnemonic = null;
                /*
                 * The animation time is used to delay the INVALID event firing, thus the await. It is possible
                 * to trigger this by a keyboard event which results in a focus on a different $field which would
                 * reset the invalid state again. This way the message pops up after the animation and after the focus.
                 */
                await this._animateError();
                this.fire(RecoveryWords.Events.INVALID);
            }
        }
    }

    /**
     * @param {number} index
     * @param {string} [paste]
     */
    _setFocusToNextInput(index, paste) {
        index = Math.max(index, 0);
        if (index < this.$fields.length) {
            const field = this.$fields[index];
            field.focus();
            if (paste && 'fillValueFrom' in field) {
                field.fillValueFrom(paste);
            }
        }
    }

    _animateError() {
        AnimationUtils.animate('shake', this.$el);
    }

    get mnemonic() {
        return this._mnemonic ? this._mnemonic.words : null;
    }

    get mnemonicType() {
        return this._mnemonic ? this._mnemonic.type : null;
    }
}

RecoveryWords.Events = {
    COMPLETE: 'recovery-words-complete',
    INCOMPLETE: 'recovery-words-incomplete',
    INVALID: 'recovery-words-invalid',
};
