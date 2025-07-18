/* global Observable */
/* global TRANSLATIONS */ // eslint-disable-line no-unused-vars
/* global CookieJar */

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

        this.language = this.detectLanguage();

        window.addEventListener('focus', this._onTabFocus.bind(this));
    }

    /**
     * @returns {string} The detected language set in the 'lang' cookie. Fallback to the browser language.
     */
    static detectLanguage() {
        const langCookie = CookieJar.readCookie(CookieJar.Cookie.LANGUAGE);
        const lang = langCookie ? decodeURIComponent(langCookie) : navigator.language.split('-')[0];
        return I18n.getClosestSupportedLanguage(lang);
    }

    /**
     * This method is executed on tab focus to check if the selected language got changed in another tab
     * by the user and, if so, ask him if he wants to reload the page to update translations
     */
    static _onTabFocus() {
        const lang = this.detectLanguage();
        if (lang !== this.language && Object.keys(window.TRANSLATIONS).includes(lang)) {
            this.language = lang;
            const question = this.translatePhrase('language-changed');

            // eslint-disable-next-line no-alert
            if (window.confirm(question)) {
                document.location.reload();
            }
        }
    }

    /**
     * @param {HTMLElement} [dom] - The DOM element to be translated, or body by default
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     */
    static translateDom(dom = document.body, enforcedLanguage) {
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;

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
            const sanitized = translation.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const withMarkup = sanitized
                .replace(/\[strong]/g, '<strong>')
                .replace(/\[\/strong]/g, '</strong>')
                .replace(/\[br]/g, '<br/>');
            element.innerHTML = withMarkup;
        });
        translateAttribute('value');
        translateAttribute('placeholder');
    }

    /**
     * @overload
     * @param {string} id - Translation dict ID
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    /**
     * @overload
     * @param {string} id - Translation dict ID
     * @param {Record<string, string | number>} [variables] - Variables to replace translation placeholders with
     * @param {string} [enforcedLanguage] - ISO code of language to translate to
     * @returns {string}
     */
    /**
     * @param {string} id
     * @param {Record<string, string | number> | string} [variablesOrEnforcedLanguage]
     * @param {string} [enforcedLanguage]
     * @returns {string}
     */
    static translatePhrase(id, variablesOrEnforcedLanguage, enforcedLanguage) {
        const variables = typeof variablesOrEnforcedLanguage === 'object' ? variablesOrEnforcedLanguage : undefined;
        enforcedLanguage = typeof variablesOrEnforcedLanguage === 'string'
            ? variablesOrEnforcedLanguage
            : enforcedLanguage;
        const language = enforcedLanguage ? this.getClosestSupportedLanguage(enforcedLanguage) : this.language;
        const translation = this._translate(id, language);
        if (!variables) return translation;
        return translation.replace(
            /{(\w+?)}/g,
            (match, variableName) => (variables[variableName] !== undefined ? `${variables[variableName]}` : match),
        );
    }

    /**
     * @template V
     * @param {string} id - Translation dict ID
     * @param {Record<string, V>} [variables] - Variables to replace translation placeholders with
     * @returns {Array<string | V>} - Translation parts where placeholders have been replaced by their variables
     */
    static translateToParts(id, variables) {
        const translation = this._translate(id, this.language);
        const parts = translation.split(/({\w+?})/g).filter(part => !!part);
        return parts.map(part => {
            if (!variables || !part.startsWith('{') || !part.endsWith('}')) return part; // no vars or not a placeholder
            const variableName = part.substring(1, part.length - 1);
            return variables[variableName] !== undefined ? variables[variableName] : part;
        });
    }

    /**
     * @callback StopUpdates
     * @returns {void}
     */
    /**
     * @overload
     * @param {HTMLElement} element - Parent element for which to set translated HTML content
     * @param {string} id - Translation dict ID
     * @param {Record<string, string | Node>} [variables] - Variables to replace translation placeholders with
     * @param {true} [updateOnLanguageChange=true] - Auto-update HTML content on language change
     * @returns {StopUpdates} - A method to stop automated updates on language change
     */
    /**
     * @overload
     * @param {HTMLElement} element - Parent element for which to set translated HTML content
     * @param {string} id - Translation dict ID
     * @param {Record<string, string | Node> | undefined} variables - Variables to replace translation placeholders with
     * @param {false} updateOnLanguageChange - Set to false to disable auto-updating HTML content on language change
     * @returns {void}
     */
    /**
     * @param {HTMLElement} element - Parent element for which to set translated HTML content
     * @param {string} id - Translation dict ID
     * @param {Record<string, string | Node>} [variables] - Variables to replace translation placeholders with
     * @param {boolean} [updateOnLanguageChange=true] - Auto-update HTML content on language change
     * @returns {StopUpdates | undefined} - A method to stop automated updates on language change
     */
    static translateToHtmlContent(element, id, variables, updateOnLanguageChange = true) {
        // eslint-disable-next-line require-jsdoc-except/require-jsdoc
        const update = () => {
            element.innerHTML = ''; // clear previous content
            element.append(...I18n.translateToParts(id, variables));
        };
        update();
        if (!updateOnLanguageChange) return;
        const observerId = I18n.observer.on(I18n.Events.LANGUAGE_CHANGED, update);
        // eslint-disable-next-line consistent-return
        return () => I18n.observer.off(I18n.Events.LANGUAGE_CHANGED, observerId);
    }

    /**
     * @param {string} id
     * @param {string} language
     * @returns {string}
     */
    static _translate(id, language) {
        if (!this.dictionary[language] || !this.dictionary[language][id]) {
            throw new Error(`I18n: ${language}/${id} is undefined!`);
        }
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

            if (['interactive', 'complete'].indexOf(document.readyState) > -1) {
                this.translateDom();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    this.translateDom();
                });
            }
            document.documentElement.setAttribute('lang', this._language);
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

I18n.observer = new Observable();
I18n.Events = {
    LANGUAGE_CHANGED: 'language-changed',
};
