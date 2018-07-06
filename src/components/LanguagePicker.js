class LanguagePicker {

    /**
     * @param {Element} [el]
     */
    constructor(el) {
        this.$el = el || this._createElement();
    }

    /**
     * Produces a select element that the user can chose an available language from.
     * @returns {Element}
     */
    _createElement() {
        const element = document.createElement('select');

        for (const language of I18n.availableLanguages()) {
            const label = I18n.translatePhrase('_language', language);

            const option = document.createElement('option');
            option.value = language;
            option.textContent = label;

            if (language === I18n.language) {
                option.setAttribute('selected', 'selected');
            }

            element.appendChild(option);
        }

        element.classList.add('i18n-language-picker');
        element.addEventListener('change', () => {
            I18n.switchLanguage(element.value);
        });

        return element;
    }

    /** @returns {Element} */
    getElement() {
        return this.$el;
    }
}
