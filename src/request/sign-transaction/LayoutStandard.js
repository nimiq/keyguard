/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {KeyguardRequest.ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        const $elList = (container.querySelectorAll(`.hide-${request.layout}`));
        $elList.forEach($item => $item.classList.add('display-none'));
        super(request, resolve, reject);
        this.$el = container;

        /** @type {HTMLElement} */
        this.$accountDetails = (this.$el.querySelector('#account-details'));
        const $accounts = this.$el.querySelectorAll('.account');
        $accounts.forEach($item => $item.addEventListener('click', () => this._openDetails($item)));
        /** @type {HTMLButtonElement} */
        this.$closeDetails = (this.$accountDetails.querySelector('#close-details'));
        this.$closeDetails.addEventListener('click', this._closeDetails.bind(this));
    }

    /**
     * @param {Element} $el
     */
    _openDetails($el) {
        console.log('open');

        /** @type {HTMLElement} */
        (this.$accountDetails.querySelector('#details')).innerHTML = $el.innerHTML;
        this.$el.classList.add('open');
    }

    _closeDetails() {
        console.log('close');
        this.$el.classList.remove('open');
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `

            <div id="account-details">
                <button id="close-details"></button>
                <div id="details"></div>
                <div class="flex-grow"></div>
            </div>
            <div id="effect-container">
                <div class="page-header nq-card-header">
                    <a tabindex="0" class="page-header-back-button nq-icon arrow-left hide-standard"></a>
                    <h1 data-i18n="sign-tx-heading-checkout" class="nq-h1 hide-standard">Verify Payment</h1>
                    <h1 data-i18n="sign-tx-heading-tx" class="nq-h1 hide-checkout">Confirm Transaction</h1>
                </div>

                <div class="page-body transaction">
                    <div class="nq-card-body">
                        <div class="center accounts">

                            <div class="account sender">
                                <div class="identicon"></div>
                                <div class="labels">
                                    <div class="label"></div>
                                    <div class="wallet-label"></div>
                                </div>
                                <div class="address">
                                    <span class="chunk"></span><span class="chunk"></span><span class="chunk"></span>
                                    <span class="chunk"></span><span class="chunk"></span><span class="chunk"></span>
                                    <span class="chunk"></span><span class="chunk"></span><span class="chunk"></span>
                                </div>
                            </div>

                            <i class="arrow nq-icon chevron-right"></i>

                            <div class="account recipient">
                                <div class="identicon"></div>
                                <div class="labels">
                                    <div class="label"></div>
                                    <div class="wallet-label"></div>
                                </div>
                                <div class="address">
                                    <span class="chunk"></span><span class="chunk"></span><span class="chunk"></span>
                                    <span class="chunk"></span><span class="chunk"></span><span class="chunk"></span>
                                    <span class="chunk"></span><span class="chunk"></span><span class="chunk"></span>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="nq-card-footer">
                        <div class="total">
                            <span id="value"></span><span class="nim-symbol"></span>
                        </div>

                        <div class="fee-section nq-text-s display-none">
                            <span data-i18n="sign-tx-includes">includes</span>
                            <span id="fee"></span>
                            <span class="nim-symbol"></span>
                            <span data-i18n="sign-tx-fee">fee</span>
                        </div>

                        <div class="data-section nq-text display-none" id="data"></div>
                    </div>
                </div>

                <div class="page-footer">
                    <form id="passphrase-box"></form>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
/** @type {{[layout: string]: string}} */
LayoutStandard.Element = {
    identicon: 'identicon',
    address: 'address',
    label: 'label',
};
