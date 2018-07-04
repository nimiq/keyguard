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

