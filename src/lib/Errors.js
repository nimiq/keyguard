/* global ErrorConstants */

class Errors { }

Errors.BaseError = class extends Error {
    /**
     *  @param {string} type
     *  @param {string|Error?} messageOrError
     */
    constructor(type, messageOrError = null) {
        if (messageOrError instanceof Error) {
            const error = messageOrError;
            super(error.message);
            if (error.name === 'Error') {
                this.name = type;
            } else {
                this.name = error.name;
            }
            if (error.stack) {
                this.stack = error.stack;
            }
        } else {
            const message = messageOrError;
            super(message || '');
            this.name = type;
        }
    }
};

Errors.InvalidRequestError = class extends Errors.BaseError {
    /**
     *  @param {string} [message]
     */
    constructor(message = '') {
        super(ErrorConstants.Types.INVALID_REQUEST, message);
    }
};

Errors.CoreError = class extends Errors.BaseError {
    /**
     *  @param {string|Error} [messageOrError]
     */
    constructor(messageOrError) {
        super(ErrorConstants.Types.CORE, messageOrError);
    }
};

Errors.KeyguardError = class extends Errors.BaseError {
    /**
     *  @param {string|Error} [messageOrError]
     */
    constructor(messageOrError) {
        super(ErrorConstants.Types.KEYGUARD, messageOrError);
    }
};

Errors.UnclassifiedError = class extends Errors.BaseError {
    /**
     *  @param {string|Error} [messageOrError]
     * */
    constructor(messageOrError) {
        super(ErrorConstants.Types.UNCLASSIFIED, messageOrError);
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
