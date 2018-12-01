/* global Nimiq */
/* global KeyStore */
/* global I18n */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */
/* global Errors */
class SignTransactionApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignTransactionRequest} request
     */
    async onRequest(request) {
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        /** @type {HTMLSpanElement} */
        const $cancelLinkText = ($appName.parentNode);
        if (request.layout === 'checkout') {
            $cancelLinkText.textContent = I18n.translatePhrase('sign-tx-cancel-payment');
        } else {
            $appName.textContent = request.appName;
        }
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($cancelLinkText.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.Cancel()));

        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {KeyguardRequest.SignTransactionRequest} request
     * @returns {Promise<KeyguardRequest.ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequest('Empty request');
        }

        // Check that the layout is valid
        if (request.layout && !SignTransactionApi.Layouts[request.layout]) {
            throw new Errors.InvalidRequest('Invalid selected layout');
        }

        // Check that keyId is given.
        if (!request.keyId || typeof request.keyId !== 'string') {
            throw new Errors.InvalidRequest('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Errors.KeyIdNotFound();
        }

        // Check that keyPath is given.
        if (!request.keyPath || typeof request.keyPath !== 'string') {
            throw new Errors.InvalidRequest('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Errors.InvalidRequest('Invalid keyPath');
        }

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Errors.InvalidRequest('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Errors.InvalidRequest('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Errors.InvalidRequest('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Errors.InvalidRequest('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            layout: request.layout || 'standard',
            shopOrigin: request.shopOrigin,
            appName: request.appName,

            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {KeyguardRequest.SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = new Nimiq.Address(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = new Nimiq.Address(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = request.data || new Uint8Array(0);
        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}

/** @type {{[layout: string]: any, standard: typeof LayoutStandard, checkout: typeof LayoutCheckout}} */
SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
