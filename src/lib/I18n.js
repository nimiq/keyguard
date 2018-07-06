class I18n {

    /**
     * @param {object} dictionary - dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found.
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${ fallbackLanguage }" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        /** @type {string} */
        this._language;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to, or the currently selected language by default
     **/
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${ attribute }]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        }

        /**
         * @param {string} tag
         */
        const translateAttribute = (tag) => {
            translateElements(`i18n-${ tag }`, (element, translation) => element.setAttribute(tag, translation));
        }

        translateElements('i18n', (element, translation) => element.textContent = translation);
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to, or the currently selected language by default
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     */
    static _translate(id, language) {
        return this._dict[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this._dict);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
        this.translateDom();
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        if (language in this._dict) return language;

        const baseLanguage = language.split('-')[0];

        // Return the the base language, if it exists in the dictionary
        if (baseLanguage !== language && baseLanguage in this._dict) return baseLanguage;

        // Check if other versions of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        for (const supportedLanguage of this.availableLanguages()) {
            if (supportedLanguage.startsWith(languagePrefix)) return supportedLanguage;
        }

        return this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        this._language = languageToUse;
    }

    static get language() {
        return this._language;
    }

    static get dictionary() {
        return this._dict;
    }

    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }
}
