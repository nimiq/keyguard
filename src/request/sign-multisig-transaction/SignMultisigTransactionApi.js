/* global Nimiq */
/* global TopLevelApi */
/* global SignMultisigTransaction */
/* global Errors */
/* global MultisigSigningState */

/** @extends {TopLevelApi<KeyguardRequest.SignMultisigTransactionRequest>} */
class SignMultisigTransactionApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignMultisigTransactionRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignMultisigTransactionRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignMultisigTransactionRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = /** @type {string} */ (this.parseLabel(request.keyLabel, false, 'keyLabel'));
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.senderLabel = /** @type {string} */ (this.parseLabel(request.senderLabel, false, 'senderLabel'));
        parsedRequest.transaction = this.parseTransaction(request);
        parsedRequest.multisigConfig = this.parseMultisigConfig(request.multisigConfig);
        parsedRequest.multisigAddress = this.parseMultisigAddress(
            parsedRequest.transaction,
            parsedRequest.multisigConfig.publicKeys,
            parsedRequest.multisigConfig.signers.length,
        );
        parsedRequest.layout = this.parseLayout(request.layout);

        if ((!request.layout || request.layout === SignMultisigTransactionApi.Layouts.STANDARD)
            && parsedRequest.layout === SignMultisigTransactionApi.Layouts.STANDARD) {
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        } // else if (request.layout === SignMultisigTransactionApi.Layouts.CHECKOUT
        //     && parsedRequest.layout === SignMultisigTransactionApi.Layouts.CHECKOUT) {
        //     parsedRequest.shopOrigin = this.parseShopOrigin(request.shopOrigin);
        //     parsedRequest.shopLogoUrl = this.parseLogoUrl(request.shopLogoUrl, true, 'shopLogoUrl);
        //     if (parsedRequest.shopLogoUrl && parsedRequest.shopLogoUrl.origin !== parsedRequest.shopOrigin) {
        //         throw new Errors.InvalidRequestError('origin of shopLogoUrl must be same as shopOrigin');
        //     }

        //     parsedRequest.fiatAmount = this.parseNonNegativeFiniteNumber(request.fiatAmount);
        //     parsedRequest.fiatCurrency = this.parseFiatCurrency(request.fiatCurrency);
        //     if ((parsedRequest.fiatAmount === undefined) !== (parsedRequest.fiatCurrency === undefined)) {
        //         throw new Errors.InvalidRequestError(
        //             'fiatAmount and fiatCurrency must be both defined or undefined.',
        //         );
        //     }

        //     parsedRequest.vendorMarkup = this.parseVendorMarkup(request.vendorMarkup);

        //     parsedRequest.time = this.parseNonNegativeFiniteNumber(request.time);
        //     parsedRequest.expires = this.parseNonNegativeFiniteNumber(request.expires);
        //     if (parsedRequest.expires !== undefined) {
        //         if (parsedRequest.time === undefined) {
        //             throw new Errors.InvalidRequestError('If `expires` is given, `time` must be given too.');
        //         } else if (parsedRequest.time >= parsedRequest.expires) {
        //             throw new Errors.InvalidRequestError('`expires` must be greater than `time`');
        //         }
        //     }
        // } else if (request.layout === SignMultisigTransactionApi.Layouts.CASHLINK
        //     && parsedRequest.layout === SignMultisigTransactionApi.Layouts.CASHLINK
        //     && request.cashlinkMessage) {
        //     parsedRequest.cashlinkMessage = /** @type {string} */(this.parseMessage(request.cashlinkMessage));
        // }

        return parsedRequest;
    }

    /**
     * @param {any} object
     * @returns {MultisigConfig}
     */
    parseMultisigConfig(object) {
        if (!object || typeof object !== 'object') {
            throw new Errors.InvalidRequestError('multisigConfig must be an object');
        }

        const publicKeys = this.parseMultisigPublicKeys(object.publicKeys);

        /** @type {MultisigConfig['signers']} */
        const signers = [];
        try {
            if (!('signers' in object)) throw new Error('missing');
            if (!Array.isArray(object.signers)) throw new Error('not an array');
            for (const obj of object.signers) {
                if (!obj || typeof obj !== 'object') throw new Error('not objects');

                if (!('publicKey' in obj)) throw new Error('missing publicKey');
                if (!(obj.publicKey instanceof Uint8Array)) throw new Error('publicKey not a Uint8Array');
                const signerPublicKey = new Nimiq.PublicKey(obj.publicKey);
                // Verify key is included in publicKeys as well
                if (!publicKeys.find(publicKey => publicKey.equals(signerPublicKey))) {
                    throw new Error('not in public keys');
                }
                if (signers.find(signer => signer.publicKey.equals(signerPublicKey))) {
                    throw new Error('duplicate signer');
                }

                if (!('commitments' in obj)) throw new Error('missing commitments');
                if (!Array.isArray(obj.commitments)
                    || obj.commitments.length !== MultisigSigningState.NUMBER_OF_COMMITMENTS) {
                    // Musig2 used in Nimiq PoS mandates exactly 2 commitments per signer (MUSIG2_PARAMETER_V).
                    throw new Error(
                        `commitments must be an array of ${MultisigSigningState.NUMBER_OF_COMMITMENTS} elements`,
                    );
                }
                /** @type {Nimiq.Commitment[]} */
                const signerCommitments = [];
                for (const commitment of obj.commitments) {
                    if (!(commitment instanceof Uint8Array)) throw new Error('commitment must be a Uint8Array');
                    signerCommitments.push(new Nimiq.Commitment(commitment));
                }

                signers.push({
                    publicKey: signerPublicKey,
                    commitments: signerCommitments,
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Errors.InvalidRequestError(`Invalid signers: ${errorMessage}`);
        }

        if ('secrets' in object) {
            // Commitment secrets provided by the caller are not accepted anymore, as they can't be verified. The
            // Keyguard derives the secrets itself, from the state returned by the create-multisig-commitments request.
            throw new Errors.InvalidRequestError(
                'secrets are not supported anymore, use the state from a create-multisig-commitments request',
            );
        }

        /** @type {MultisigSigningState} */
        let state;
        try {
            state = MultisigSigningState.deserialize(object.state);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Errors.InvalidRequestError(`Invalid state: ${errorMessage}`);
        }

        const userName = this.parseLabel(object.userName, true, 'userName');

        return {
            publicKeys,
            signers,
            state,
            userName,
        };
    }

    /**
     * Checks that the given layout is valid
     * @param {unknown} layout
     * @returns {KeyguardRequest.SignMultisigTransactionRequestLayout}
     */
    parseLayout(layout) {
        if (!layout) {
            return SignMultisigTransactionApi.Layouts.STANDARD;
        }
        if (!Object.values(SignMultisigTransactionApi.Layouts).includes(/** @type {any} */ (layout))) {
            throw new Errors.InvalidRequestError('Invalid selected layout');
        }
        return /** @type KeyguardRequest.SignMultisigTransactionRequestLayout */ (layout);
    }

    get Handler() {
        return SignMultisigTransaction;
    }

    // /**
    //  * @param {Parsed<KeyguardRequest.SignMultisigTransactionRequest>} parsedRequest
    //  */
    // async onBeforeRun(parsedRequest) {
    //     if (parsedRequest.layout === SignMultisigTransactionApi.Layouts.CHECKOUT) {
    //         this.enableGlobalCloseButton(I18n.translatePhrase('sign-tx-cancel-payment'));
    //     }
    // }
}

/**
 * @enum {KeyguardRequest.SignMultisigTransactionRequestLayout}
 */
SignMultisigTransactionApi.Layouts = Object.freeze({
    STANDARD: /** @type {'standard'} */ ('standard'),
    // CHECKOUT: /** @type {'checkout'} */ ('checkout'),
    // CASHLINK: /** @type {'cashlink'} */ ('cashlink'),
});
