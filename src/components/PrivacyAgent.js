/* global I18n */
/* global Nimiq */
/* global PrivacyWarning */

class PrivacyAgent extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {HTMLElement} [element]
     */
    constructor(element) {
        super();
        this.$el = this._createElement(element);
    }

    /**
     * @param {HTMLElement} [existingElement]
     * @returns {HTMLElement}
     */
    _createElement(existingElement) {
        /** @type HTMLElement */
        const element = existingElement || document.createElement('div');

        /* eslint-disable max-len */
        element.innerHTML = `
            <div class="privacy-agent-container-container"></div>
            <div class="grow"></div>
            <button data-i18n="privacy-agent-ok">OK, all good</button>
        `;
        /* eslint-enable max-len */

        /** @type {HTMLElement} */
        const $privacyAgent = (element.querySelector('.privacy-agent-container-container'));
        this._privacyAgent = new PrivacyWarning($privacyAgent);

        /** @type {HTMLButtonElement} */
        const $ok = (element.querySelector('button'));

        $ok.addEventListener('click', () => {
            this.fire(PrivacyAgent.Events.CONFIRM);
        });

        I18n.translateDom(element);
        return element;
    }

    /** @returns {HTMLElement} */
    getElement() {
        return this.$el;
    }
}

PrivacyAgent.Events = {
    CONFIRM: 'privacy-agent-confirm',
};
