/* global Nimiq */
/* global TopLevelApi */
/* global SignMultisigTransaction */
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
                if (!(key instanceof Uint8Array)) throw new Error('not a Uint8Array');
                publicKeys.push(new Nimiq.PublicKey(key));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Errors.InvalidRequestError(`Invalid public keys: ${errorMessage}`);
        }

        /** @type {{publicKey: Nimiq.PublicKey, commitments: Nimiq.Commitment[]}[]} */
        const signers = [];
        try {
            if (!('signers' in object)) throw new Error('missing');
            if (!Array.isArray(object.signers)) throw new Error('not an array');
            for (const obj of object.signers) {
                if (typeof obj !== 'object' || obj === null) throw new Error('not objects');

                if (!('publicKey' in obj)) throw new Error('missing publicKey');
                if (!(obj.publicKey instanceof Uint8Array)) throw new Error('publicKey not a Uint8Array');
                const signerPublicKey = new Nimiq.PublicKey(obj.publicKey);
                // Verify key is included in publicKeys as well
                if (!publicKeys.find(publicKey => publicKey.equals(signerPublicKey))) {
                    throw new Errors.InvalidRequestError('not in public keys');
                }

                if (!('commitments' in obj)) throw new Error('missing commitments');
                if (!Array.isArray(obj.commitments) || obj.commitments.length < 2) {
                    throw new Error('commitments must be an array with at least 2 elements');
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

        /** @type {MultisigConfig['secrets']} */
        let secrets;
        if (Array.isArray(object.secrets)) {
            secrets = object.secrets.map(
                /**
                 * @param {any} secret
                 * @returns {Nimiq.RandomSecret}
                 */
                secret => {
                    if (!(secret instanceof Uint8Array)) {
                        throw new Errors.InvalidRequestError('Invalid secrets: must be Uint8Arrays');
                    }
                    return new Nimiq.RandomSecret(secret);
                },
            );
        } else if ('encrypted' in object.secrets) {
            // Not checking fixed length here, to stay flexible for future increases of the number of commitments
            if (!Array.isArray(object.secrets.encrypted) || object.secrets.encrypted.length < 2) {
                throw new Errors.InvalidRequestError(
                    'Invalid secrets.encrypted: must be an array with at least 2 elements',
                );
            }
            // Validate encrypted secrets are Uint8Arrays
            if (object.secrets.encrypted.some(
                /**
                 * @param {unknown} array
                 * @returns {boolean}
                 */
                array => !(array instanceof Uint8Array),
            )) {
                throw new Errors.InvalidRequestError(
                    'Invalid secrets.encrypted: must be an array of Uint8Arrays',
                );
            }
            // Validate the RSA key used to encrypt the secrets is a supported size
            const rsaKeySize = object.secrets.encrypted[0].length * 8;
            if (!CONFIG.RSA_SUPPORTED_KEY_BITS.includes(rsaKeySize)) {
                throw new Errors.InvalidRequestError('Invalid secrets.encrypted: invalid RSA key size');
            }
            // Validate all encrypted are the same length
            if (object.secrets.encrypted.some(
                /**
                 * @param {Uint8Array} array
                 * @returns {boolean}
                 */
                array => array.length * 8 !== rsaKeySize,
            )) {
                throw new Errors.InvalidRequestError(
                    'Invalid secrets.encrypted: all encrypted secrets must be the same length',
                );
            }
            // Validate keyParams
            if (!object.secrets.keyParams) {
                throw new Errors.InvalidRequestError('Missing secrets.keyParams');
            }
            const keyParams = object.secrets.keyParams;
            if (!('kdf' in keyParams) || !('iterations' in keyParams) || !('keySize' in keyParams)) {
                throw new Errors.InvalidRequestError('Invalid secrets.keyParams: missing properties');
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
            secrets = {
                encrypted: object.secrets.encrypted,
                keyParams,
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid secrets format');
        }

        const userName = this.parseLabel(object.userName, true, 'userName');

        return {
            publicKeys,
            signers,
            secrets,
            userName,
        };
    }

    /**
     * @param {Nimiq.Transaction} transaction
     * @param {MultisigConfig} multisig
     */
    verifyMultisigAddress(transaction, multisig) {
        const multisigAddress = Nimiq.Address.fromPublicKeys(
            multisig.publicKeys,
            multisig.signers.length,
        );

        if (transaction.senderType === Nimiq.AccountType.Basic) {
            if (!transaction.sender.equals(multisigAddress)) {
                throw new Errors.InvalidRequestError(
                    'Transaction sender does not match calculated multisig address',
                );
            }
        } else if (transaction.senderType === Nimiq.AccountType.Vesting) {
            // Cannot verify vesting contract address
        } else if (transaction.recipientType === Nimiq.AccountType.Basic) {
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
