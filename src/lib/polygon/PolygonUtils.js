/* global PolygonConstants */

class PolygonUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {number} coins USDC coins in decimal
     * @returns {number} Number of Cents
     */
    static coinsToCents(coins) {
        return Math.round(coins * PolygonConstants.CENTS_PER_COINS);
    }

    /**
     * @param {number} cents Number of Cents.
     * @returns {number} USDC coins in decimal.
     */
    static centsToCoins(cents) {
        return cents / PolygonConstants.CENTS_PER_COINS;
    }
}
