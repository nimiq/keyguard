/* global AutoComplete */
/* global MnemonicPhrase */
/* global AnimationUtils */
class RecoveryWordsInputField extends Nimiq.Observable {
    /**
     *
     * @param {number} index
     */
    constructor(index) {
        super();

        this._index = index;
        /** @type {string} */ this._value = '';
        this.complete = false;

        this.dom = this._createElements();
        this._setupAutocomplete();
    }

    /**
     * @returns {{ element: HTMLElement, input: HTMLInputElement, placeholder: HTMLDivElement }}
     */
    _createElements() {
        const element = document.createElement('div');
        element.classList.add('recovery-words-input-field');

        const input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'none');
        input.setAttribute('spellcheck', 'false');

        /** */
        const setPlaceholder = () => {
            input.placeholder = `${I18n.translatePhrase('recovery-words-input-field-placeholder')}${this._index + 1}`;
        };
        I18n.observer.on(I18n.Events.LANGUAGE_CHANGED, setPlaceholder);
        setPlaceholder();

        input.addEventListener('keydown', this._onKeydown.bind(this));
        input.addEventListener('blur', this._onBlur.bind(this));
        /** @type {HTMLInputElement} */
        this.$input = input;

        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = (this._index + 1).toString();
        this.$placeholder = placeholder;

        element.addEventListener('click', this._showInput.bind(this));
        element.addEventListener('mouseenter', this._showInput.bind(this));
        element.addEventListener('mouseleave', this.showPlaceholder.bind(this));
        element.appendChild(input);

        return { element, input, placeholder };
    }

    _setupAutocomplete() {
        this.autocomplete = new AutoComplete({
            selector: this.$input,
            source: /** @param{string} term @param{function} response */ (term, response) => {
                term = term.toLowerCase();
                const list = MnemonicPhrase.DEFAULT_WORDLIST.filter(word => word.startsWith(term));
                response(list);
            },
            onSelect: this._focusNext.bind(this),
            minChars: 3,
            delay: 0,
        });
    }

    focus() {
        // cf. https://stackoverflow.com/questions/20747591
        setTimeout(() => this.dom.input.focus(), 50);
    }

    get value() {
        return this.dom.input.value;
    }

    get element() {
        return this.dom.element;
    }

    _onBlur() {
        this._checkValidity();
    }

    /**
     * @param {KeyboardEvent} e
     */
    _onKeydown(e) {
        this._onValueChanged();

        if (e.keyCode === 32 /* space */) e.preventDefault();

        if (e.keyCode === 32 /* space */ || e.keyCode === 13 /* enter */) {
            this._checkValidity(true);
        }
    }

    /**
     *
     * @param {boolean} [setFocusToNextInput]
     */
    _checkValidity(setFocusToNextInput = false) {
        if (MnemonicPhrase.DEFAULT_WORDLIST.indexOf(this.value.toLowerCase()) >= 0) {
            this.dom.element.classList.add('complete');
            this.complete = true;
            this.fire(RecoveryWordsInputField.Events.VALID, this);

            if (setFocusToNextInput) {
                this._focusNext();
            }
        } else {
            this._onInvalid();
        }
    }

    _focusNext() {
        this.fire(RecoveryWordsInputField.Events.FOCUS_NEXT, this._index + 1);
    }

    async _onInvalid() {
        this.dom.input.value = '';
        AnimationUtils.animate('shake', this.dom.input);
    }

    _onValueChanged() {
        if (this._value === this.value) return;

        this.complete = false;
        this.dom.element.classList.remove('complete');
        this._value = this.value;
    }

    showPlaceholder() {
        if (this.dom.element.classList.contains('has-placeholder')) return;

        // don't hide empty input fields
        if (this.value === '') return;

        // don't hide focused input fields
        if (document.activeElement === this.$input) return;

        this.dom.element.classList.add('has-placeholder');
        this.dom.element.replaceChild(this.dom.placeholder, this.dom.input);
    }

    _showInput() {
        if (!this.dom.element.classList.contains('has-placeholder')) return;

        this.dom.element.replaceChild(this.dom.input, this.dom.placeholder);

        // hide word which was revealed before
        this.fire(RecoveryWordsInputField.Events.REVEALED);
        if (RecoveryWordsInputField._revealedWord !== undefined) {
            RecoveryWordsInputField._revealedWord.showPlaceholder();
        }

        RecoveryWordsInputField._revealedWord = this;

        this.dom.element.classList.remove('has-placeholder');
    }
}

/**
 * @type {RecoveryWordsInputField | undefined} _revealedWord
 */
RecoveryWordsInputField._revealedWord = undefined;

RecoveryWordsInputField.Events = {
    FOCUS_NEXT: 'recovery-words-focus-next',
    VALID: 'recovery-word-valid',
};
