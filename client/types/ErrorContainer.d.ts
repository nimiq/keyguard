import { KeyguardRequest } from '../src/KeyguardRequest';

interface Window {
    __keyguardErrorContainer: {
        ErrorConstants: KeyguardRequest.KeyguardError,
    };
}
