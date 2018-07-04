const translations = {
    "en": {
        _language: "English",
        applePie: "apple pie"
    },
    "de": {
        _language: "Deutsch",
        applePie: "Apfelkuchen"
    }
};

export class I18n {
    /**
     * @param {string} defaultLanguage language to start with if non given.
     */
    constructor(defaultLanguage = navigator.language) {
        this.dict = translations;
        this.current = '';
        this.setLanguage(defaultLanguage);
    }

    /** 
     * @param {HTMLElement} [dom] The DOM element to be translated, or body by default
     * @param {String} [language] The language to translate to, or the currently selected language by default
     **/
    translate(dom = document.body, language = this.current) {
        if (!this.dict[language]) {
            throw `Language "${ language }" is not supported!`
        }
        dom.querySelectorAll('[data-i18n]').forEach(e => {
            const e2 = /** @type {HTMLElement} */ (e);
            const id = e2.dataset.i18n || "";
            const translation = this.dict[language][id];
            if (!translation) {
                throw `No translation defined for "${ id }" in language  "${ language }"!`
            }
            e2.textContent = translation;
        });
    }

    /**
     * 
     * @param {string} language ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    setLanguage(language) {
        language = language.toLocaleLowerCase();
        if (!this.dict[language] && language.indexOf('-') > 0) {
            language = language.split('-')[0];
        }
        if (!this.dict[language]) {
            throw `Language "${ language }" is not supported!`
        }
        this.current = language;
        this.translate();
    }

    /**
     * Produces a select element that the user can chose an available language from.
     */
    languagePicker() {
        const element = document.createElement('select');
        const options = [];
        for (const language in this.dict) {
            const label = this.dict[language]._language;
            if (!label) {
                throw `Language label "_language" for language  "${ language } missing"!`
            }
            const selected = language == this.current ? ' selected' : '';
            options.push(`<option value="${ language }"${ selected }>${ label }</option>`);
        }
        element.innerHTML = options.join();
        element.classList.add('i18n-language-picker');
        element.addEventListener('change', e => {
            this.setLanguage(element.value);
        });
        return element;
    }
}