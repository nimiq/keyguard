/* global Nimiq */
/* global I18n */
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
     * @param {string} paste
     */
    fillValueFrom(paste) {
        if (paste.indexOf(' ') !== -1) {
            this.dom.input.value = paste.substr(0, paste.indexOf(' '));
            this.fire(RecoveryWordsInputField.Events.FOCUS_NEXT, this._index + 1, paste.substr(paste.indexOf(' ') + 1));
        } else {
            this.dom.input.value = paste;
        }
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
        input.addEventListener('paste', this._onPaste.bind(this));
        input.addEventListener('blur', this._onBlur.bind(this));

        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = (this._index + 1).toString();
        element.appendChild(input);

        return { element, input, placeholder };
    }

    _setupAutocomplete() {
        this.autocomplete = new AutoComplete({
            selector: this.dom.input,
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
     * @param {ClipboardEvent} e
     */
    _onPaste(e) {
        // @ts-ignore window.clipboardData not defined
        let paste = (e.clipboardData || window.clipboardData).getData('text');
        paste = paste.replace(/\s+/g, ' ');
        if (paste && paste.split(' ').length > 1) {
            e.preventDefault();
            e.stopPropagation();
            this.fillValueFrom(paste);
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
        this._onValueChanged();
        AnimationUtils.animate('shake', this.dom.input);
    }

    _onValueChanged() {
        if (this._value === this.value) return;

        this.complete = false;
        this.dom.element.classList.remove('complete');
        this._value = this.value;
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
