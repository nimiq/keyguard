/**
 * @typedef {Error & { code: number }} CustomError
 */


class KeyNotFoundError extends Error {

    constructor() {
        super(`Key not found`);

        this.code = 'K1';
    }
}

