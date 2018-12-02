/* global ErrorConstants */

class Errors { }

Errors.InvalidRequest = class extends Error {
    /** @param { string } message */
    constructor(message = '') {
        super(message);
        this.name = ErrorConstants.Types.INVALID_REQUEST;
    }
};

Errors.Core = class extends Error {
    /** @param {string} message */
    constructor(message = '') {
        super(message);
        this.name = ErrorConstants.Types.CORE;
    }
};

Errors.Keyguard = class extends Error {
    /** @param {string} message */
    constructor(message = '') {
        super(message);
        this.name = ErrorConstants.Types.KEYGUARD;
    }
};

Errors.KeyIdNotFound = class extends Error {
    /** @param {string} message - will be ignored and set to ErrorConstants.Messages.KEY_ID_NOT_FOUND */
    constructor(message = '') { // eslint-disable-line no-unused-vars
        super(ErrorConstants.Messages.KEY_ID_NOT_FOUND);
        this.name = ErrorConstants.Types.KEYGUARD;
    }
};

Errors.Cancel = class extends Error {
    /** @param {string} message - will be ignored and set to ErrorConstants.Messages.CANCEL */
    constructor(message = '') { // eslint-disable-line no-unused-vars
        super(ErrorConstants.Messages.CANCEL);
        this.name = ErrorConstants.Types.KEYGUARD;
    }
};

Errors.GoToCreate = class extends Error {
    /** @param {string} message - will be ignored and set to ErrorConstants.Messages.GOTO_CREATE */
    constructor(message = '') { // eslint-disable-line no-unused-vars
        super(ErrorConstants.Messages.GOTO_CREATE);
        this.name = ErrorConstants.Types.KEYGUARD;
    }
};
