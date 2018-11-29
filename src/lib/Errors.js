class Errors { }

Errors.Types = {
    INVALID_REQUEST: 'InvalidRequest', // these are used for request parsing errors.
    CORE: 'Core', // these are coming from core
    KEYGUARD: 'Keyguard', // these are used for internal keyguard Errors.
};

Errors.InvalidRequest = class extends Error {
    /** @param { string } message */
    constructor(message = '') {
        super(message);
        this.name = Errors.Types.INVALID_REQUEST;
    }
};

Errors.Core = class extends Error {
    /** @param {string} message */
    constructor(message = '') {
        super(message);
        this.name = Errors.Types.CORE;
    }
};

Errors.Keyguard = class extends Error {
    /** @param {string} message */
    constructor(message = '') {
        super(message);
        this.name = Errors.Types.KEYGUARD;
    }
};

Errors.Cancel = class extends Error {
    /** @param {string} message - will be ignored and set to 'CANCEL' */
    constructor(message = '') { // eslint-disable-line no-unused-vars
        super('CANCEL');
        this.name = Errors.Types.KEYGUARD;
    }
};

Errors.Reject = class extends Error {
    /** @param {string} message - will be ignored and set to 'REJECT' */
    constructor(message = '') { // eslint-disable-line no-unused-vars
        super('REJECT');
        this.name = Errors.Types.KEYGUARD;
    }
};

Errors.ToCreate = class extends Error {
    /** @param {string} message - will be ignored and set to 'GOTO_CREATE' */
    constructor(message = '') { // eslint-disable-line no-unused-vars
        super('GOTO_CREATE');
        this.name = Errors.Types.KEYGUARD;
    }
};
