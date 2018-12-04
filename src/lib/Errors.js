/* global ErrorConstants */

class Errors { }

Errors.InvalidRequestError = class extends Error {
    /** @param { string } message */
    constructor(message = '') {
        super(message);
        this.name = ErrorConstants.Types.INVALID_REQUEST;
    }
};

Errors.CoreError = class extends Error {
    /** @param {string} message */
    constructor(message = '') {
        super(message);
        this.name = ErrorConstants.Types.CORE;
    }
};

Errors.KeyguardError = class extends Error {
    /** @param {string} message */
    constructor(message = '') {
        super(message);
        this.name = ErrorConstants.Types.KEYGUARD;
    }
};

Errors.KeyNotFoundError = class extends Errors.KeyguardError {
    constructor() {
        super(ErrorConstants.Messages.KEY_NOT_FOUND);
    }
};

Errors.RequestCanceled = class extends Errors.KeyguardError {
    constructor() {
        super(ErrorConstants.Messages.CANCELED);
    }
};

Errors.GoToCreate = class extends Errors.KeyguardError {
    constructor() {
        super(ErrorConstants.Messages.GOTO_CREATE);
    }
};
