/* global RecoveryWordsInputField */
/* global AnimationUtils */
class RecoveryWordsInput extends Nimiq.Observable {
    /**
     *
     * @param {HTMLElement} [el]
     */
    constructor(el) {
        super();
        this._mnemonic = '';
        /** @type{RecoveryWordsInputField[]} */ this.$fields = [];
        this.$el = this._createElement(el);
    }

    /**
     * @param {HTMLElement} [el]
     * @returns {HTMLElement}
     */
    _createElement(el) {
        if (!el) el = document.createElement('div');
        el.classList.add('recovery-words-input');

        const label = document.createElement('div');
        label.classList.add('label');
        label.innerHTML = '<div data-i18n="recovery-words-input-label"></div>';
        el.appendChild(label);

        const form = document.createElement('form');
        form.setAttribute('autocomplete', 'off');
        el.appendChild(form);

        for (let index = 0; index < 24; index++) {
            const field = new RecoveryWordsInputField(index);
            field.element.dataset.index = index.toString();
            field.on(RecoveryWordsInputField.Events.VALID, this._onFieldComplete.bind(this));
            field.on(RecoveryWordsInputField.Events.FOCUS_NEXT, this._setFocusToNextInput.bind(this));

            this.$fields.push(field);
            form.appendChild(field.element);
        }

        setTimeout(() => this.$fields[0].focus(), 100);

        I18n.translateDom(el);
        return el;
    }

    focus() {
        this.$fields[0].focus();
    }

    /** @returns {HTMLElement} */
    getElement() {
        return this.$el;
    }

    /**
     * @param {RecoveryWordsInputField} field
     */
    _onFieldComplete(field) {
        if (!field.value) return;

        field.showPlaceholder();

        this._checkPhraseComplete();
    }

    _checkPhraseComplete() {
        const check = this.$fields.find(field => !field.complete);
        if (typeof check !== 'undefined') return;

        const words = this.$fields.map(field => field.value).join(' ');
        try {
            this.fire(RecoveryWordsInput.Events.COMPLETE, words);
        } catch (e) {
            // assume wrong words but printing out for debugging
            console.error(e); // eslint-disable-line no-console
            this._animateError();
        }
    }

    /**
     * @param {number} index
     */
    _setFocusToNextInput(index) {
        if (index < this.$fields.length) {
            this.$fields[index].focus();
        }
    }

    _animateError() {
        AnimationUtils.animate('shake', this.$el);
    }
}

RecoveryWordsInput.Events = {
    COMPLETE: 'recovery-words-complete',
};
