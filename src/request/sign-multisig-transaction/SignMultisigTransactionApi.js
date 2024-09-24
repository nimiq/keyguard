/* global Nimiq */
/* global TopLevelApi */
/* global SignMultisigTransaction */
/* global MultisigUtils */
/* global Errors */
/* global CONFIG */

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
        parsedRequest.layout = this.parseLayout(request.layout);

        this.verifyMultisigAddress(parsedRequest.transaction, parsedRequest.multisigConfig);

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
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Errors.InvalidRequestError(`Invalid public keys: ${errorMessage}`);
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
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Errors.InvalidRequestError(`Invalid signer public keys: ${errorMessage}`);
        }

        /** @type {MultisigConfig['secret']} */
        let secret;
        if (typeof object.secret !== 'object') {
            throw new Errors.InvalidRequestError('Invalid secret: must be an object');
        }
        if ('aggregatedSecret' in object.secret) {
            try {
                secret = {
                    aggregatedSecret: new Nimiq.RandomSecret(object.secret.aggregatedSecret),
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Errors.InvalidRequestError(`Invalid secret: ${errorMessage}`);
            }
        } else if ('encryptedSecrets' in object.secret && 'bScalar' in object.secret) {
            // Not checking fixed length here, to stay flexible for future increases of the number of commitments
            if (!Array.isArray(object.secret.encryptedSecrets) || object.secret.encryptedSecrets.length < 2) {
                throw new Errors.InvalidRequestError(
                    'Invalid secret.encryptedSecrets: must be an array with at least 2 elements',
                );
            }
            // Validate encryptedSecrets are Uint8Arrays
            if (object.secret.encryptedSecrets.some(
                /**
                 * @param {unknown} array
                 * @returns {boolean}
                 */
                array => !(array instanceof Uint8Array),
            )) {
                throw new Errors.InvalidRequestError(
                    'Invalid secret.encryptedSecrets: must be an array of Uint8Arrays',
                );
            }
            // Validate the RSA key used to encrypt the secrets is a supported size
            const rsaKeySize = object.secret.encryptedSecrets[0].length * 8;
            if (!CONFIG.RSA_SUPPORTED_KEY_BITS.includes(rsaKeySize)) {
                throw new Errors.InvalidRequestError('Invalid secret.encryptedSecrets: invalid RSA key size');
            }
            // Validate all encryptedSecrets are the same length
            if (object.secret.encryptedSecrets.some(
                /**
                 * @param {Uint8Array} array
                 * @returns {boolean}
                 */
                array => array.length * 8 !== rsaKeySize,
            )) {
                throw new Errors.InvalidRequestError(
                    'Invalid secret.encryptedSecrets: encrypted strings must be the same length',
                );
            }
            // Validate bScalar
            if (!(object.secret.bScalar instanceof Uint8Array) || object.secret.bScalar.length !== 32) {
                throw new Errors.InvalidRequestError('Invalid secret.bScalar: must be an Uint8Array(32)');
            }
            // Validate keyParams
            if (!object.secret.keyParams) {
                throw new Errors.InvalidRequestError('Missing secret.keyParams');
            }
            const keyParams = object.secret.keyParams;
            if (!('kdf' in keyParams) || !('iterations' in keyParams) || !('keySize' in keyParams)) {
                throw new Errors.InvalidRequestError('Invalid secret.keyParams: missing properties');
            }
            if (!CONFIG.RSA_SUPPORTED_KDF_FUNCTIONS.includes(keyParams.kdf)) {
                throw new Errors.InvalidRequestError(`Unsupported keyParams KDF function: ${keyParams.kdf}`);
            }
            if (!CONFIG.RSA_SUPPORTED_KDF_ITERATIONS[keyParams.kdf].includes(keyParams.iterations)) {
                throw new Errors.InvalidRequestError(`Unsupported keyParams KDF iterations: ${keyParams.iterations}`);
            }
            if (keyParams.keySize !== rsaKeySize) {
                throw new Errors.InvalidRequestError(`Wrong keyParams key size: ${keyParams.keySize}`);
            }
            secret = {
                encryptedSecrets: object.secret.encryptedSecrets,
                bScalar: object.secret.bScalar,
                keyParams,
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid secret format');
        }

        /** @type {Nimiq.RandomSecret} */
        let aggregatedCommitment;
        try {
            aggregatedCommitment = new Nimiq.Commitment(object.aggregatedCommitment);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Errors.InvalidRequestError(
                `Invalid aggregated commitment: ${errorMessage}`,
            );
        }

        const userName = this.parseLabel(object.userName, true, 'userName');

        return {
            publicKeys,
            numberOfSigners,
            signerPublicKeys,
            secret,
            aggregatedCommitment,
            userName,
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
 */
SignMultisigTransactionApi.Layouts = Object.freeze({
    STANDARD: /** @type {'standard'} */ ('standard'),
    // CHECKOUT: /** @type {'checkout'} */ ('checkout'),
    // CASHLINK: /** @type {'cashlink'} */ ('cashlink'),
});
