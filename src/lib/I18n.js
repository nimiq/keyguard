class I18n {
    /**
     * @param {object} dictionary
     * @param {string} [language] - Language to translate to
     */
    constructor(dictionary, language) {
        this._dict = dictionary;

        /** @type {string} */
        this._language;

        this.setLanguage(language || navigator.language);
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [lang] - ISO code of language to translate to, or the currently selected language by default
     **/
    translateDom(dom, lang) {
        const root = dom || document.body;
        const language = lang || this._language;

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
     * @param {string} language - ISO code of language to translate to, or the currently selected language by default
     */
    translatePhrase(id, language) {
        if (!this._dict[language]) {
            throw new Error(`Language "${ language }" is not supported!`);
        }
        const translation = this._dict[language][id];
        if (!translation) {
            throw new Error(`No translation defined for "${ id }" in language "${ language }"!`);
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
     * @param {string} language - ISO 639-1 language codes, e.g. en, en-us, de, de-at
     */
    setLanguage(language) {
        language = language.toLocaleLowerCase();
        if (!this._dict[language] && language.indexOf('-') > 0) {
            language = language.split('-')[0];
        }
        if (!this._dict[language]) {
            throw new Error(`Language "${ language }" is not supported!`);
        }
        this._language = language;
    }

    get language() {
        return this._language;
    }

    get dictionary() {
        return this._dict;
    }
}
