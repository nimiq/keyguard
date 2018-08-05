/* global ConfirmRemoval */
/* global KeyStore */
/* global PopupApi */
/* global RemovalWarning */

class RemoveKeyApi extends PopupApi {
    /**
     * @param {RemoveKeyRequest} request
     */
    async onRequest(request) {
        console.log(request);
        const parsedRequest = await RemoveKeyApi._parseRequest(request);

        /** @type {HTMLElement} */
        this.$removalWarning = (document.getElementById(RemoveKeyApi.Pages.REMOVAL_WARNING));
        /** @type {HTMLElement} */
        this.$confirmRemoval = (document.getElementById(RemoveKeyApi.Pages.CONFIRM_REMOVAL));

        this._removalWarning = new RemovalWarning(this.$removalWarning, parsedRequest);
        this._confirmRemoval = new ConfirmRemoval(this.$confirmRemoval, parsedRequest);

        this._removalWarning.on(RemovalWarning.Events.CONTINUE, () => {
            window.location.hash = RemoveKeyApi.Pages.CONFIRM_REMOVAL;
        });

        this._removalWarning.on(RemovalWarning.Events.CANCEL, () => {
            document.body.classList.add('loading');
            this.resolve(false);
        });

        this._confirmRemoval.on(ConfirmRemoval.Events.REMOVE, async () => {
            await KeyStore.instance.remove(parsedRequest.keyId);
            document.body.classList.add('loading');
            this.resolve(true);
        });

        this._confirmRemoval.on(ConfirmRemoval.Events.CANCEL, () => {
            document.body.classList.add('loading');
            this.resolve(false);
        });

        window.location.hash = RemoveKeyApi.Pages.REMOVAL_WARNING;
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

    /**
     * @param {HTMLElement} $text
     * @param {RemoveKeyRequest} request
     */
    static get_friendly_key_description($text, request) {
        const userFriendlyId = Key.idToUserFriendlyId(request.keyId);

        /** @type {HTMLElement} */
        if (request.keyLabel !== undefined) {
            $text.textContent = request.keyLabel + ' (' + userFriendlyId + ') ';
        } else {
            $text.textContent = userFriendlyId;
        }
    }
}

RemoveKeyApi.Pages = {
    REMOVAL_WARNING: 'removal-warning',
    CONFIRM_REMOVAL: 'confirm-removal',
};
