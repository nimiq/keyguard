/* global LoginFileConfig */
/* global IqonHash */
/* global CryptoUtils */

/** @typedef {{address: string, balance: number, active: boolean, newBalance: number}} Segment */
/** @typedef {'NIM' | 'BTC' | 'USDC_MATIC' | 'EUR'} Asset */

class BalanceDistributionBar { // eslint-disable-line no-unused-vars
    /**
     * @param {{
     *  leftAsset: Asset,
     *  rightAsset: Asset,
     *  leftSegments: Segment[],
     *  rightSegments: Segment[],
     *  leftFiatRate: number,
     *  rightFiatRate: number,
     * }} settings
     * @param {HTMLDivElement} [$el]
     */
    constructor(settings, $el) {
        this.$el = BalanceDistributionBar._createElement($el);

        const {
            leftAsset,
            rightAsset,
            leftSegments,
            rightSegments,
            leftFiatRate,
            rightFiatRate,
        } = settings;

        const leftDistributionData = leftSegments.map(segment => ({
            oldBalance: CryptoUtils.unitsToCoins(leftAsset, segment.balance) * leftFiatRate,
            newBalance: CryptoUtils.unitsToCoins(leftAsset, segment.newBalance) * leftFiatRate,
            backgroundClass: leftAsset === 'NIM'
                ? LoginFileConfig[IqonHash.getBackgroundColorIndex(segment.address)].className
                : CryptoUtils.assetToCurrency(leftAsset),
            active: segment.active,
        }));

        const rightDistributionData = rightSegments.map(segment => ({
            oldBalance: CryptoUtils.unitsToCoins(rightAsset, segment.balance) * rightFiatRate,
            newBalance: CryptoUtils.unitsToCoins(rightAsset, segment.newBalance) * rightFiatRate,
            backgroundClass: rightAsset === 'NIM'
                ? LoginFileConfig[IqonHash.getBackgroundColorIndex(segment.address)].className
                : CryptoUtils.assetToCurrency(rightAsset),
            active: segment.active,
        }));

        const totalBalance = [...leftDistributionData, ...rightDistributionData].reduce(
            (sum, data) => sum + data.newBalance,
            0,
        );

        const $bars = document.createDocumentFragment();
        for (const data of leftDistributionData) {
            $bars.appendChild(this._createBar(data, totalBalance));
        }
        const $separator = document.createElement('div');
        $separator.classList.add('separator');
        $bars.appendChild($separator);
        for (const data of rightDistributionData) {
            $bars.appendChild(this._createBar(data, totalBalance));
        }

        this.$el.appendChild($bars);
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        $element.classList.add('balance-distribution-bar');
        return $element;
    }

    /**
     * @param {{oldBalance: number, newBalance: number, backgroundClass: string, active: boolean}} data
     * @param {number} totalBalance
     * @returns {HTMLDivElement}
     */
    _createBar(data, totalBalance) { // eslint-disable-line no-inner-declarations
        const $bar = document.createElement('div');
        $bar.classList.add('bar', data.backgroundClass);
        $bar.classList.toggle('active', data.active);
        $bar.style.width = `${data.newBalance / totalBalance * 100}%`;
        if (data.active && data.newBalance > data.oldBalance) {
            const $change = document.createElement('div');
            $change.classList.add('change');
            $change.style.width = `${(data.newBalance - data.oldBalance) / data.newBalance * 100}%`;
            $bar.appendChild($change);
        }
        return $bar;
    }
}
