/* eslint-disable  no-unused-vars */

/**
 * @typedef {Error & { code?: string }} CustomError
 */

class KeyNotFoundError extends Error {
    constructor() {
        super('Key not found');
        this.code = 'K1';
    }
}

class InvalidAddressError extends Error {
    constructor() {
        super('Invalid address');
        this.code = 'K2 ';
    }
}

class TooManyAccountsSafariError extends Error {
    constructor() {
        super('Cannot store more then 10 accounts in Keyguard in Safari. Consider using another Browser.');

        this.code = 'K3';
    }
}

class TooManyAccountsIOSError extends Error {
    constructor() {
        super('Cannot store more then 10 accounts in Keyguard on this device.');

        this.code = 'K4';
    }
}

class AmountTooSmallError extends Error {
    constructor() {
        super('Amount is too small');
        this.code = 'K5';
    }
}

class NetworkMissmatchError extends Error {
    /** @param {string} transactionNetwork
     *  @param {string} keyguardNetwork
     */
    constructor(transactionNetwork, keyguardNetwork) {
        super(`Network missmatch: ${transactionNetwork} in transaction, but ${keyguardNetwork} in Keyguard`);
        this.code = 'K6';
    }
}

class InvalidDOMError extends Error {
    constructor() {
        super('Invalid DOM');
        this.code = 'K7';
    }
}
