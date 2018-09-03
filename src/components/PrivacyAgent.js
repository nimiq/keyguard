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

        /** @type {HTMLElement} */
        const $privacyWarning = (this.$el.querySelector('.privacy-warning'));

        /** @type {HTMLButtonElement} */
        const $button = (this.$el.querySelector('button'));

        this._privacyWarning = new PrivacyWarning($privacyWarning);

        $button.addEventListener('click', () => {
            this.fire(PrivacyAgent.Events.CONFIRM);
        });
    }

    /**
     * @param {HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    _createElement($el) {
        /** @type HTMLElement */
        $el = $el || document.createElement('div');
        $el.classList.add('privacy-agent');

        $el.innerHTML = `
            <div class="privacy-warning"></div>
            <div class="grow"></div>
            <button data-i18n="privacy-agent-continue">Continue</button>
        `;

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

PrivacyAgent.Events = {
    CONFIRM: 'privacy-agent-confirm',
};
