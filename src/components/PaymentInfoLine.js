/* global Nimiq */
/* global AddressInfo */
/* global Timer */
/* global TemplateTags */
/* global NumberFormatting */

/** @typedef {{
 *      recipient: string,
 *      label?: string,
 *      imageUrl?: URL,
 *      lunaAmount: number,
 *      fiatAmount?: number,
 *      fiatCurrency?: string,
 *      time?: number,
 *      expires?: number
 *  }} PaymentInfo */

class PaymentInfoLine { // eslint-disable-line no-unused-vars
    /**
     * @param {PaymentInfo} paymentInfo
     * @param {HTMLElement} [$el]
     */
    constructor(paymentInfo, $el) {
        this.$el = PaymentInfoLine._createElement($el);

        /** @type HTMLElement */
        const $nimAmount = (this.$el.querySelector('.nim-amount'));
        const nimAmount = NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(paymentInfo.lunaAmount));
        $nimAmount.textContent = `${nimAmount} NIM`;

        /** @type HTMLElement */
        const $fiatAmount = (this.$el.querySelector('.fiat-amount'));
        if (paymentInfo.fiatAmount && paymentInfo.fiatCurrency) {
            $fiatAmount.textContent = NumberFormatting.formatCurrency(paymentInfo.fiatAmount, paymentInfo.fiatCurrency);
        } else {
            $fiatAmount.remove();
        }

        const recipientInfo = new AddressInfo({
            userFriendlyAddress: paymentInfo.recipient,
            label: paymentInfo.label || null,
            imageUrl: paymentInfo.imageUrl || null,
            accountLabel: null,
        });
        recipientInfo.renderTo(/** @type HTMLElement */ (this.$el.querySelector('.recipient')));

        /** @type HTMLElement */
        const $timer = (this.$el.querySelector('.timer'));
        if (paymentInfo.time && paymentInfo.expires) {
            new Timer(paymentInfo.time, paymentInfo.expires, $timer); // eslint-disable-line no-new
        } else {
            $timer.remove();
        }
    }

    /**
     * @private
     * @param {HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = TemplateTags.noVars`
            <div class="amount">
                <div class="nim-amount"></div>
                <div class="fiat-amount"></div>
            </div>
            <div class="arrow-runway">
                <svg class="nq-icon">
                    <use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-arrow-right-small"/>
                </svg>
            </div>
            <div class="recipient"></div>
            <div class="timer"></div>
        `;

        return $el;
    }
}
