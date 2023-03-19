/* global BitcoinRequestParserMixin */
/* global PolygonRequestParserMixin */
/* global TopLevelApi */
/* global Nimiq */
/* global SignSwap */
/* global Errors */
/* global Iban */
/* global ethers */
/* global CONFIG */
/* global PolygonContractABIs */

class SignSwapApi extends PolygonRequestParserMixin(BitcoinRequestParserMixin(TopLevelApi)) {
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
                senderLabel: /** @type {string} */ (this.parseLabel(
                    request.fund.senderLabel, false, 'fund.senderLabel',
                )),
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
        } else if (request.fund.type === 'USDC_MATIC') {
            const [forwardRequest, description] = this.parseOpenGsnForwardRequest(
                request.fund,
                ['open', 'openWithPermit'],
            );

            parsedRequest.fund = {
                type: 'USDC_MATIC',
                keyPath: this.parsePolygonPath(request.fund.keyPath, 'fund.keyPath'),
                // eslint-disable-next-line object-shorthand
                description: /** @type {PolygonOpenDescription | PolygonOpenWithPermitDescription} */ (description),
                request: forwardRequest,
                relayData: this.parseOpenGsnRelayData(request.fund.relayData),
                permit: request.fund.permit,
            };
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
                recipientLabel: /** @type {string} */ (this.parseLabel(
                    request.redeem.recipientLabel, false, 'recipientLabel',
                )),
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
                output: /** @type {KeyguardRequest.BitcoinTransactionChangeOutput} */ (this.parseChangeOutput(
                    request.redeem.output, false, 'redeem.output',
                )),
            };
        } else if (request.redeem.type === 'USDC_MATIC') {
            const [forwardRequest, description] = this.parseOpenGsnForwardRequest(
                request.redeem,
                ['redeem', 'redeemWithSecretInData'],
            );

            parsedRequest.redeem = {
                type: 'USDC_MATIC',
                keyPath: this.parsePolygonPath(request.redeem.keyPath, 'fund.keyPath'),
                // eslint-disable-next-line object-shorthand
                description: /** @type {PolygonRedeemDescription | PolygonRedeemWithSecretInDataDescription} */
                    (description),
                request: forwardRequest,
                relayData: this.parseOpenGsnRelayData(request.redeem.relayData),
                amount: this.parsePositiveInteger(request.redeem.amount, false, 'redeem.amount'),
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
            // SLIDER layout is only allowed for crypto-to-crypto swaps
            const assets = ['NIM', 'BTC', 'USDC_MATIC'];
            if (!assets.includes(parsedRequest.fund.type) || !assets.includes(parsedRequest.redeem.type)) {
                throw new Errors.InvalidRequestError(
                    'The \'slider\' layout is only allowed for swaps between NIM, BTC and USDC',
                );
            }

            parsedRequest.direction = this.parseDirection(request.direction);

            parsedRequest.nimiqAddresses = request.nimiqAddresses.map((address, index) => ({
                address: this.parseAddress(address.address, `nimiqAddresses[${index}].address`).toUserFriendlyAddress(),
                balance: this.parsePositiveInteger(address.balance, true, `nimiqAddresses[${index}].balance`),
            }));
            parsedRequest.bitcoinAccount = {
                balance: this.parsePositiveInteger(request.bitcoinAccount.balance, true, 'bitcoinAccount.balance'),
            };
            parsedRequest.polygonAddresses = request.polygonAddresses.map(({ address, usdcBalance }, index) => ({
                address: this.parsePolygonAddress(address, `polygonAddresses[${index}].address`),
                usdcBalance: this.parsePositiveInteger(usdcBalance, true, `polygonAddresses[${index}].balance`),
            }));

            // Verify that used Nimiq address is in nimiqAddresses[] and has enough balance
            const nimAddress = parsedRequest.fund.type === 'NIM'
                ? parsedRequest.fund.transaction.sender.toUserFriendlyAddress()
                : parsedRequest.redeem.type === 'NIM'
                    ? parsedRequest.redeem.transaction.recipient.toUserFriendlyAddress()
                    : undefined;
            if (nimAddress) {
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

            // Verify that used Polygon address is in polygonAddresses[] and has enough balance
            const polygonAddress = parsedRequest.fund.type === 'USDC_MATIC'
                ? parsedRequest.fund.request.from
                : parsedRequest.redeem.type === 'USDC_MATIC'
                    // Even for redeeming, the user's address is the `from` address,
                    // because in EVM, redeeming is still an interaction with a contract.
                    // Triggering the payout means calling a function on the HTLC contract,
                    // that's why the sender (`from`) is the user and the recipient (`to`)
                    // is the contract.
                    ? parsedRequest.redeem.request.from
                    : undefined;
            if (polygonAddress) {
                const activePolygonAddress = parsedRequest.polygonAddresses
                    .find(addressInfo => addressInfo.address === polygonAddress);
                if (!activePolygonAddress) {
                    throw new Errors.InvalidRequestError(
                        'The address details of the Polygon address doing the swap must be provided',
                    );
                } else if (
                    parsedRequest.fund.type === 'USDC_MATIC'
                    && activePolygonAddress.usdcBalance < parsedRequest.fund.description.args.amount
                        .add(parsedRequest.fund.description.args.fee).toNumber()
                ) {
                    throw new Errors.InvalidRequestError('The sending USDC address does not have enough balance');
                }
            }
        }

        // Parse optional KYC data
        if (request.kyc) {
            if (request.kyc.provider !== 'TEN31 Pass') {
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
     *
     * @param {unknown} direction
     * @returns {'left-to-right' | 'right-to-left'}
     */
    parseDirection(direction) {
        if (typeof direction !== 'string' || (direction !== 'left-to-right' && direction !== 'right-to-left')) {
            throw new Error('Invalid direction');
        }
        return direction;
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     *
     * @param {Omit<KeyguardRequest.PolygonTransactionInfo, 'approval' | 'amount'>} request
     * @param {Array<'open' | 'openWithPermit' | 'redeem' | 'redeemWithSecretInData'>} allowedMethods
     * @returns {[
     *     KeyguardRequest.OpenGsnForwardRequest,
     *     PolygonOpenDescription
     *     | PolygonOpenWithPermitDescription
     *     | PolygonRedeemDescription
     *     | PolygonRedeemWithSecretInDataDescription,
     * ]}
     */
    parseOpenGsnForwardRequest(request, allowedMethods) {
        const forwardRequest = this.parseOpenGsnForwardRequestRoot(request.request);

        if (forwardRequest.to !== CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS) {
            throw new Errors.InvalidRequestError('request.to address is not allowed');
        }

        const usdcHtlcContract = new ethers.Contract(
            CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
            PolygonContractABIs.NATIVE_USDC_HTLC_CONTRACT_ABI,
        );

        // eslint-disable-next-line operator-linebreak
        const description =
            /** @type {PolygonOpenDescription
             *     | PolygonOpenWithPermitDescription
             *     | PolygonRedeemDescription
             *     | PolygonRedeemWithSecretInDataDescription}
             */ (usdcHtlcContract.interface.parseTransaction({
                data: forwardRequest.data,
                value: forwardRequest.value,
            }));

        if (!allowedMethods.includes(description.name)) {
            throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
        }

        if (description.name === 'open' || description.name === 'openWithPermit') {
            if (description.args.token !== CONFIG.NATIVE_USDC_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError('Invalid USDC token contract in request data');
            }

            if (description.args.refundAddress !== forwardRequest.from) {
                throw new Errors.InvalidRequestError('USDC HTLC refund address must be same as sender');
            }
        }

        if (description.name === 'redeem' || description.name === 'redeemWithSecretInData') {
            if (description.args.target !== forwardRequest.from) {
                throw new Errors.InvalidRequestError('USDC HTLC target address must be same as sender');
            }
        }

        // Check that permit object exists when method is 'openWithPermit', and unset for other methods.
        if ((description.name === 'openWithPermit') !== !!request.permit) {
            throw new Errors.InvalidRequestError('`permit` object is only allowed for contract method '
                + '"openWithPermit"');
        }

        return [forwardRequest, description];
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
 */
SignSwapApi.Layouts = Object.freeze({
    STANDARD: /** @type {'standard'} */ ('standard'),
    SLIDER: /** @type {'slider'} */ ('slider'),
});
