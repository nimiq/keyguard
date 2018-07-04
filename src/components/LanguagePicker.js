class LanguagePicker {
    /**
     * Produces a select element that the user can chose an available language from.
     */
    getElement() {
        if (!i18n) {
            throw `The i18n lib has not been loaded, "i18n" not set.`;
        }

        const element = document.createElement('select');
        const options = [];

        for (const language of i18n.availableLanguages()) {
            const label = i18n.translateWord('_language', language);
            const selected = language == i18n.currentLanguage() ? ' selected' : '';
            options.push(`<option value="${ language }"${ selected }>${ label }</option>`);
        }

        element.innerHTML = options.join();
        element.classList.add('i18n-language-picker');
        element.addEventListener('change', e => {
            /** @typedef {I18n} window.i18n */
            i18n.setLanguage(element.value);
        });

        return element;
    }
}