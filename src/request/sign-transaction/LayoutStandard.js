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

        // recipient
        /** @type {HTMLDivElement} */
        const $recipient = (this.$el.querySelector('.recipient'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($recipient.querySelector('.identicon'));
        if (request.shopLogoUrl) {
            const $shopLogo = document.createElement('img');
            $shopLogo.src = request.shopLogoUrl.href;
            $recipientIdenticon.classList.add('clip');
            $recipientIdenticon.appendChild($shopLogo);
        } else {
            // eslint-disable-next-line no-new
            new Identicon(request.transaction.recipient.toUserFriendlyAddress(), $recipientIdenticon);
        }

        /** @type {HTMLElement} */
        const $recipientAddress = ($recipient.querySelector('.address'));
        /** @type {string[]} */
        const recipientAddressChunks = (
            request.transaction.recipient
                .toUserFriendlyAddress()
                .replace(/[+ ]/g, '').match(/.{4}/g)
        );
        for (let x = 0; x < 9; x++) {
            $recipientAddress.children[x].textContent = recipientAddressChunks[x];
        }

        /** @type {HTMLElement} */
        const $recipientLabel = ($recipient.querySelector('.label'));
        if (request.shopOrigin) {
            $recipientLabel.textContent = this._originToDomain(request.shopOrigin);
        } else if (request.recipientLabel) {
            $recipientLabel.textContent = request.recipientLabel;
        }

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

                            <a class="account sender" href="javascript:void(0);">
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
                            </a>

                            <i class="arrow nq-icon chevron-right"></i>

                            <a class="account recipient" href="javascript:void(0);">
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
                            </a>

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

                        <div class="data-section display-none" id="data"></div>
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
