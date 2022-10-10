/* global Nimiq */
/* global LoginFileConfig */
/* global IqonHash */
/* global BitcoinUtils */

class BalanceDistributionBar { // eslint-disable-line no-unused-vars
    /**
     * @param {{
     *  nimiqAddresses: { address: string, balance: number }[],
     *  bitcoinAccount: { balance: number },
     *  swapNimAddress: string,
     *  nimFiatRate: number,
     *  btcFiatRate: number,
     *  newNimBalance: number,
     *  newBtcBalanceFiat: number,
     * }} settings
     * @param {HTMLDivElement} [$el]
     */
    constructor(settings, $el) {
        this.$el = BalanceDistributionBar._createElement($el);

        const {
            nimiqAddresses,
            bitcoinAccount,
            swapNimAddress,
            nimFiatRate,
            btcFiatRate,
            newNimBalance,
            newBtcBalanceFiat,
        } = settings;

        const nimDistributionData = nimiqAddresses.map(addressInfo => {
            const active = swapNimAddress === addressInfo.address;
            const backgroundClass = LoginFileConfig[IqonHash.getBackgroundColorIndex(addressInfo.address)]
                .className;
            const oldBalance = Nimiq.Policy.lunasToCoins(addressInfo.balance) * nimFiatRate;
            const newBalance = active
                ? Nimiq.Policy.lunasToCoins(newNimBalance) * nimFiatRate
                : oldBalance;

            return {
                oldBalance,
                newBalance,
                backgroundClass,
                active,
            };
        });

        const btcDistributionData = {
            oldBalance: BitcoinUtils.satoshisToCoins(bitcoinAccount.balance) * btcFiatRate,
            newBalance: newBtcBalanceFiat,
            backgroundClass: 'bitcoin',
            active: true,
        };

        const totalBalance = nimDistributionData.reduce((sum, data) => sum + data.newBalance, 0)
            + btcDistributionData.newBalance;

        const $bars = document.createDocumentFragment();
        for (const data of nimDistributionData) {
            $bars.appendChild(this._createBar(data, totalBalance));
        }
        const $separator = document.createElement('div');
        $separator.classList.add('separator');
        $bars.appendChild($separator);
        $bars.appendChild(this._createBar(btcDistributionData, totalBalance));

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
