/* global Key */
/* global KeyStore */
/* global Nimiq */
/* global PassphraseInput */
/* global PopupApi */
class RemoveKeyApi extends PopupApi { // eslint-disable-line no-unused-vars
    /**
     * @param {RemoveKeyRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await RemoveKeyApi._parseRequest(request);

        const $cancel = /** @type {HTMLElement} */ (document.querySelector('.cancel'));
        const $remove = /** @type {HTMLButtonElement} */ (document.querySelector('.remove'));
        $remove.disabled = true;
        const $passphrase = /** @type {HTMLElement} */ (document.querySelector('.passphrase'));

        // Set user friendly key description
        const $keyLabelFriendlyId = /** @type {HTMLElement} */ (document.querySelector('.key-label-friendlyid'));
        const userFriendlyId = Key.idToUserFriendlyId(request.keyId);
        $keyLabelFriendlyId.textContent = request.keyLabel ? `${request.keyLabel} (${userFriendlyId})` : userFriendlyId;

        const passphraseInput = new PassphraseInput($passphrase);

        $cancel.addEventListener('click', () => {
            document.body.classList.add('loading');
            this.resolve(false);
        });
        $remove.addEventListener('click', async () => {
            try {
                const passphrase = Nimiq.BufferUtils.fromAscii(passphraseInput.text);
                await KeyStore.instance.get(request.keyId, passphrase);

                await KeyStore.instance.remove(parsedRequest.keyId);
                document.body.classList.add('loading');
                this.resolve(true);
            } catch (e) {
                passphraseInput.onPassphraseIncorrect();
            }
        });
        passphraseInput.on(PassphraseInput.Events.VALID, /** @param {boolean} isValid */ isValid => {
            $remove.disabled = !isValid;
        });
        window.location.hash = 'remove-key';
    }

    /**
     * @param {RemoveKeyRequest} request
     * @returns {Promise<RemoveKeyRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Validate labels.
        if (request.keyLabel !== undefined && (typeof request.keyLabel !== 'string' || request.keyLabel.length > 64)) {
            throw new Error('Invalid label');
        }

        return request;
    }
}
