/**
 * @typedef {Error & { code?: string }} CustomError
 */


class KeyNotFoundError extends Error {
    constructor() {
        super(`Key not found`);
        this.code = 'K1';
    }
}

class InvalidAddressError extends Error {
    constructor() {
        super(`Invalid address`);
        this.code = 'K2';
    }
}

class AmountTooSmallError extends Error {
    constructor() {
       super('Amount is too small');
       this.code = 'K3';
    }
}

class NetworkMissmatchError extends Error {

    /** @param {string} transactionNetwork
     *  @param {string} keyguardNetwork
     */
    constructor(transactionNetwork, keyguardNetwork) {
       super(`Network missmatch: ${transactionNetwork} in transaction, but ${keyguardNetwork} in Keyguard`);
       this.code = 'K3';
    }
}
