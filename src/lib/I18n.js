/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global Nimiq */

/**
 * @typedef {{[language: string]: {[id: string]: string}}} dict
 */

class I18n { // eslint-disable-line no-unused-vars
    /**
     * @param {dict} dictionary - Dictionary of all languages and phrases
     * @param {string} fallbackLanguage - Language to be used if no translation for the current language can be found
     */
    static initialize(dictionary, fallbackLanguage) {
        this._dict = dictionary;

        if (!(fallbackLanguage in this._dict)) {
            throw new Error(`Fallback language "${fallbackLanguage}" not defined`);
        }
        /** @type {string} */
        this._fallbackLanguage = fallbackLanguage;

        this.language = navigator.language;
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

        /* eslint-disable-next-line valid-jsdoc */ // Multi-line descriptions are not valid JSDoc, apparently
        /**
         * @param {string} tag
         * @param {(element: HTMLElement, translation: string) => void} callback - callback(element, translation) for
         * each matching element
         */
        const translateElements = (tag, callback) => {
            const attribute = `data-${tag}`;
            /** @type {NodeListOf<HTMLElement>} */
            const elements = dom.querySelectorAll(`[${attribute}]`);
            elements.forEach(element => {
                const id = element.getAttribute(attribute);
                if (!id) return;
                callback(element, this._translate(id, language));
            });
        };

        /**
         * @param {string} tag
         */
        const translateAttribute = tag => {
            translateElements(`i18n-${tag}`, (element, translation) => element.setAttribute(tag, translation));
        };

        translateElements('i18n', (element, translation) => {
            const doc = this.parser.parseFromString(translation, 'text/html');
            const noHtml = /** @type {string} */ (doc.body.textContent);
            const withMarkup = noHtml.replace('[strong]', '<strong>').replace('[/strong]', '</strong>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @param {string} id - translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    static translatePhrase(id, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        return this._translate(id, language);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) throw new Error(`I18n: ${language}/${id} is undefined!`);
        return this.dictionary[language][id];
    }

    /**
     * @returns {string[]} ISO codes of all available languages.
     */
    static availableLanguages() {
        return Object.keys(this.dictionary);
    }

    /**
     * @param {string} language
     */
    static switchLanguage(language) {
        this.language = language;
    }

    /**
     * Selects a supported language closed to the desired language. Examples it might return:
     * en-us => en-us, en-us => en, en => en-us, fr => en.
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     * @returns {string}
     */
    static getClosestSupportedLanguage(language) {
        // If this language is supported, return it directly
        if (language in this.dictionary) return language;

        // Return the base language, if it exists in the dictionary
        const baseLanguage = language.split('-')[0];
        if (baseLanguage !== language && baseLanguage in this.dictionary) return baseLanguage;

        // Check if other versions (siblings) of the base language exist
        const languagePrefix = `${baseLanguage}-`;
        const siblingLanguage = this.availableLanguages()
            .find(supportedLanguage => supportedLanguage.startsWith(languagePrefix));

        return siblingLanguage || this.fallbackLanguage;
    }

    /**
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    static set language(language) {
        const languageToUse = this.getClosestSupportedLanguage(language);

        if (languageToUse !== language) {
            // eslint-disable-next-line no-console
            console.warn(`Language ${language} not supported, using ${languageToUse} instead.`);
        }

        if (this._language !== languageToUse) {
            /** @type {string} */
            this._language = languageToUse;

            if (({ interactive: 1, complete: 1 })[document.readyState]) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            I18n.observer.fire(I18n.Events.LANGUAGE_CHANGED, this._language);
        }
    }

    /** @type {string} */
    static get language() {
        return this._language || this.fallbackLanguage;
    }

    /** @type {dict} */
    static get dictionary() {
        if (!this._dict) throw new Error('I18n not initialized');
        return this._dict;
    }

    /** @type {string} */
    static get fallbackLanguage() {
        if (!this._fallbackLanguage) throw new Error('I18n not initialized');
        return this._fallbackLanguage;
    }

    /** @returns {DOMParser} */
    static get parser() {
        /** @type {DOMParser} */
        this._parser = this._parser || new DOMParser();

        return this._parser;
    }
}

I18n.observer = new Nimiq.Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
