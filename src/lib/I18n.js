class I18n {
    /**
     * @param {object} dictionary
     * @param {string} [language] - Language to translate to
     */
    constructor(dictionary, language) {
        this._dict = dictionary;

        /** @type {string} */
        this._language = '';

        this.setLanguage(language || navigator.language);
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [language] - ISO code of language to translate to, or the currently selected language by default
     **/
    translateDom(dom, language) {
        const root = dom || document.body;

        /** @type {NodeListOf<HTMLElement>} */
        const nodes = root.querySelectorAll('[data-i18n]');
        nodes.forEach(el => {
            const id = el.dataset.i18n;
            if (!id) return;
            el.textContent = this.translatePhrase(id, language);
        });
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [language] - ISO code of language to translate to, or the currently selected language by default
     */
    translatePhrase(id, language) {
        language = this.getClosestSupportedLanguage(language || this._language);
        let translation = this._dict[language][id];
        if (!translation) {
            console.warn(`No translation defined for "${id}" in language "${language}"!`);
            translation = this._dict[this.getClosestSupportedLanguage('en')][id];
            throw new Error(`No translation defined for "${id}"`);
        }
        return translation;
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    availableLanguages() {
        return Object.keys(this._dict);
    }

    /**
     * @param {string} language
     */
    switchLanguage(language) {
        this.setLanguage(language);
        this.translateDom();
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    getClosestSupportedLanguage(language) {
        if (language in this._dict) return language;
        language = language.split('-')[0];
        if (language in this._dict) return language;
        const languagePrefix = `${language}-`;
        for (const supportedLanguage of this.availableLanguages()) {
            if (supportedLanguage.startsWith(languagePrefix)) return supportedLanguage;
        }
        // language is not supported. Return a variant of 'en' if available, otherwise an arbitrary supported language
        if (language !== 'en') {
            return this.getClosestSupportedLanguage('en');
        } else {
            return this.availableLanguages()[0];
        }
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    setLanguage(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);
        if (languageToUse !== language) {
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }
        this._language = languageToUse;
    }

    get language() {
        return this._language;
    }

    get dictionary() {
        return this._dict;
    }
}
