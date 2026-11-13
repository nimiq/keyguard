/* global ethers */
/* global Key */
/* global PolygonKey */
/* global PolygonConstants */
/* global PolygonGasless */
/* global PolygonGaslessHtlc */
/* global SignSwap */
/* global SignPolygonTransactionApi */
/* global SignSwapApi */
/* global SwapIFrameApi */
/* global NonPartitionedSessionStorage */
/* global Utf8Tools */
/* global Nimiq */
/* global Errors */
/* global CONFIG */
/* global Dummy */

describe('PolygonGaslessHtlc', () => {
    // Provisional, no GaslessHTLC contract is deployed yet
    const HTLC_CONTRACT = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
    const RELAY = CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES[0];
    const ID = `0x${'11'.repeat(32)}`;
    const HASH = `0x${'22'.repeat(32)}`;
    const RECIPIENT = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

    /** @type {string} */
    let configuredContract;

    beforeEach(() => {
        configuredContract = CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS;
        CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS = HTLC_CONTRACT;
    });

    afterEach(() => {
        CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS = configuredContract;
    });

    /**
     * @param {string} from
     * @returns {KeyguardRequest.PolygonHtlcOpenRequest}
     */
    function openRequest(from) {
        return {
            token: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            from,
            id: ID,
            recipient: RECIPIENT,
            amount: '250000000',
            hash: HASH,
            timeout: '1790007200',
            fee: '50000',
            relay: RELAY,
            deadline: '1790000600',
        };
    }

    it('has the provisional EIP-712 types', () => {
        expect(ethers.utils._TypedDataEncoder.from(PolygonGaslessHtlc.OPEN_TYPES).encodeType('HtlcOpen')).toBe(
            'HtlcOpen(address token,address from,bytes32 id,address recipient,uint256 amount,bytes32 hash,'
            + 'uint256 timeout,uint256 fee,address relay,uint256 deadline,TokenAuth auth)'
            + 'TokenAuth(uint8 mode,uint8 v,bytes32 r,bytes32 s)',
        );
        expect(ethers.utils._TypedDataEncoder.from(PolygonGaslessHtlc.REDEEM_TYPES).encodeType('HtlcRedeem')).toBe(
            'HtlcRedeem(address from,bytes32 id,address target,uint256 fee,address relay,uint256 deadline)',
        );
        expect(ethers.utils._TypedDataEncoder.from(PolygonGaslessHtlc.REFUND_TYPES).encodeType('HtlcRefund')).toBe(
            'HtlcRefund(address from,bytes32 id,address target,uint256 fee,address relay,uint256 deadline)',
        );
        expect(PolygonGaslessHtlc.domain()).toEqual({
            name: 'Nimiq Gasless HTLC',
            version: '3',
            chainId: CONFIG.POLYGON_CHAIN_ID,
            verifyingContract: HTLC_CONTRACT,
        });
    });

    it('refuses to sign without a configured contract', () => {
        CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS = '';
        expect(() => PolygonGaslessHtlc.domain()).toThrowError(Errors.KeyguardError);
    });

    it('decodes the HTLC data of the swap service', () => {
        const htlcData = new ethers.utils.Interface(PolygonGaslessHtlc.HTLC_DATA_ABI).encodeFunctionData('open', [
            ID,
            CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            '250000000',
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            RECIPIENT,
            HASH,
            1790007200,
            0,
        ]);
        expect(PolygonGaslessHtlc.decodeHtlcData(htlcData)).toEqual({
            id: ID,
            token: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            amount: '250000000',
            refundAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            recipient: RECIPIENT,
            hash: HASH,
            timeout: 1790007200,
        });
    });

    /**
     * @param {PolygonKey} polygonKey
     * @param {'NIM' | 'BTC' | 'USDC_MATIC' | 'USDT_MATIC' | 'EUR'} [redeemAsset]
     * @returns {Promise<PolygonHtlcFunding>}
     */
    async function signedFunding(polygonKey, redeemAsset = 'BTC') {
        /** @type {PolygonHtlcFunding} */
        const fund = {
            type: 'USDC_MATIC',
            keyPath: PolygonConstants.DEFAULT_DERIVATION_PATH,
            request: {
                from: polygonKey.deriveAddress(PolygonConstants.DEFAULT_DERIVATION_PATH),
                amount: '250000000',
                fee: '50000',
                relay: RELAY,
            },
            tokenNonce: 3,
        };
        await SignSwap.signHtlcPermit(polygonKey, fund, redeemAsset);
        return fund;
    }

    it('signs the permit for the HTLC contract when the user confirms, with the deadline of the opening', async () => {
        const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
        const from = polygonKey.deriveAddress(PolygonConstants.DEFAULT_DERIVATION_PATH);
        const now = PolygonGasless.now();
        const spy = spyOn(polygonKey, 'signTypedData').and.callThrough();

        const fund = await signedFunding(polygonKey);

        expect(Number(fund.deadline)).toBeGreaterThanOrEqual(now + 30 * 60);
        expect(Number(fund.deadline)).toBeLessThanOrEqual(now + 30 * 60 + 1);

        const [, domain, types, message] = spy.calls.mostRecent().args;
        expect(domain.verifyingContract).toBe(CONFIG.NATIVE_USDC_CONTRACT_ADDRESS);
        expect(message).toEqual({
            owner: from,
            spender: HTLC_CONTRACT,
            value: '250050000',
            nonce: '3',
            deadline: fund.deadline,
        });
        const authorization = /** @type {KeyguardRequest.PolygonTokenPermit} */ (fund.authorization);
        expect(authorization.mode).toBe('permit');
        expect(ethers.utils.verifyTypedData(domain, types, message, ethers.utils.joinSignature(authorization)))
            .toBe(from);
    });

    it('sets the deadline of an opening by the other side of the swap', async () => {
        for (const [redeemAsset, seconds] of /** @type {const} */ ([
            ['BTC', 30 * 60],
            ['EUR', 5 * 60],
            ['NIM', 5 * 60],
            ['USDC_MATIC', 5 * 60],
            ['USDT_MATIC', 5 * 60],
        ])) {
            const now = PolygonGasless.now();
            const deadline = PolygonGaslessHtlc.openingDeadline(redeemAsset);
            expect(deadline).toBeGreaterThanOrEqual(now + seconds);
            expect(deadline).toBeLessThanOrEqual(now + seconds + 1);

            // The permit gets the same deadline
            const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
            const spy = spyOn(polygonKey, 'signTypedData').and.callThrough();
            // eslint-disable-next-line no-await-in-loop
            const fund = await signedFunding(polygonKey, redeemAsset);
            expect(Number(fund.deadline)).toBeGreaterThanOrEqual(now + seconds);
            expect(Number(fund.deadline)).toBeLessThanOrEqual(now + seconds + 1);
            expect(spy.calls.mostRecent().args[3].deadline).toBe(fund.deadline);
        }
    });

    it('signs the opening over the permit', async () => {
        const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
        const path = PolygonConstants.DEFAULT_DERIVATION_PATH;
        const from = polygonKey.deriveAddress(path);
        const request = openRequest(from);
        const fund = await signedFunding(polygonKey);
        const authorization = /** @type {KeyguardRequest.PolygonTokenPermit} */ (fund.authorization);

        const signed = await PolygonGaslessHtlc.signOpen(
            (domain, types, message) => polygonKey.signTypedData(path, domain, types, message),
            request,
            authorization,
        );

        const open = PolygonGaslessHtlc.openTypedData(request, signed.authorization);
        expect(open.message.auth).toEqual({
            mode: 1,
            v: authorization.v,
            r: authorization.r,
            s: authorization.s,
        });
        expect(ethers.utils.verifyTypedData(open.domain, open.types, open.message, signed.signature)).toBe(from);
        expect(signed.request).toEqual(request);
        expect(signed.authorization).toEqual(authorization);
    });

    it('signs redeems and refunds as different types', async () => {
        const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
        const path = PolygonConstants.DEFAULT_DERIVATION_PATH;
        const from = polygonKey.deriveAddress(path);
        /** @type {KeyguardRequest.PolygonHtlcSettlementRequest} */
        const request = {
            from,
            id: ID,
            target: from,
            fee: '50000',
            relay: RELAY,
            deadline: '1790000600',
        };
        /** @type {PolygonGaslessHtlc.Sign} */
        const sign = (domain, types, message) => polygonKey.signTypedData(path, domain, types, message);

        const redeem = await PolygonGaslessHtlc.signSettlement(sign, 'redeem', request);
        const refund = await PolygonGaslessHtlc.signSettlement(sign, 'refund', request);
        expect(redeem.signature).not.toBe(refund.signature);

        const redeemPayload = PolygonGaslessHtlc.settlementTypedData('redeem', request);
        expect(ethers.utils.verifyTypedData(
            redeemPayload.domain,
            redeemPayload.types,
            redeemPayload.message,
            redeem.signature,
        )).toBe(from);
        const refundPayload = PolygonGaslessHtlc.settlementTypedData('refund', request);
        expect(ethers.utils.verifyTypedData(
            refundPayload.domain,
            refundPayload.types,
            refundPayload.message,
            refund.signature,
        )).toBe(from);
    });

    it('checks the deadline of an opening', () => {
        const now = PolygonGasless.now();
        const deadline = now + 30 * 60;

        expect(() => PolygonGaslessHtlc.checkOpeningDeadline(deadline, deadline)).not.toThrow();
        // Fastspot's HTLCs time out after 2 hours
        expect(() => PolygonGaslessHtlc.checkOpeningDeadline(deadline, now + 2 * 60 * 60)).not.toThrow();

        // The HTLC times out before the deadline
        expect(() => PolygonGaslessHtlc.checkOpeningDeadline(deadline, deadline - 1))
            .toThrowError(Errors.InvalidRequestError);

        // The deadline does not leave the relay enough time, or has passed
        for (const passed of [now + 30, now, now - 3600]) {
            expect(() => PolygonGaslessHtlc.checkOpeningDeadline(passed, now + 24 * 60 * 60))
                .toThrowError(Errors.InvalidRequestError);
        }
    });

    describe('in the swap-iframe', () => {
        const EUR_KEY = '11'.repeat(32);

        /**
         * Runs the iframe's request with what SignSwap stored after password entry.
         *
         * @param {PolygonKey} polygonKey
         * @param {PolygonHtlcFunding} fund
         * @param {number} htlcTimeout
         * @returns {Promise<KeyguardRequest.SignSwapTransactionsResult>}
         */
        async function signSwapTransactions(polygonKey, fund, htlcTimeout) {
            const wallet = polygonKey.deriveKeyPair(fund.keyPath);
            const stored = {
                keys: { usdc: wallet.privateKey, eur: EUR_KEY },
                request: {
                    fund,
                    redeem: {
                        type: 'EUR',
                        keyPath: 'm/44\'/242\'/0\'/0\'',
                        settlement: { type: 'mock' },
                        amount: 1000,
                        fee: 0,
                    },
                },
            };
            spyOn(NonPartitionedSessionStorage, 'get').and.returnValue(
                Promise.resolve(Utf8Tools.stringToUtf8ByteArray(JSON.stringify(stored))),
            );
            spyOn(NonPartitionedSessionStorage, 'delete');

            const htlcData = new ethers.utils.Interface(PolygonGaslessHtlc.HTLC_DATA_ABI).encodeFunctionData('open', [
                ID,
                CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
                fund.request.amount,
                fund.request.from,
                RECIPIENT,
                HASH,
                htlcTimeout,
                0,
            ]);
            /** @type {any} */
            const request = {
                swapId: 'swap',
                fund: { type: 'USDC_MATIC', htlcData },
                redeem: {
                    type: 'EUR',
                    hash: HASH.substring(2),
                    timeout: htlcTimeout + 60 * 60,
                    htlcId: 'contract',
                },
                tmpCookieEncryptionKey: new Uint8Array(32),
            };
            return new SwapIFrameApi().signSwapTransactions(null, request);
        }

        it('signs the opening over the stored permit, with its deadline', async () => {
            const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
            const fund = await signedFunding(polygonKey);
            // Fastspot's HTLCs time out after 2 hours
            const timeout = PolygonGasless.now() + 2 * 60 * 60;

            const result = await signSwapTransactions(polygonKey, fund, timeout);

            const signed = /** @type {KeyguardRequest.SignedPolygonHtlcOpen} */ (result.usdc);
            expect(signed.authorization).toEqual(/** @type {any} */ (fund.authorization));
            expect(signed.request).toEqual({
                token: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
                from: fund.request.from,
                id: ID,
                recipient: RECIPIENT,
                amount: fund.request.amount,
                hash: HASH,
                timeout: timeout.toString(),
                fee: fund.request.fee,
                relay: RELAY,
                deadline: /** @type {string} */ (fund.deadline),
            });
            const open = PolygonGaslessHtlc.openTypedData(signed.request, signed.authorization);
            expect(ethers.utils.verifyTypedData(open.domain, open.types, open.message, signed.signature))
                .toBe(fund.request.from);
        });

        /**
         * @param {PolygonHtlcFunding} fund
         * @param {PolygonKey} polygonKey
         * @param {number} timeout
         * @returns {Promise<Error>}
         */
        async function signingError(fund, polygonKey, timeout) {
            try {
                await signSwapTransactions(polygonKey, fund, timeout);
            } catch (error) {
                return /** @type {Error} */ (error);
            }
            throw new Error('Expected the request to be rejected');
        }

        it('rejects an HTLC that times out before the deadline of its opening', async () => {
            const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
            const fund = await signedFunding(polygonKey);

            const error = await signingError(fund, polygonKey, Number(fund.deadline) - 1);
            expect(error.message).toContain('times out before the deadline');
        });

        it('rejects an opening whose deadline has passed', async () => {
            const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
            const fund = await signedFunding(polygonKey);
            fund.deadline = (PolygonGasless.now() + 30).toString();

            const error = await signingError(fund, polygonKey, PolygonGasless.now() + 4 * 60 * 60);
            expect(error.message).toContain('deadline of the HTLC opening has passed');
        });

        it('rejects a funding request without a permit', async () => {
            const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
            const fund = await signedFunding(polygonKey);
            delete fund.authorization;

            const error = await signingError(fund, polygonKey, PolygonGasless.now() + 4 * 60 * 60);
            expect(error.message).toContain('Missing permit');
        });
    });

    it('rejects redeeming an HTLC that has timed out', () => {
        const now = PolygonGasless.now();
        expect(() => PolygonGaslessHtlc.checkRedeemTimeout(now + 3600)).not.toThrow();
        for (const timeout of [now, now - 3600]) {
            expect(() => PolygonGaslessHtlc.checkRedeemTimeout(timeout)).toThrowError(Errors.InvalidRequestError);
        }
    });

    describe('limits amounts and fees to MAX_SAFE_INTEGER', () => {
        const SENDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
        const KEY_PATH = PolygonConstants.DEFAULT_DERIVATION_PATH;
        const MAX_SAFE = '9007199254740991';
        const UNSAFE = '9007199254740992';

        /**
         * TopLevelApi's constructor does not allow to run in a frame, and the parsers do not need it.
         *
         * @param {any} Api
         * @returns {any}
         */
        function parser(Api) {
            const api = Object.create(Api.prototype);
            spyOn(api, 'parseKeyId').and.returnValue(Promise.resolve({ type: Nimiq.Secret.Type.ENTROPY }));
            return api;
        }

        /**
         * @param {Promise<any>} parsing
         * @returns {Promise<Error>}
         */
        async function errorOf(parsing) {
            try {
                await parsing;
            } catch (error) {
                return /** @type {Error} */ (error);
            }
            throw new Error('Expected the request to be rejected');
        }

        /**
         * @param {string} amount
         * @param {string} fee
         * @returns {Promise<any>}
         */
        function parseSettlement(amount, fee) {
            return parser(SignPolygonTransactionApi).parseRequest({
                appName: 'Test',
                keyId: 'key',
                keyLabel: 'Key',
                keyPath: KEY_PATH,
                operation: 'redeem',
                token: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
                amount,
                request: {
                    from: SENDER,
                    id: ID,
                    target: SENDER,
                    fee,
                    relay: RELAY,
                },
            });
        }

        /**
         * @param {any} amount
         * @returns {Promise<any>}
         */
        function parseUsdcRedeemingSwap(amount) {
            return parser(SignSwapApi).parseRequest({
                appName: 'Test',
                keyId: 'key',
                swapId: 'swap',
                fund: {
                    type: 'EUR',
                    amount: 1000,
                    fee: 0,
                    bankLabel: 'Bank',
                },
                redeem: {
                    type: 'USDC_MATIC',
                    keyPath: KEY_PATH,
                    request: { from: SENDER, fee: '10000', relay: RELAY },
                    amount,
                },
            });
        }

        it('in settlements', async () => {
            expect((await parseSettlement(MAX_SAFE, '10000')).amount).toBe(MAX_SAFE);
            expect((await errorOf(parseSettlement(UNSAFE, '10000'))).message)
                .toContain('amount must be a safe integer');
            // Not only rejected by the fee limit, which is checked later
            expect((await errorOf(parseSettlement('1000000', UNSAFE))).message)
                .toContain('request.fee must be a safe integer');
        });

        it('in swap fundings', () => {
            const api = parser(SignSwapApi);
            /** @type {(amount: string, fee: string) => any} */
            const parse = (amount, fee) => api.parseHtlcFunding({
                from: SENDER,
                amount,
                fee,
                relay: RELAY,
            }, 'fund.request');

            expect(parse(MAX_SAFE, '10000').amount).toBe(MAX_SAFE);
            expect(() => parse(UNSAFE, '10000'))
                .toThrowError(Errors.InvalidRequestError, /fund\.request\.amount must be a safe integer/);
            expect(() => parse('1000000', UNSAFE))
                .toThrowError(Errors.InvalidRequestError, /fund\.request\.fee must be a safe integer/);
            // A zero amount cannot get past the zero check by leading zeros
            expect(() => parse('00', '10000')).toThrowError(Errors.InvalidRequestError, /must not be zero/);
        });

        it('in swap redeems', async () => {
            const api = parser(SignSwapApi);
            expect(() => api.parseHtlcRedeeming({ from: SENDER, fee: UNSAFE, relay: RELAY }, 'redeem.request'))
                .toThrowError(Errors.InvalidRequestError, /redeem\.request\.fee must be a safe integer/);

            expect((await errorOf(parseUsdcRedeemingSwap(2 ** 53))).message)
                .toContain('redeem.amount must be a safe integer');
            // Rejected only for the missing display data, which is checked after the redeeming amount
            expect((await errorOf(parseUsdcRedeemingSwap(Number.MAX_SAFE_INTEGER))).message)
                .not.toContain('redeem');
        });
    });

    describe('parses addresses into their checksum', () => {
        const SENDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
        const KEY_PATH = PolygonConstants.DEFAULT_DERIVATION_PATH;
        /** Spellings that ethers accepts, but the parsers must not */
        const INVALID = [
            ethers.utils.getIcapAddress(SENDER),
            SENDER.slice(2),
        ];

        /**
         * @param {string} address
         * @returns {string}
         */
        function upperCase(address) {
            return `0x${address.slice(2).toUpperCase()}`;
        }

        /**
         * TopLevelApi's constructor does not allow to run in a frame, and the parsers do not need it.
         *
         * @param {any} Api
         * @returns {any}
         */
        function parser(Api) {
            const api = Object.create(Api.prototype);
            spyOn(api, 'parseKeyId').and.returnValue(Promise.resolve({ type: Nimiq.Secret.Type.ENTROPY }));
            return api;
        }

        /**
         * @param {Promise<any>} parsing
         * @returns {Promise<Error>}
         */
        async function errorOf(parsing) {
            try {
                await parsing;
            } catch (error) {
                return /** @type {Error} */ (error);
            }
            throw new Error('Expected the request to be rejected');
        }

        /**
         * @param {string} from
         * @param {string} [relay]
         * @returns {Promise<any>}
         */
        function parseSettlement(from, relay = RELAY) {
            return parser(SignPolygonTransactionApi).parseRequest({
                appName: 'Test',
                keyId: 'key',
                keyLabel: 'Key',
                keyPath: KEY_PATH,
                operation: 'refund',
                token: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS.toLowerCase(),
                amount: '1000000',
                request: {
                    from,
                    id: ID,
                    target: from,
                    fee: '10000',
                    relay,
                },
            });
        }

        it('in settlements', async () => {
            for (const from of [SENDER, SENDER.toLowerCase(), upperCase(SENDER)]) {
                // eslint-disable-next-line no-await-in-loop
                const parsed = await parseSettlement(from, RELAY.toLowerCase());
                expect(parsed.token).toBe(CONFIG.NATIVE_USDC_CONTRACT_ADDRESS);
                expect(parsed.request.from).toBe(SENDER);
                expect(parsed.request.target).toBe(SENDER);
                expect(parsed.request.relay).toBe(RELAY);
            }

            for (const from of INVALID) {
                // eslint-disable-next-line no-await-in-loop
                const error = await errorOf(parseSettlement(from));
                expect(error instanceof Errors.InvalidRequestError).toBe(true);
                expect(error.message).toContain('request.from must be a valid Polygon address');
            }
            const error = await errorOf(parseSettlement(SENDER, ethers.utils.getIcapAddress(RELAY)));
            expect(error instanceof Errors.InvalidRequestError).toBe(true);
            expect(error.message).toContain('request.relay must be a valid Polygon address');
        });

        it('in swap fundings and redeems', () => {
            const api = parser(SignSwapApi);
            const funding = api.parseHtlcFunding({
                from: SENDER.toLowerCase(),
                amount: '1000000',
                fee: '10000',
                relay: upperCase(RELAY),
            }, 'fund.request');
            expect(funding.from).toBe(SENDER);
            expect(funding.relay).toBe(RELAY);

            const redeeming = api.parseHtlcRedeeming({
                from: upperCase(SENDER),
                fee: '10000',
                relay: RELAY.toLowerCase(),
            }, 'redeem.request');
            expect(redeeming.from).toBe(SENDER);
            expect(redeeming.relay).toBe(RELAY);

            for (const from of INVALID) {
                expect(() => api.parseHtlcFunding({ from, amount: '1000000', fee: '10000', relay: RELAY }, 'fund'))
                    .toThrowError(Errors.InvalidRequestError, /fund\.from must be a valid Polygon address/);
                expect(() => api.parseHtlcRedeeming({ from, fee: '10000', relay: RELAY }, 'redeem'))
                    .toThrowError(Errors.InvalidRequestError, /redeem\.from must be a valid Polygon address/);
            }
        });

        it('in the Polygon addresses of the slider layout', async () => {
            const nimAddress = new Nimiq.Address(new Uint8Array(20).fill(1)).toUserFriendlyAddress();
            /**
             * @param {string} from
             * @param {string} listed
             * @returns {Promise<any>}
             */
            const parse = (from, listed) => parser(SignSwapApi).parseRequest({
                appName: 'Test',
                keyId: 'key',
                swapId: 'swap',
                fund: {
                    type: 'USDC_MATIC',
                    keyPath: KEY_PATH,
                    request: { from, amount: '1000000', fee: '10000', relay: RELAY },
                    tokenNonce: 0,
                },
                redeem: {
                    type: 'NIM',
                    keyPath: 'm/44\'/242\'/0\'/0\'',
                    recipient: nimAddress,
                    value: 100000,
                    fee: 0,
                    validityStartHeight: 1,
                    recipientLabel: 'NIM',
                },
                fiatCurrency: 'eur',
                fundingFiatRate: 1,
                redeemingFiatRate: 1,
                fundFees: { processing: 0, redeeming: 0 },
                redeemFees: { funding: 0, processing: 0 },
                serviceSwapFee: 0,
                layout: 'slider',
                direction: 'left-to-right',
                nimiqAddresses: [{ address: nimAddress, balance: 0 }],
                bitcoinAccount: { balance: 0 },
                polygonAddresses: [{ address: listed, usdcBalance: 2000000, usdtBalance: 0 }],
            });

            for (const [from, listed] of [
                [SENDER.toLowerCase(), SENDER],
                [SENDER, SENDER.toLowerCase()],
                [upperCase(SENDER), SENDER.toLowerCase()],
            ]) {
                // eslint-disable-next-line no-await-in-loop
                const parsed = await parse(from, listed);
                expect(parsed.fund.request.from).toBe(SENDER);
                expect(parsed.polygonAddresses[0].address).toBe(SENDER);
            }

            const error = await errorOf(parse(SENDER, ethers.utils.getIcapAddress(SENDER)));
            expect(error instanceof Errors.InvalidRequestError).toBe(true);
            expect(error.message).toContain('polygonAddresses[0].address must be a valid Polygon address');
        });
    });

    describe('without a USDT contract', () => {
        const SENDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
        const KEY_PATH = PolygonConstants.DEFAULT_DERIVATION_PATH;
        const EUR_FUNDING = {
            type: 'EUR',
            amount: 1000,
            fee: 0,
            bankLabel: 'Bank',
        };

        /** @type {string} */
        let configuredUsdt;

        beforeEach(() => {
            configuredUsdt = CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS;
            CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS = '';
        });

        afterEach(() => {
            CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS = configuredUsdt;
        });

        /**
         * TopLevelApi's constructor does not allow to run in a frame, and the parsers do not need it.
         *
         * @param {any} fund
         * @param {any} redeem
         * @returns {Promise<Error>}
         */
        async function swapParsingError(fund, redeem) {
            /** @type {any} */
            const api = Object.create(SignSwapApi.prototype);
            spyOn(api, 'parseKeyId').and.returnValue(Promise.resolve({ type: Nimiq.Secret.Type.ENTROPY }));
            try {
                await api.parseRequest({
                    appName: 'Test',
                    keyId: 'key',
                    swapId: 'swap',
                    fund,
                    redeem,
                });
            } catch (error) {
                return /** @type {Error} */ (error);
            }
            throw new Error('Expected the request to be rejected');
        }

        it('has no USDT token address', () => {
            expect(() => PolygonGaslessHtlc.tokenAddress('USDT_MATIC')).toThrowError(Errors.InvalidRequestError);
            expect(PolygonGaslessHtlc.tokenAddress('USDC_MATIC')).toBe(CONFIG.NATIVE_USDC_CONTRACT_ADDRESS);
        });

        it('rejects swaps funded with USDT when parsing the request', async () => {
            const error = await swapParsingError({
                type: 'USDT_MATIC',
                keyPath: KEY_PATH,
                request: {
                    from: SENDER,
                    amount: '1000000',
                    fee: '10000',
                    relay: RELAY,
                },
                tokenNonce: 0,
            }, { type: 'NIM' });
            expect(error instanceof Errors.InvalidRequestError).toBe(true);
            expect(error.message).toContain('USDT_MATIC is not available');
        });

        it('rejects swaps that redeem USDT when parsing the request', async () => {
            const error = await swapParsingError(EUR_FUNDING, {
                type: 'USDT_MATIC',
                keyPath: KEY_PATH,
                request: {
                    from: SENDER,
                    fee: '10000',
                    relay: RELAY,
                },
                amount: 1000000,
            });
            expect(error instanceof Errors.InvalidRequestError).toBe(true);
            expect(error.message).toContain('USDT_MATIC is not available');
        });

        it('still accepts USDC in swaps', async () => {
            // Rejected only for the redeeming type, which is checked after the USDC funding
            const fundingError = await swapParsingError({
                type: 'USDC_MATIC',
                keyPath: KEY_PATH,
                request: {
                    from: SENDER,
                    amount: '1000000',
                    fee: '10000',
                    relay: RELAY,
                },
                tokenNonce: 0,
            }, { type: 'invalid' });
            expect(fundingError.message).toContain('Invalid redeeming type');

            // Rejected only for the missing display data, which is checked after the USDC redeeming
            const redeemingError = await swapParsingError(EUR_FUNDING, {
                type: 'USDC_MATIC',
                keyPath: KEY_PATH,
                request: {
                    from: SENDER,
                    fee: '10000',
                    relay: RELAY,
                },
                amount: 1000000,
            });
            expect(redeemingError.message).not.toContain('is not available');
            expect(redeemingError.message).not.toContain('redeem');
        });
    });
});
