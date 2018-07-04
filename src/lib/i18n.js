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

class I18n {
    /**
     * @param {string} defaultLanguage - language to start with if non given.
     */
    constructor(defaultLanguage = navigator.language) {
        this._dict = translations;
        this._current = '';
        this.setLanguage(defaultLanguage);
    }

    /** 
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {String} [language] - ISO code of language to translate to, or the currently selected language by default
     **/
    translateDom(dom = document.body, language = this._current) {
        dom.querySelectorAll('[data-i18n]').forEach(e => {
            const e2 = /** @type {HTMLElement} */ (e);
            const id = e2.dataset.i18n || "";
            e2.textContent = this.translateWord(id, language);
        });
    }

    /**
     * 
     * @param {string} id - translation dict ID
     * @param {string} language - ISO code of language to translate to, or the currently selected language by default
     */
    translateWord(id, language = this._current) {
        if (!this._dict[language]) {
            throw `Language "${ language }" is not supported!`
        }
        const translation = this._dict[language][id];
        if (!translation) {
            throw `No translation defined for "${ id }" in language  "${ language }"!`
        }
        return translation;
    }

    /**
     * ISO codes of all available languages.
     */
    availableLanguages() {
        const languages = [];
        for (const language in this._dict) {
            languages.push(language);
        }
        return languages;
    }

    /**
     * 
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    setLanguage(language) {
        language = language.toLocaleLowerCase();
        if (!this._dict[language] && language.indexOf('-') > 0) {
            language = language.split('-')[0];
        }
        if (!this._dict[language]) {
            throw `Language "${ language }" is not supported!`
        }
        this._current = language;
        this.translateDom();
    }

    currentLanguage() {
        return this._current;
    }
}

var i18n = null;
document.addEventListener("DOMContentLoaded", function(event) {
    i18n = new I18n();
});