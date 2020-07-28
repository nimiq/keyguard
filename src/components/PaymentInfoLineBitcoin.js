/* global PaymentInfoLine */
/* global I18n */
/* global TemplateTags */
/* global NumberFormatting */
/* global BitcoinUtils */

/** @typedef {{
 *      recipient: string,
 *      label?: string,
 *      imageUrl?: URL,
 *      satoshiAmount: number,
 *      networkFee: number,
 *      fiatAmount?: number,
 *      fiatCurrency?: string,
 *      vendorMarkup?: number,
 *      time?: number,
 *      expires?: number
 *  }} BitcoinPaymentInfo */

class PaymentInfoLineBitcoin extends PaymentInfoLine { // eslint-disable-line no-unused-vars
    /**
     * @param {BitcoinPaymentInfo} paymentInfo
     * @param {HTMLElement} [$el]
     */
    constructor(paymentInfo, $el) {
        super({ ...paymentInfo, lunaAmount: 0 }, $el);

        /** @type HTMLElement */
        const $nimAmount = (this.$el.querySelector('.nim-amount'));
        const btcAmount = NumberFormatting.formatNumber(BitcoinUtils.satoshisToCoins(paymentInfo.satoshiAmount), 7);
        $nimAmount.textContent = `${btcAmount} BTC`;
    }

    /**
     * @protected
     * @param {HTMLElement} $container
     */
    _createPriceTooltip($container) {
        // eslint-disable-next-line object-curly-newline
        const {
            fiatAmount,
            fiatCurrency,
            vendorMarkup,
            satoshiAmount,
            networkFee,
        } = /** @type {BitcoinPaymentInfo} */ (/** @type {unknown} */ (this.paymentInfo));

        if (!fiatAmount || !fiatCurrency) return;

        const $tooltip = document.createElement('div');
        $tooltip.classList.add('price-tooltip', 'tooltip');
        $tooltip.tabIndex = 0; // make the tooltip focusable

        /* eslint-disable indent */
        $tooltip.innerHTML = TemplateTags.hasVars(1)`
            <svg class="warning-triangle nq-icon">
                <use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-alert-triangle"/>
            </svg>
            <span class="fiat-amount"></span>
            <div class="tooltip-box">
                <div class="price-breakdown">
                    <label data-i18n="payment-info-line-order-amount">Order amount</label>
                    <div class="fiat-amount"></div>
                    <template class="vendor-markup-template">
                        ${!vendorMarkup || vendorMarkup >= 0
                            ? '<label data-i18n="payment-info-line-vendor-markup">Vendor crypto markup</label>'
                            : '<label data-i18n="payment-info-line-vendor-discount">Vendor crypto discount</label>'
                        }
                        <div class="vendor-markup"></div>
                    </template>
                    <label class="highlight-on-bad-rate" data-i18n="payment-info-line-effective-rate">
                        Effective rate
                    </label>
                    <div class="effective-rate highlight-on-bad-rate"></div>
                </div>
                <div class="rate-info info highlight-on-bad-rate"></div>
                <div class="free-service-info info" data-i18n="payment-info-line-free-service">
                    Nimiq provides this service free of charge.
                </div>
                <hr>
                <div class="price-breakdown">
                    <label data-i18n="payment-info-line-total">Total</label>
                    <div class="total"></div>
                </div>
                <div class="network-fee-info info">
                    + <span class="network-fee"></span>
                    <span data-i18n="payment-info-line-network-fee">network fee</span>
                </div>
            </div>
        `;
        /* eslint-enable indent */

        const formattedFiatAmount = NumberFormatting.formatCurrency(fiatAmount, fiatCurrency);
        $tooltip.querySelectorAll('.fiat-amount').forEach($fiatAmount => {
            $fiatAmount.textContent = formattedFiatAmount;
        });

        /** @type {HTMLTemplateElement} */
        const $vendorMarkupTemplate = ($tooltip.querySelector('.vendor-markup-template'));
        if (vendorMarkup !== undefined) {
            // Convert to percent and round to two decimals. Always ceil to avoid displaying a lower fee than charged or
            // larger discount than applied. Subtract small epsilon to avoid that numbers get rounded up as a result of
            // floating point imprecision after multiplication. Otherwise formatting for example .07 results in 7.01%.
            const vendorMarkupPercent = Math.ceil(vendorMarkup * 100 * 100 - 1e-10) / 100;
            $vendorMarkupTemplate.replaceWith($vendorMarkupTemplate.content);
            /** @type {HTMLElement} */
            const $vendorMarkup = ($tooltip.querySelector('.vendor-markup'));
            $vendorMarkup.textContent = `${vendorMarkup >= 0 ? '+' : ''}${vendorMarkupPercent}%`;
        } else {
            $vendorMarkupTemplate.remove();
        }

        /** @type {HTMLElement} */
        const $effectiveRate = ($tooltip.querySelector('.effective-rate'));
        // Fiat/crypto rate. Higher fiat/crypto rate means user is paying less crypto for the requested fiat amount
        // and is therefore better for the user. Note: precision loss should be acceptable here.
        const effectiveRate = fiatAmount / BitcoinUtils.satoshisToCoins(satoshiAmount);
        $effectiveRate.textContent = `${NumberFormatting.formatCurrency(effectiveRate, fiatCurrency, 0.0001)} / BTC`;

        /** @type {HTMLElement} */
        const $total = ($tooltip.querySelector('.total'));
        $total.textContent = `${NumberFormatting.formatNumber(BitcoinUtils.satoshisToCoins(satoshiAmount))} BTC`;

        // Note that in the Keyguard the fee is never undefined.
        if (networkFee !== 0) {
            /** @type {HTMLElement} */
            const $networkFee = ($tooltip.querySelector('.network-fee'));
            $networkFee.textContent = `${NumberFormatting.formatNumber(BitcoinUtils.satoshisToCoins(networkFee))} BTC`;
        } else {
            /** @type {HTMLElement} */
            const $networkFeeInfo = ($tooltip.querySelector('.network-fee-info'));
            $networkFeeInfo.remove();
        }

        /** @type {HTMLElement} */
        const $rateInfo = ($tooltip.querySelector('.rate-info'));
        const updateRateComparison = this._updateRateComparison.bind(this, effectiveRate, $tooltip, $rateInfo);
        updateRateComparison();
        window.setInterval(updateRateComparison, PaymentInfoLine.REFERENCE_RATE_UPDATE_INTERVAL);
        I18n.observer.on(I18n.Events.LANGUAGE_CHANGED, updateRateComparison);

        $container.appendChild($tooltip);
    }
}
