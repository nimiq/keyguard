/* global BitcoinRequestParserMixin */
/* global TopLevelApi */
/* global Nimiq */
/* global SignSwap */
/* global Errors */
/* global Iban */

class SignSwapApi extends BitcoinRequestParserMixin(TopLevelApi) {
    /**
     * @param {KeyguardRequest.SignSwapRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignSwapRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignSwapRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        if (parsedRequest.keyInfo.type !== Nimiq.Secret.Type.ENTROPY) {
            throw new Errors.InvalidRequestError('Swaps are only supported with modern accounts.');
        }
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel, true, 'keyLabel');

        parsedRequest.swapId = /** @type {string} */ (this.parseLabel(request.swapId, false, 'swapId'));

        if (request.fund.type === request.redeem.type) {
            throw new Errors.InvalidRequestError('Swap must be between two different currencies');
        }

        if (request.fund.type === 'NIM') {
            parsedRequest.fund = {
                type: 'NIM',
                keyPath: this.parsePath(request.fund.keyPath, 'fund.keyPath'),
                transaction: this.parseTransaction({
                    data: new Uint8Array(78), // Dummy, required for CONTRACT_CREATION flag
                    ...request.fund,
                    // Enforced properties
                    recipient: 'CONTRACT_CREATION',
                    recipientType: Nimiq.Account.Type.HTLC,
                    flags: Nimiq.Transaction.Flag.CONTRACT_CREATION,
                }),
                /** @type {string} */
                senderLabel: (this.parseLabel(request.fund.senderLabel, false, 'fund.senderLabel')),
            };
        } else if (request.fund.type === 'BTC') {
            parsedRequest.fund = {
                type: 'BTC',
                inputs: this.parseInputs(request.fund.inputs),
                recipientOutput: {
                    value: this.parsePositiveInteger(
                        request.fund.recipientOutput.value,
                        false,
                        'fund.recipientOutput.value',
                    ),
                },
                changeOutput: this.parseChangeOutput(request.fund.changeOutput, true, 'fund.changeOutput'),
                locktime: request.fund.locktime !== undefined
                    ? this.parseUint32(request.fund.locktime, 'fund.locktime')
                    : undefined,
                refundKeyPath: this.parseBitcoinPath(request.fund.refundKeyPath, 'fund.refundKeyPath'),
                refundAddress: '', // Will be filled out after password entry
            };
            if (parsedRequest.fund.locktime
                && !parsedRequest.fund.inputs.some(({ sequence }) => sequence && sequence < 0xffffffff)) {
                throw new Errors.InvalidRequestError('For locktime to be effective, at least one input must have a '
                    + 'sequence number < 0xffffffff');
            }
        } else if (request.fund.type === 'EUR') {
            parsedRequest.fund = {
                type: 'EUR',
                amount: this.parsePositiveInteger(request.fund.amount, false, 'fund.amount'),
                fee: this.parsePositiveInteger(request.fund.fee, true, 'fund.fee'),
                bankLabel: this.parseLabel(request.fund.bankLabel, true, 'fund.bankLabel'),
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid funding type');
        }

        if (request.redeem.type === 'NIM') {
            parsedRequest.redeem = {
                type: 'NIM',
                keyPath: this.parsePath(request.redeem.keyPath, 'redeem.keyPath'),
                transaction: this.parseTransaction({
                    sender: Nimiq.Address.NULL.toUserFriendlyAddress(), // Dummy
                    ...request.redeem,
                    // Enforced properties
                    senderType: Nimiq.Account.Type.HTLC,
                    recipientType: Nimiq.Account.Type.BASIC,
                    flags: Nimiq.Transaction.Flag.NONE,
                }),
                /** @type {string} */
                recipientLabel: (this.parseLabel(request.redeem.recipientLabel, false, 'recipientLabel')),
            };
        } else if (request.redeem.type === 'BTC') {
            parsedRequest.redeem = {
                type: 'BTC',
                input: {
                    witnessUtxo: {
                        value: this.parsePositiveInteger(request.redeem.input.value, false, 'redeem.input.value'),
                    },
                    keyPath: this.parseBitcoinPath(request.redeem.input.keyPath, 'redeem.input.keyPath'),
                },
                /** @type {KeyguardRequest.BitcoinTransactionChangeOutput} */
                output: (this.parseChangeOutput(request.redeem.output, false, 'redeem.output')),
            };
        } else if (request.redeem.type === 'EUR') {
            parsedRequest.redeem = {
                type: 'EUR',
                keyPath: this.parsePath(request.redeem.keyPath, 'redeem.keyPath'),
                settlement: this.parseOasisSettlementInstruction(request.redeem.settlement, 'redeem.settlement'),
                amount: this.parsePositiveInteger(request.redeem.amount, false, 'redeem.amount'),
                fee: this.parsePositiveInteger(request.redeem.fee, true, 'redeem.fee'),
                bankLabel: this.parseLabel(request.redeem.bankLabel, true, 'redeem.bankLabel'),
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid redeeming type');
        }

        // Parse display data
        parsedRequest.fiatCurrency = /** @type {string} */ (this.parseFiatCurrency(request.fiatCurrency, false));
        parsedRequest.fundingFiatRate = /** @type {number} */ (
            this.parseNonNegativeFiniteNumber(request.fundingFiatRate, false, 'fundingFiatRate'));
        parsedRequest.redeemingFiatRate = /** @type {number} */ (
            this.parseNonNegativeFiniteNumber(request.redeemingFiatRate, false, 'redeemingFiatRate'));
        parsedRequest.fundFees = {
            processing: /** @type {number} */ (
                this.parsePositiveInteger(request.fundFees.processing, true, 'fundFees.processing')),
            redeeming: /** @type {number} */ (
                this.parsePositiveInteger(request.fundFees.redeeming, true, 'fundFees.redeeming')),
        };
        parsedRequest.redeemFees = {
            funding: /** @type {number} */ (
                this.parsePositiveInteger(request.redeemFees.funding, true, 'redeemFees.funding')),
            processing: /** @type {number} */ (
                this.parsePositiveInteger(request.redeemFees.processing, true, 'redeemFees.processing')),
        };
        parsedRequest.serviceSwapFee = /** @type {number} */ (
            this.parsePositiveInteger(request.serviceSwapFee, true, 'serviceSwapFee'));

        parsedRequest.layout = this.parseLayout(request.layout);

        if (request.layout === SignSwapApi.Layouts.SLIDER && parsedRequest.layout === SignSwapApi.Layouts.SLIDER) {
            // SLIDER layout is only allowed for NIM-BTC swaps
            const assets = ['NIM', 'BTC'];
            if (!assets.includes(parsedRequest.fund.type) || !assets.includes(parsedRequest.redeem.type)) {
                throw new Errors.InvalidRequestError(
                    'The \'slider\' layout is only allowed for swaps between NIM and BTC',
                );
            }

            parsedRequest.nimiqAddresses = request.nimiqAddresses.map((address, index) => ({
                address: this.parseAddress(address.address, `nimiqAddresses[${index}].address`).toUserFriendlyAddress(),
                balance: this.parsePositiveInteger(address.balance, true, `nimiqAddresses[${index}].balance`),
            }));
            parsedRequest.bitcoinAccount = {
                balance: this.parsePositiveInteger(request.bitcoinAccount.balance, true, 'bitcoinAccount.balance'),
            };

            const nimAddress = parsedRequest.fund.type === 'NIM'
                ? parsedRequest.fund.transaction.sender.toUserFriendlyAddress()
                : parsedRequest.redeem.type === 'NIM'
                    ? parsedRequest.redeem.transaction.recipient.toUserFriendlyAddress()
                    : ''; // Should never happen, if parsing works correctly
            const activeNimiqAddress = parsedRequest.nimiqAddresses
                .find(addressInfo => addressInfo.address === nimAddress);
            if (!activeNimiqAddress) {
                throw new Errors.InvalidRequestError(
                    'The address details of the NIM address doing the swap must be provided',
                );
            } else if (
                parsedRequest.fund.type === 'NIM'
                && activeNimiqAddress.balance < (
                    parsedRequest.fund.transaction.value + parsedRequest.fund.transaction.fee
                )
            ) {
                throw new Errors.InvalidRequestError('The sending NIM address does not have enough balance');
            }
        }

        // Parse optional KYC data
        if (request.kyc) {
            if (request.kyc.provider !== 'TEN31 PASS') {
                throw new Errors.InvalidRequestError(`Unsupported KYC provider: ${request.kyc.provider}`);
            }
            // TODO verify JWT tokens
            if (typeof request.kyc.s3GrantToken !== 'string' || !request.kyc.s3GrantToken) {
                throw new Error('Invalid KYC S3 grant token');
            }
            if (request.kyc.oasisGrantToken !== undefined
                && (typeof request.kyc.oasisGrantToken !== 'string' || !request.kyc.oasisGrantToken)) {
                throw new Error('Invalid KYC OASIS grant token');
            } else if (!request.kyc.oasisGrantToken
                && (parsedRequest.fund.type === 'EUR' || parsedRequest.redeem.type === 'EUR')) {
                throw new Error('An OASIS grant token is required for KYC enabled EUR swaps');
            }
            parsedRequest.kyc = request.kyc;
        }

        return parsedRequest;
    }

    /**
     * Checks that the given layout is valid
     * @param {unknown} layout
     * @returns {KeyguardRequest.SignSwapRequestLayout}
     */
    parseLayout(layout) {
        if (!layout) {
            return SignSwapApi.Layouts.STANDARD;
        }
        // @ts-ignore (Property 'values' does not exist on type 'ObjectConstructor'.)
        if (Object.values(SignSwapApi.Layouts).indexOf(layout) === -1) {
            throw new Errors.InvalidRequestError('Invalid selected layout');
        }
        return /** @type KeyguardRequest.SignSwapRequestLayout */ (layout);
    }

    /**
     * Checks that the given instruction is a valid OASIS SettlementInstruction
     * @param {unknown} obj
     * @param {string} parameterName
     * @returns {Omit<KeyguardRequest.MockSettlementInstruction, 'contractId'> |
     *           Omit<KeyguardRequest.SepaSettlementInstruction, 'contractId'>}
     */
    parseOasisSettlementInstruction(obj, parameterName) {
        if (typeof obj !== 'object' || obj === null) {
            throw new Errors.InvalidRequestError('Invalid settlement');
        }

        switch (/** @type {{type: unknown}} */ (obj).type) {
            case 'mock': {
                /** @type {Omit<KeyguardRequest.MockSettlementInstruction, 'contractId'>} */
                const settlement = {
                    type: 'mock',
                };
                return settlement;
            }
            case 'sepa': {
                const recipient = /** @type {{recipient: unknown}} */ (obj).recipient;
                if (typeof recipient !== 'object' || recipient === null) {
                    throw new Errors.InvalidRequestError('Invalid settlement recipient');
                }

                /** @type {Omit<KeyguardRequest.SepaSettlementInstruction, 'contractId'>} */
                const settlement = {
                    type: 'sepa',
                    recipient: {
                        name: /** @type {string} */ (
                            this.parseLabel(
                                /** @type {{name: unknown}} */ (recipient).name,
                                false,
                                `${parameterName}.recipient.name`,
                            )
                        ),
                        iban: this.parseIban(
                            /** @type {{iban: unknown}} */ (recipient).iban,
                            `${parameterName}.recipient.iban`,
                        ),
                        bic: this.parseBic(
                            /** @type {{bic: unknown}} */ (recipient).bic,
                            `${parameterName}.recipient.bic`,
                        ),
                    },
                };
                return settlement;
            }
            default: throw new Errors.InvalidRequestError('Invalid settlement type');
        }
    }

    /**
     * @param {unknown} iban
     * @param {string} parameterName
     * @returns {string}
     */
    parseIban(iban, parameterName) {
        if (!Iban.isValid(iban)) {
            throw new Errors.InvalidRequestError(`${parameterName} is not a valid IBAN`);
        }
        return Iban.printFormat(/** @type {string} */ (iban), ' ');
    }

    get Handler() {
        return SignSwap;
    }

    /**
     * @param {unknown} bic
     * @param {string} parameterName
     * @returns {string}
     */
    parseBic(bic, parameterName) {
        if (typeof bic !== 'string') {
            throw new Errors.InvalidRequestError(`${parameterName} must be a string`);
        }
        // Regex from https://github.com/jquery-validation/jquery-validation/blob/master/src/additional/bic.js
        if (!/^([A-Z]{6}[A-Z2-9][A-NP-Z1-9])(X{3}|[A-WY-Z0-9][A-Z0-9]{2})?$/.test(bic)) {
            throw new Errors.InvalidRequestError(`${parameterName} is not a valid BIC`);
        }
        return bic;
    }
}

/**
 * @enum {KeyguardRequest.SignSwapRequestLayout}
 * @readonly
 */
SignSwapApi.Layouts = {
    STANDARD: /** @type {'standard'} */ ('standard'),
    SLIDER: /** @type {'slider'} */ ('slider'),
};
