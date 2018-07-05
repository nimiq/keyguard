class LanguagePicker {

    /**
     * @param {I18n} i18n
     * @param {Element} [el]
     */
    constructor(i18n, el) {
        this._i18n = i18n;

        this.$el = el || this._createElement();
    }

    /**
     * Produces a select element that the user can chose an available language from.
     * @returns {Element}
     */
    _createElement() {
        const element = document.createElement('select');

        for (const language of this._i18n.availableLanguages()) {
            const label = this._i18n.translatePhrase('_language', language);

            const option = document.createElement('option');
            option.value = language;
            option.textContent = label;

            if (language === this._i18n.language) {
                option.setAttribute('selected', 'selected');
            }

            element.appendChild(option);
        }

        element.classList.add('i18n-language-picker');
        element.addEventListener('change', () => {
            this._i18n.switchLanguage(element.value);
        });

        return element;
    }

    /** @returns {Element} */
    getElement() {
        return this.$el;
    }
}
