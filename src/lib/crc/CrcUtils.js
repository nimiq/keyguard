/* global CrcConstants */

class CrcUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {number} coins CRC amount in decimal
     * @returns {number} Number of CRC cents
     */
    static coinsToCents(coins) {
        return Math.round(coins * CrcConstants.CENTS_PER_COIN);
    }

    /**
     * @param {number} cents Number of CRC cents
     * @returns {number} CRC count in decimal
     */
    static centsToCoins(cents) {
        return cents / CrcConstants.CENTS_PER_COIN;
    }
}
