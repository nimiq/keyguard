/* global PaymentInfoLine */
/* global NumberFormatting */
/* global BitcoinUtils */

/** @typedef {{
 *      recipient: string,
 *      label?: string,
 *      imageUrl?: URL,
 *      satoshiAmount: number,
 *      fiatAmount?: number,
 *      fiatCurrency?: string,
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
        const btcAmount = NumberFormatting.formatNumber(BitcoinUtils.satoshisToCoins(paymentInfo.satoshiAmount), 8);
        $nimAmount.textContent = `${btcAmount} BTC`;
    }
}
