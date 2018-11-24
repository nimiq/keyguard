/* global I18n */

class PrivacyWarning { // eslint-disable-line no-unused-vars
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        this.$el = PrivacyWarning._createElement($el);
    }

    /**
     * @param {HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        /** @type HTMLElement */
        $el = $el || document.createElement('div');
        $el.classList.add('privacy-warning');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <div class="privacy-warning-top">
                <div class="nq-icon privacy-agent"></div>
                <h2 data-i18n="privacy-warning-heading" class="nq-h2 nq-red">Are you being watched?</h2>
            </div>
            <p data-i18n="privacy-warning-text" class="nq-text">Now is the perfect time to assess your surroundings. Nearby windows? Hidden cameras? Shoulder spies? Anyone with your backup phrase can access and spend your NIM.</p>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }
}
