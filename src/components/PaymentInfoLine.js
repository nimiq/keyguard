/* global Nimiq */

class PaymentInfoLine extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {string} domain
     * @param {string} formattedAmount
     */
    constructor($el, domain, formattedAmount) {
        super();
        this.$el = PaymentInfoLine._createElement($el, domain, formattedAmount);
        this.$el.classList.remove('display-none');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {string} domain
     * @param {string} formattedAmount
     * @returns {HTMLElement}
     */
    static _createElement($el, domain, formattedAmount) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line', 'nq-label');

        $el.innerHTML = `
            <div class="description">
                Payment to
                <span domain></span>
            </div>
            <div class="amount">
                <span amount></span>
                <span class="nim-symbol"></span>
            </div>
        `;

        /** @type {HTMLElement} */ ($el.querySelector('[domain]')).textContent = domain;
        /** @type {HTMLElement} */ ($el.querySelector('[amount]')).textContent = formattedAmount;

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
