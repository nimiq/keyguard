/* global CONFIG */
/* global Errors */
/* global ethers */
/* global NimiqGaslessCore */
/* global PolygonGasless */

/**
 * Gasless USDC and USDT0 HTLCs for swaps: opening, redeeming and refunding through the GaslessHTLC contract and the
 * Nimiq relay, see https://github.com/NimiqToolbox/gas-abstraction.
 *
 * PROVISIONAL: the GaslessHTLC contract does not exist yet. The typed data mirrors the GaslessTransfer contract (the
 * shared EIP-712 domain version and the signed token authorization) and must be checked against the contract once it
 * is deployed. Unlike a transfer, an HTLC request carries no intent nonce: an HTLC id can only be opened once and
 * settled once, which already prevents replays.
 *
 * As for transfers, the typed data is always built here from validated fields, never taken from the calling app.
 */
/**
 * @callback PolygonGaslessHtlc.Sign
 * @param {ethers.TypedDataDomain} domain
 * @param {Record<string, ethers.TypedDataField[]>} types
 * @param {Record<string, any>} message
 * @returns {Promise<string>}
 */

class PolygonGaslessHtlc { // eslint-disable-line no-unused-vars
    /**
     * @returns {string}
     */
    static contract() {
        if (!CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS) {
            throw new Errors.KeyguardError('Gasless Polygon HTLCs are not configured');
        }
        return CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS;
    }

    /**
     * @returns {ethers.TypedDataDomain}
     */
    static domain() {
        return {
            name: PolygonGaslessHtlc.DOMAIN_NAME,
            version: PolygonGaslessHtlc.DOMAIN_VERSION,
            chainId: CONFIG.POLYGON_CHAIN_ID,
            verifyingContract: PolygonGaslessHtlc.contract(),
        };
    }

    /**
     * @param {'USDC_MATIC' | 'USDT_MATIC'} asset
     * @returns {string}
     */
    static tokenAddress(asset) {
        return asset === 'USDC_MATIC' ? CONFIG.NATIVE_USDC_CONTRACT_ADDRESS : CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS;
    }

    /**
     * Checks that the relay is a pinned relay and the fee is within the fee the user is asked to sign at most.
     *
     * @param {string} fee
     * @param {string} relay
     * @param {string} name
     */
    static checkFeeAndRelay(fee, relay, name) {
        const { relays } = PolygonGasless.pins();
        if (!relays.some(pinned => pinned.toLowerCase() === relay.toLowerCase())) {
            throw new Errors.InvalidRequestError(`${name}.relay is not a known relay`);
        }
        if (BigInt(fee) > BigInt(CONFIG.POLYGON_GASLESS_MAX_ACCEPTABLE_FEE)) {
            throw new Errors.InvalidRequestError(`${name}.fee is above the highest acceptable fee`);
        }
    }

    /**
     * The parameters of an HTLC in the HTLC data that the swap service proposes.
     *
     * @param {string} htlcData
     * @returns {PolygonHtlcData}
     */
    static decodeHtlcData(htlcData) {
        const { args, name } = new ethers.utils.Interface(PolygonGaslessHtlc.HTLC_DATA_ABI)
            .parseTransaction({ data: htlcData });
        if (name !== 'open') throw new Errors.InvalidRequestError('Invalid method in HTLC data');
        return {
            id: args.id,
            token: args.token,
            amount: args.amount.toString(),
            refundAddress: args.refundAddress,
            recipient: args.recipientAddress,
            hash: args.hash,
            timeout: args.timeout.toNumber(),
        };
    }

    /**
     * The token permit to sign first: the HTLC contract may take `amount + fee` from `from` until the deadline.
     *
     * @param {KeyguardRequest.PolygonHtlcOpenRequest} request
     * @param {number} tokenNonce
     * @returns {GaslessPermitTypedData}
     */
    static permitTypedData(request, tokenNonce) {
        const token = NimiqGaslessCore.findPinnedToken(PolygonGasless.pins(), request.token);
        if (!token) throw new Errors.InvalidRequestError('Unsupported token');
        return NimiqGaslessCore.buildPermitTypedData({
            tokenDomain: token.domain,
            owner: /** @type {`0x${string}`} */ (request.from),
            spender: /** @type {`0x${string}`} */ (PolygonGaslessHtlc.contract()),
            value: (BigInt(request.amount) + BigInt(request.fee)).toString(),
            nonce: tokenNonce.toString(),
            deadline: request.deadline,
        });
    }

    /**
     * @param {KeyguardRequest.PolygonHtlcOpenRequest} request
     * @param {KeyguardRequest.PolygonTokenPermit} authorization
     * @returns {PolygonTypedData}
     */
    static openTypedData(request, authorization) {
        return {
            domain: PolygonGaslessHtlc.domain(),
            types: PolygonGaslessHtlc.OPEN_TYPES,
            message: {
                token: request.token,
                from: request.from,
                id: request.id,
                recipient: request.recipient,
                amount: request.amount,
                hash: request.hash,
                timeout: request.timeout,
                fee: request.fee,
                relay: request.relay,
                deadline: request.deadline,
                auth: NimiqGaslessCore.tokenAuthMessage(/** @type {GaslessTokenAuthorization} */ (authorization)),
            },
        };
    }

