/* global Nimiq */
/* global KeyStore */
/* global Key */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global MultisigSigningState */
/* global MultisigSessionStore */

/**
 * @callback CreateMultisigCommitments.resolve
 * @param {KeyguardRequest.MultisigCommitmentsResult} result
 */

class CreateMultisigCommitments {
    /**
     * @param {Parsed<KeyguardRequest.CreateMultisigCommitmentsRequest>} request
     * @param {CreateMultisigCommitments.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        const $page = /** @type {HTMLElement} */ (document.getElementById(CreateMultisigCommitments.Pages.UNLOCK));
        const $accountLabel = /** @type {HTMLElement} */ ($page.querySelector('.account-label'));
        $accountLabel.textContent = request.multisigConfig.userName
            ? `${request.multisigConfig.userName} – ${request.keyLabel}`
            : request.keyLabel;

        const $passwordBox = /** @type {HTMLFormElement} */ ($page.querySelector('.password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-continue',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });
        this._passwordBox.on(PasswordBox.Events.SUBMIT, /** @param {string|undefined} password */ password => {
            this._onPasswordEntered(password);
        });
    }

    /**
     * @param {string} [password]
     * @returns {Promise<void>}
     */
    async _onPasswordEntered(password) {
        TopLevelApi.setLoading(true);
        const passwordBuffer = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;

        /** @type {Key|null} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passwordBuffer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        const { publicKeys, numberOfSigners } = this._request.multisigConfig;
        const privateKey = key.derivePrivateKey(this._request.keyPath);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        if (!publicKeys.some(multisigPublicKey => multisigPublicKey.equals(publicKey))) {
            this._reject(new Errors.InvalidRequestError('Selected key is not part of the multisig'));
            return;
        }

        /** @type {Uint8Array} */
        let deviceId;
        try {
            deviceId = await MultisigSessionStore.instance.getDeviceId();
        } catch (error) {
            this._reject(new Errors.KeyguardError(`Cannot access signing session records: ${String(error)}`));
            return;
        }

        const state = MultisigSigningState.create(privateKey, {
            deviceId,
            transactionContent: this._request.transaction.serializeContent(),
            publicKeys,
            numberOfSigners,
        });
        const commitments = state.deriveCommitmentPairs(privateKey).map(pair => pair.commitment.serialize());

        /** @type {KeyguardRequest.MultisigCommitmentsResult} */
        const result = {
            publicKey: publicKey.serialize(),
            commitments,
            state: state.serialize(),
        };
        this._resolve(result);
    }

    run() {
        window.location.hash = CreateMultisigCommitments.Pages.UNLOCK;
    }
}

CreateMultisigCommitments.Pages = {
    UNLOCK: 'unlock',
};
