/** @type KeyguardRequest.KeyguardError */
const ErrorConstants = {
    Types: {
        INVALID_REQUEST: 'InvalidRequest', // these are used for request parsing errors.
        CORE: 'Core', // these are coming from core
        KEYGUARD: 'Keyguard', // these are used for internal keyguard Errors.
        UNCLASSIFIED: 'Unclassified',
    },
    Messages: {
        GOTO_CREATE: 'GOTO_CREATE',
        CANCEL: 'CANCEL',
        KEY_ID_NOT_FOUND: 'keyId not found',
    },
};

// 'export' to client via side effects
window.errorContainer = {
    ErrorConstants,
};
