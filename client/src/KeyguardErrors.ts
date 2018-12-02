const errorContainer: { Errors?: KeyguardRequest.KeyguardErrors } = { };

/*export enum KeyguardErrorTypes {
    INVALID_REQUEST = 'InvalidRequest', // these are used for request parsing errors.
    CORE = 'Core', // these are coming from core
    KEYGUARD = 'Keyguard', // these are used for internal keyguard Errors.
    UNCLASSIFIED = 'Unclassified',
}

export enum KeyguardErrorMessages {
    GOTO_CREATE =  'GOTO_CREATE',
    CANCEL = 'CANCEL',
    KEY_ID_NOT_FOUND = 'keyId not found',
}*/

import '../../src/lib/Errors.js';

export const KeyguardErrorTypes = errorContainer.Errors!.Types;
