/* global Nimiq */
/* global TopLevelApi */
/* global SignMultisigTransaction */
/* global MultisigUtils */
/* global Errors */

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
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
        parsedRequest.transaction = this.parseTransaction(request);
        parsedRequest.multisig = this.parseMultisigConfig(request);
        parsedRequest.layout = this.parseLayout(request.layout);

        this.verifyMultisigAddress(parsedRequest.transaction, parsedRequest.multisig);

        if ((!request.layout || request.layout === SignMultisigTransactionApi.Layouts.STANDARD)
            && parsedRequest.layout === SignMultisigTransactionApi.Layouts.STANDARD) {
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        } // else if (request.layout === SignMultisigTransactionApi.Layouts.CHECKOUT
        //     && parsedRequest.layout === SignMultisigTransactionApi.Layouts.CHECKOUT) {
        //     parsedRequest.shopOrigin = this.parseShopOrigin(request.shopOrigin);
        //     parsedRequest.shopLogoUrl = this.parseShopLogoUrl(request.shopLogoUrl);
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
        if (!object || typeof object !== 'object' || object === null) {
            throw new Errors.InvalidRequestError('Request must be an object');
        }

        /** @type {Nimiq.PublicKey[]} */
        const publicKeys = [];
        try {
            if (!('publicKeys' in object)) throw new Error('missing');
            if (!Array.isArray(object.publicKeys)) throw new Error('not an array');
            for (const key of object.publicKeys) {
                if (!(key instanceof Uint8Array)) throw new Error('not an Uint8Array');
                publicKeys.push(new Nimiq.PublicKey(key));
            }
        } catch (error) {
            throw new Errors.InvalidRequestError(`Invalid public keys: ${(error).message}`);
        }

        const numberOfSigners = this.parsePositiveInteger(object.numberOfSigners, false, 'numberOfSigners');
        if (numberOfSigners > publicKeys.length) {
            throw new Errors.InvalidRequestError('Number of signers must be smaller or equal to number of public keys');
        }

        /** @type {Nimiq.PublicKey[]} */
        const signerPublicKeys = [];
        try {
            if (!('signerPublicKeys' in object)) throw new Error('missing');
            if (!Array.isArray(object.signerPublicKeys)) throw new Error('not an array');
            if (object.signerPublicKeys.length < numberOfSigners) throw new Error('missing keys');
            if (object.signerPublicKeys.length > numberOfSigners) throw new Error('too many keys');
            for (const key of object.signerPublicKeys) {
                if (!(key instanceof Uint8Array)) throw new Error('not an Uint8Array');
                const signerPublicKey = new Nimiq.PublicKey(key);
                // Verify key is included in publicKeys as well
                if (!publicKeys.find(publicKey => publicKey.equals(signerPublicKey))) {
                    throw new Errors.InvalidRequestError('not in public keys');
                }
                signerPublicKeys.push(signerPublicKey);
            }
        } catch (error) {
            throw new Errors.InvalidRequestError(`Invalid signer public keys: ${error.message}`);
        }

        /** @type {Nimiq.RandomSecret} */
        let secret;
        try {
            secret = new Nimiq.RandomSecret(object.secret);
        } catch (error) {
            throw new Errors.InvalidRequestError(`Invalid secret: ${error.message}`);
        }

        /** @type {Nimiq.RandomSecret} */
        let aggregatedCommitment;
        try {
            aggregatedCommitment = new Nimiq.Commitment(object.aggregatedCommitment);
        } catch (error) {
            throw new Errors.InvalidRequestError(
                `Invalid aggregated commitment: ${error.message}`,
            );
        }

        return {
            publicKeys,
            numberOfSigners,
            signerPublicKeys,
            secret,
            aggregatedCommitment,
        };
    }

    /**
     * @param {Nimiq.Transaction} transaction
     * @param {MultisigConfig} multisig
     */
    verifyMultisigAddress(transaction, multisig) {
        const multisigAddress = MultisigUtils.calculateAddress(
            multisig.publicKeys,
            multisig.numberOfSigners,
        );

        if (transaction.senderType === Nimiq.Account.Type.BASIC) {
            if (!transaction.sender.equals(multisigAddress)) {
                throw new Errors.InvalidRequestError(
                    'Transaction sender does not match calculated multisig address',
                );
            }
        } else if (transaction.recipientType === Nimiq.Account.Type.BASIC) {
            if (!transaction.recipient.equals(multisigAddress)) {
                throw new Errors.InvalidRequestError(
                    'Transaction recipient does not match calculated multisig address',
                );
            }
        } else {
            throw new Errors.InvalidRequestError(
                'The multisig account must either be the sender or the recipient of the transaction',
            );
        }
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
        // @ts-ignore (Property 'values' does not exist on type 'ObjectConstructor'.)
        if (Object.values(SignMultisigTransactionApi.Layouts).indexOf(layout) === -1) {
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
 * @readonly
 */
SignMultisigTransactionApi.Layouts = {
    STANDARD: /** @type {'standard'} */ ('standard'),
    // CHECKOUT: /** @type {'checkout'} */ ('checkout'),
    // CASHLINK: /** @type {'cashlink'} */ ('cashlink'),
};
