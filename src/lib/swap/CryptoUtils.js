/* global Constants */
/* global lunasToCoins */
/* global BitcoinConstants */
/* global BitcoinUtils */
/* global EuroConstants */
/* global EuroUtils */

class CryptoUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {'NIM' | 'BTC' | 'EUR'} asset
     * @param {number} units
     * @returns {number}
     */
    static unitsToCoins(asset, units) {
        switch (asset) {
            case 'NIM': return lunasToCoins(units);
            case 'BTC': return BitcoinUtils.satoshisToCoins(units);
            case 'EUR': return EuroUtils.centsToCoins(units);
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }

    /**
     * @param {'NIM' | 'BTC' | 'EUR'} asset
     * @returns {number}
     */
    static assetDecimals(asset) {
        switch (asset) {
            case 'NIM': return Math.log10(Constants.LUNAS_PER_COIN);
            case 'BTC': return Math.log10(BitcoinConstants.SATOSHIS_PER_COIN);
            case 'EUR': return Math.log10(EuroConstants.CENTS_PER_COIN);
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }

    /**
     * @param {'NIM' | 'BTC' | 'EUR'} asset
     * @returns {'nim' | 'btc' | 'eur'}
     */
    static assetToCurrency(asset) {
        switch (asset) {
            case 'NIM': return 'nim';
            case 'BTC': return 'btc';
            case 'EUR': return 'eur';
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }
}
