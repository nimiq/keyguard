const translations = {
    "en-en": {
        applePie: "apple pie"
    },
    "de-de": {
        applePie: "Apfelkuchen"
    }
};

export class I18n {
    constructor() {
        this.dict = translations;
    }

    /** 
     * @param {HTMLElement} dom 
     * @param {String} language 
     **/
    translate(dom, language) {
        if (!this.dict[language]) {
            throw `Language "${language}" is not supported!`
        }
        dom.querySelectorAll('[data-i18n]').forEach(e => {
            const e2 = /** @type {HTMLElement} */ (e);
            const id = e2.dataset.i18n || "";
            const translation = this.dict[language][id] || `"${id} not defined in language  "${language}"!`;
            e2.textContent = translation;
        });
    }
}