
const errorContainer: { Errors?: KeyguardRequest.KeyguardErrors } = { };

import '../../src/lib/Errors.js'; // tslint:disable-line no-var-requires variable-name

export class TestMich {
    public static Type = errorContainer.Errors!.Types; // tslint:disable-line variable-name
}