    /**
     * @param {'redeem' | 'refund'} operation
     * @param {KeyguardRequest.PolygonHtlcSettlementRequest} request
     * @returns {PolygonTypedData}
     */
    static settlementTypedData(operation, request) {
        return {
            domain: PolygonGaslessHtlc.domain(),
            types: operation === 'redeem' ? PolygonGaslessHtlc.REDEEM_TYPES : PolygonGaslessHtlc.REFUND_TYPES,
            message: {
                from: request.from,
                id: request.id,
                target: request.target,
                fee: request.fee,
                relay: request.relay,
                deadline: request.deadline,
            },
        };
    }

    /**
     * Signs the permit, then the HTLC opening over it.
     *
     * @param {PolygonGaslessHtlc.Sign} sign
     * @param {KeyguardRequest.PolygonHtlcOpenRequest} request
     * @param {number} tokenNonce
     * @returns {Promise<KeyguardRequest.SignedPolygonHtlcOpen>}
     */
    static async signOpen(sign, request, tokenNonce) {
        const permit = PolygonGaslessHtlc.permitTypedData(request, tokenNonce);
        const tokenSignature = await sign(
            permit.domain,
            /** @type {Record<string, ethers.TypedDataField[]>} */ (/** @type {unknown} */ (permit.types)),
            permit.message,
        );
        // Validates the signature format and normalizes v to 27/28, as the opening signs it as it is
        const tokenAuthorization = NimiqGaslessCore.toTokenAuthorization('permit', tokenSignature);
        /** @type {KeyguardRequest.PolygonTokenPermit} */
        const authorization = {
            mode: 'permit',
            v: tokenAuthorization.v,
            r: tokenAuthorization.r,
            s: tokenAuthorization.s,
        };

        const open = PolygonGaslessHtlc.openTypedData(request, authorization);
        const signature = await sign(open.domain, open.types, open.message);
        return { request, signature, authorization };
    }

    /**
     * @param {PolygonGaslessHtlc.Sign} sign
     * @param {'redeem' | 'refund'} operation
     * @param {KeyguardRequest.PolygonHtlcSettlementRequest} request
     * @returns {Promise<KeyguardRequest.SignedPolygonHtlcSettlement>}
     */
    static async signSettlement(sign, operation, request) {
        const settlement = PolygonGaslessHtlc.settlementTypedData(operation, request);
        const signature = await sign(settlement.domain, settlement.types, settlement.message);
        return { request, signature };
    }
}

PolygonGaslessHtlc.DOMAIN_NAME = 'Nimiq Gasless HTLC';
PolygonGaslessHtlc.DOMAIN_VERSION = '3';

/**
 * The longest a signed redeem or refund stays valid when it is signed on its own, and the latest deadline of an
 * opening. A redeem signed when setting up a swap is valid until the HTLC times out.
 */
PolygonGaslessHtlc.MAX_DEADLINE_SECONDS = 2 * 60 * 60;

/** `from` is the refund address. It pays `amount` into the HTLC and `fee` to `relay`. */
PolygonGaslessHtlc.OPEN_TYPES = {
    HtlcOpen: [
        { name: 'token', type: 'address' },
        { name: 'from', type: 'address' },
        { name: 'id', type: 'bytes32' },
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'hash', type: 'bytes32' },
        { name: 'timeout', type: 'uint256' },
        { name: 'fee', type: 'uint256' },
        { name: 'relay', type: 'address' },
        { name: 'deadline', type: 'uint256' },
        { name: 'auth', type: 'TokenAuth' },
    ],
    TokenAuth: [
        { name: 'mode', type: 'uint8' },
        { name: 'v', type: 'uint8' },
        { name: 'r', type: 'bytes32' },
        { name: 's', type: 'bytes32' },
    ],
};

/**
 * `from` is the HTLC's recipient. The HTLC pays its amount minus `fee` to `target` and `fee` to `relay`. The secret is
 * not signed: the relay submits it, and the contract checks it against the HTLC's hash.
 */
PolygonGaslessHtlc.REDEEM_TYPES = {
    HtlcRedeem: [
        { name: 'from', type: 'address' },
        { name: 'id', type: 'bytes32' },
        { name: 'target', type: 'address' },
        { name: 'fee', type: 'uint256' },
        { name: 'relay', type: 'address' },
        { name: 'deadline', type: 'uint256' },
    ],
};

/** `from` is the HTLC's refund address. Only possible after the HTLC's timeout. */
PolygonGaslessHtlc.REFUND_TYPES = {
    HtlcRefund: [
        { name: 'from', type: 'address' },
        { name: 'id', type: 'bytes32' },
        { name: 'target', type: 'address' },
        { name: 'fee', type: 'uint256' },
        { name: 'relay', type: 'address' },
        { name: 'deadline', type: 'uint256' },
    ],
};

/**
 * The swap service proposes the HTLC as the call data of the former OpenGSN HTLC contract's `open`, which carries the
 * HTLC's parameters. Its `fee` is not used: the user signs the relay's fee.
 */
PolygonGaslessHtlc.HTLC_DATA_ABI = [
    'function open(bytes32 id, address token, uint256 amount, address refundAddress, address recipientAddress, bytes32 hash, uint256 timeout, uint256 fee)', // eslint-disable-line max-len
];
