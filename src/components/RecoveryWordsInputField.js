/* global Nimiq */
/* global I18n */
/* global AutoComplete */
/* global AnimationUtils */

class RecoveryWordsInputField extends Nimiq.Observable {
    /**
     *
     * @param {number} index
     */
    constructor(index) {
        super();

        this._index = index;

        /** @type {string} */
        this._value = '';

        this.complete = false;

        this.dom = this._createElements();
        this._setupAutocomplete();
        this._addEvents();
    }

    /**
     * @param {string} paste
     */
    fillValueFrom(paste) {
        if (paste.indexOf(' ') !== -1) {
            this.value = paste.substr(0, paste.indexOf(' '));
            this._checkValidity();

            this.fire(RecoveryWordsInputField.Events.FOCUS_NEXT, this._index + 1, paste.substr(paste.indexOf(' ') + 1));
        } else {
            this.value = paste;
            this._checkValidity();
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
            input.placeholder = `${this._index < 9 ? '0' : ''}${this._index + 1}`;
        };
        I18n.observer.on(I18n.Events.LANGUAGE_CHANGED, setPlaceholder);
        setPlaceholder();

        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = (this._index + 1).toString();
        element.appendChild(input);

        return { element, input, placeholder };
    }

    _addEvents() {
        this.dom.input.addEventListener('keydown', this._onKeydown.bind(this));
        this.dom.input.addEventListener('keyup', this._onKeyup.bind(this));
        this.dom.input.addEventListener('paste', this._onPaste.bind(this));
        this.dom.input.addEventListener('blur', this._onBlur.bind(this));
    }

    _setupAutocomplete() {
        this.autocomplete = new AutoComplete({
            selector: this.dom.input,
            source: /** @param{string} term @param{function} response */ (term, response) => {
                term = term.toLowerCase();
                const list = Nimiq.MnemonicUtils.DEFAULT_WORDLIST.filter(word => word.startsWith(term));
                response(list);
            },
            onSelect: this._select.bind(this),
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

    set value(value) {
        this.dom.input.value = value;
        this._value = value;
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
        if (e.keyCode === 32 /* space */
            || e.keyCode === 9 /* tab */) {
            e.preventDefault();
        }

        if (e.keyCode === 32 // space
            || e.keyCode === 13 // enter
            || (e.keyCode === 9 && !e.shiftKey)) { // tab
            this._checkValidity(1);
        }
        if (e.keyCode === 9 && e.shiftKey) { // shift-tab
            this._checkValidity(-1);
        }
    }

    _onKeyup() {
        this._onValueChanged();
    }

    /**
     * @param {ClipboardEvent} e
     */
    _onPaste(e) {
        // @ts-ignore (Property 'clipboardData' does not exist on type 'Window'.)
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
     * @param {number} [setFocusToNextInputOffset = 0]
     */
    _checkValidity(setFocusToNextInputOffset = 0) {
        if (Nimiq.MnemonicUtils.DEFAULT_WORDLIST.indexOf(this.value.toLowerCase()) >= 0) {
            this.complete = true;
            this.dom.element.classList.add('complete');
            this.fire(RecoveryWordsInputField.Events.VALID, this);
            if (setFocusToNextInputOffset) {
                this._focusNext(setFocusToNextInputOffset);
            }
        } else {
            this._onInvalid();
        }
    }

    /**
     * Callback from AutoComplete
     * @param {Event} e - original Event
     * @param {string} term - the selected term
     * @param {Element} item - the item that held the term
     */
    _select(e, term, item) {
        item.classList.remove('selected');
        this.value = term;
        this._focusNext();
    }

    /**
     *
     * @param {number} [offset = 1]
     */
    _focusNext(offset = 1) {
        this.fire(RecoveryWordsInputField.Events.FOCUS_NEXT, this._index + offset);
    }

    _onInvalid() {
        this.dom.input.value = '';
        this._onValueChanged();
        AnimationUtils.animate('shake', this.dom.input);
    }

    _onValueChanged() {
        if (this.value === this._value) return;

        if (this.complete) {
            this.complete = false;
            this.dom.element.classList.remove('complete');
            this.fire(RecoveryWordsInputField.Events.INVALID, this);
        }

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
    INVALID: 'recovery-word-invalid',
};
