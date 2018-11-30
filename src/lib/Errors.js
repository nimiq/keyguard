class Errors { }

Errors.Types = {
    INVALID_REQUEST: 'InvalidRequest', // these are used for request parsing errors.
    CORE: 'Core', // these are coming from core
    KEYGUARD: 'Keyguard', // these are used for internal keyguard Errors.
};

Errors.Messages = {
    GOTO_CREATE: 'GOTO_CREATE',
    CANCEL: 'CANCEL',
}

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
    /** @param {string} message - will be ignored and set to Errors.Messages.CANCEL */
    constructor(message = '') { // eslint-disable-line no-unused-vars
        super(Errors.Messages.CANCEL);
        this.name = Errors.Types.KEYGUARD;
    }
};

Errors.GoToCreate = class extends Error {
    /** @param {string} message - will be ignored and set to Errors.Messages.GOTO_CREATE */
    constructor(message = '') { // eslint-disable-line no-unused-vars
        super(Errors.Messages.GOTO_CREATE);
        this.name = Errors.Types.KEYGUARD;
    }
};
