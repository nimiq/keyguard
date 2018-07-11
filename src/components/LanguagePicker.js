class LanguagePicker { // eslint-disable-line no-unused-vars
    /**
     * @param {HTMLSelectElement} [$el]
     */
    constructor($el) {
        this.$el = $el || LanguagePicker._createElement($el);
    }

    /**
     * Produces a select element that the user can chose an available language from.
     * @param {HTMLSelectElement} [$el]
     * @returns {HTMLSelectElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('select');

        I18n.availableLanguages().forEach(language => {
            const label = I18n.translatePhrase('_language', language);

            const option = document.createElement('option');
            option.value = language;
            option.textContent = label;

            if (language === I18n.language) {
                option.setAttribute('selected', 'selected');
            }

            $element.appendChild(option);
        });

        $element.classList.add('i18n-language-picker');
        $element.addEventListener('change', () => {
            I18n.switchLanguage($element.value);
        });

        return $element;
    }

    /**
     * @returns {HTMLSelectElement}
     */
    getElement() {
        return this.$el;
    }
}
