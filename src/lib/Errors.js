/* global ErrorConstants */

class Errors { }

Errors.BaseError = class extends Error {
    /**
     *  @param {string} type
     *  @param {string} message
     *  @param {Error?} innerError
     * */
    constructor(type, message = '', innerError = null) {
        if (innerError) {
            super(innerError.message);
            if (innerError.name !== 'Error') {
                this.name = innerError.name;
            }
            if (innerError.stack) {
                this.stack = innerError.stack;
            }
        } else {
            super(message);
            this.name = type;
        }
    }
};

Errors.InvalidRequestError = class extends Errors.BaseError {
    /**
     *  @param {string} message
     *  @param {Error?} innerError
     * */
    constructor(message = '', innerError = null) {
        super(ErrorConstants.Types.INVALID_REQUEST, message, innerError);
    }
};

Errors.CoreError = class extends Errors.BaseError {
    /**
     *  @param {string} message
     *  @param {Error?} innerError
     * */
    constructor(message = '', innerError = null) {
        super(ErrorConstants.Types.CORE, message, innerError);
    }
};

Errors.KeyguardError = class extends Errors.BaseError {
    /**
     *  @param {string} message
     *  @param {Error?} innerError
     * */
    constructor(message = '', innerError = null) {
        super(ErrorConstants.Types.KEYGUARD, message, innerError);
    }
};

Errors.UnclassifiedError = class extends Errors.BaseError {
    /**
     *  @param {string} message
     *  @param {Error?} innerError
     * */
    constructor(message = '', innerError = null) {
        super(ErrorConstants.Types.UNCLASSIFIED, message, innerError);
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
