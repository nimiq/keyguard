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
     * @param {string} [enforceLanguage] - ISO code of language to translate to, or the currently selected language by default
     **/
    static translateDom(dom = document.body, enforceLanguage) {
        const language = enforceLanguage ? this.getClosestSupportedLanguage(enforceLanguage) : this.language;

        /**
         * @param {string} tag 
         * @param {(element:HTMLElement, translation: string) => void} callback - callback(element, translation) for each matching element
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
     * @param {string} [enforceLanguage] - ISO code of language to translate to, or the currently selected language by default
     */
    static translatePhrase(id, enforceLanguage) {
        const language = enforceLanguage ? this.getClosestSupportedLanguage(enforceLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id 
     * @param {string} language 
     */
    static _translate(id, language) {
        let translation = this._dict[language][id];
        if (!translation) {
            console.warn(`No translation defined for "${ id }" in language "${ language }"!`);
            translation = this._dict[this.fallbackLanguage][id];
            throw new Error(`No translation defined for "${ id }" in fallback language "${ this.fallbackLanguage }"`);
        }
        return translation;
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
        language = language.split('-')[0];
        if (language in this._dict) return language;
        const languagePrefix = `${language}-`;
        for (const supportedLanguage of this.availableLanguages()) {
            if (supportedLanguage.startsWith(languagePrefix)) return supportedLanguage;
        }
        // language is not supported. Return a variant of this._fallbackLanguage if available, otherwise an arbitrary supported language
        if (language !== this._fallbackLanguage) {
            return this.getClosestSupportedLanguage(this.fallbackLanguage);
        } else {
            return this.availableLanguages()[0];
        }
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
        return this._fallbackLanguage || 'en';
    }
}