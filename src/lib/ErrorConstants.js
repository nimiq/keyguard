/** @type KeyguardRequest.KeyguardError */
const ErrorConstants = {
    Types: {
        // used for request parsing errors.
        INVALID_REQUEST: 'InvalidRequest',
        // used for errors thrown from core methods
        CORE: 'Core',
        // used for internal keyguard Errors.
        KEYGUARD: 'Keyguard',
        // used for the remaining Errors which are not assigned an own type just yet.
        UNCLASSIFIED: 'Unclassified',
    },
    Messages: {
        // specifically used to trigger a redirect to create after returning to caller
        GOTO_CREATE: 'GOTO_CREATE',
        // used to signal a user initiated cancelation of the request
        CANCEL: 'CANCEL',
        // used to signal that a given keyId no longer exist in KG, to be treated by caller.
        KEY_ID_NOT_FOUND: 'keyId not found',
    },
};

// 'export' to client via side effects
window.errorContainer = {
    ErrorConstants,
};
