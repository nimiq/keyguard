/* global BaseLayout */
/* global I18n */
/* global Nimiq */
/* global PaymentInfoLine */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin);

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;

        // Set up payment-info-line
        const $paymentInfoLine = /** @type {HTMLElement} */ (document.querySelector('.payment-info-line'));

        const transaction = request.transaction;
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);
        new PaymentInfoLine( // eslint-disable-line no-new
            $paymentInfoLine,
            LayoutCheckout._originToDomain(request.shopOrigin),
            this._formatNumber(totalNim),
        );
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <div class="transaction-section">
                    <h1>
                        <span data-i18n="sign-tx-youre-sending">You're sending</span>
                        <strong id="value"></strong>
                        <strong class="nim-symbol"></strong>
                        <span data-i18n="sign-tx-to">to</span>
                    </h1>

                    <div class="account shop-account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="account-text">
                            <div class="label" id="recipient-label"></div>
                            <div class="address" id="recipient-address"></div>
                        </div>
                    </div>

                    <div class="data-section nq-text display-none" id="data"></div>
                </div>

                <div class="sender-section">
                    <div data-i18n="sign-tx-pay-with" class="nq-label">Pay with</div>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }
}
