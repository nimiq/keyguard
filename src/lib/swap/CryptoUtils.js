/* global Nimiq */
/* global BitcoinConstants */
/* global BitcoinUtils */
/* global PolygonConstants */
/* global PolygonUtils */
/* global EuroConstants */
/* global EuroUtils */
/* global CrcConstants */
/* global CrcUtils */

class CryptoUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {'NIM' | 'BTC' | 'USDC_MATIC' | 'EUR' | 'CRC'} asset
     * @param {number} units
     * @returns {number}
     */
    static unitsToCoins(asset, units) {
        switch (asset) {
            case 'NIM': return Nimiq.Policy.lunasToCoins(units);
            case 'BTC': return BitcoinUtils.satoshisToCoins(units);
            case 'USDC_MATIC': return PolygonUtils.unitsToCoins(units);
            case 'EUR': return EuroUtils.centsToCoins(units);
            case 'CRC': return CrcUtils.centsToCoins(units);
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }

    /**
     * @param {'NIM' | 'BTC' | 'USDC_MATIC' | 'EUR' | 'CRC'} asset
     * @returns {number}
     */
    static assetDecimals(asset) {
        switch (asset) {
            case 'NIM': return Math.log10(Nimiq.Policy.LUNAS_PER_COIN);
            case 'BTC': return Math.log10(BitcoinConstants.SATOSHIS_PER_COIN);
            case 'USDC_MATIC': return Math.log10(PolygonConstants.UNITS_PER_COIN);
            case 'EUR': return Math.log10(EuroConstants.CENTS_PER_COIN);
            case 'CRC': return Math.log10(CrcConstants.CENTS_PER_COIN);
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }

    /**
     * @param {'NIM' | 'BTC' | 'USDC_MATIC' | 'EUR' | 'CRC'} asset
     * @returns {'nim' | 'btc' | 'usdc' | 'eur' | 'crc'}
     */
    static assetToCurrency(asset) {
        switch (asset) {
            case 'NIM': return 'nim';
            case 'BTC': return 'btc';
            case 'USDC_MATIC': return 'usdc';
            case 'EUR': return 'eur';
            case 'CRC': return 'crc';
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }
}
