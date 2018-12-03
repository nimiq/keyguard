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

Errors.KeyIdNotFound = class extends Errors.Keyguard {
    constructor() {
        super(ErrorConstants.Messages.KEY_ID_NOT_FOUND);
    }
};

Errors.Cancel = class extends Errors.Keyguard {
    constructor() {
        super(ErrorConstants.Messages.CANCEL);
    }
};

Errors.GoToCreate = class extends Errors.Keyguard {
    constructor() {
        super(ErrorConstants.Messages.GOTO_CREATE);
    }
};
