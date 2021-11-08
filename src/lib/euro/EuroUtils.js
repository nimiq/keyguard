/* global EuroConstants */

class EuroUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {number} coins Euro amount in decimal
     * @returns {number} Number of Eurocents
     */
    static coinsToCents(coins) {
        return Math.round(coins * EuroConstants.CENTS_PER_COIN);
    }

    /**
     * @param {number} cents Number of Eurocents
     * @returns {number} Euro count in decimal
     */
    static centsToCoins(cents) {
        return cents / EuroConstants.CENTS_PER_COIN;
    }
}
