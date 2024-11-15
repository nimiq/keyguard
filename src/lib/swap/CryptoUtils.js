/* global Constants */
/* global lunasToCoins */
/* global BitcoinConstants */
/* global BitcoinUtils */
/* global PolygonConstants */
/* global PolygonUtils */
/* global EuroConstants */
/* global EuroUtils */

class CryptoUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {'NIM' | 'BTC' | 'USDC_MATIC' | 'USDT_MATIC' | 'EUR'} asset
     * @param {number} units
     * @returns {number}
     */
    static unitsToCoins(asset, units) {
        switch (asset) {
            case 'NIM': return lunasToCoins(units);
            case 'BTC': return BitcoinUtils.satoshisToCoins(units);
            case 'USDC_MATIC': return PolygonUtils.unitsToCoins(units);
            case 'USDT_MATIC': return PolygonUtils.unitsToCoins(units);
            case 'EUR': return EuroUtils.centsToCoins(units);
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }

    /**
     * @param {'NIM' | 'BTC' | 'USDC_MATIC' | 'USDT_MATIC' | 'EUR'} asset
     * @returns {number}
     */
    static assetDecimals(asset) {
        switch (asset) {
            case 'NIM': return Math.log10(Constants.LUNAS_PER_COIN);
            case 'BTC': return Math.log10(BitcoinConstants.SATOSHIS_PER_COIN);
            case 'USDC_MATIC': return Math.log10(PolygonConstants.UNITS_PER_COIN);
            case 'USDT_MATIC': return Math.log10(PolygonConstants.UNITS_PER_COIN);
            case 'EUR': return Math.log10(EuroConstants.CENTS_PER_COIN);
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }

    /**
     * @param {'NIM' | 'BTC' | 'USDC_MATIC' | 'USDT_MATIC' | 'EUR'} asset
     * @returns {'nim' | 'btc' | 'usdc' | 'usdt' | 'eur'}
     */
    static assetToCurrency(asset) {
        switch (asset) {
            case 'NIM': return 'nim';
            case 'BTC': return 'btc';
            case 'USDC_MATIC': return 'usdc';
            case 'USDT_MATIC': return 'usdt';
            case 'EUR': return 'eur';
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }
}
