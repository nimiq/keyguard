/* global CONFIG */
/* global Errors */
/* global ethers */
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
        const address = asset === 'USDC_MATIC'
            ? CONFIG.NATIVE_USDC_CONTRACT_ADDRESS
            : CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS;
        if (!address) throw new Errors.InvalidRequestError(`${asset} is not available on this network`);
        return address;
    }

    /**
     * The deadline of an opening, set when the user confirms the swap. The permit gets signed then, and the contract
     * uses the same deadline for the permit and the opening. It depends on the other side of the swap: an opening only
     * has to wait for long if that side is Bitcoin.
     *
     * @param {'NIM' | 'BTC' | 'USDC_MATIC' | 'USDT_MATIC' | 'EUR'} redeemAsset
     * @returns {number}
     */
    static openingDeadline(redeemAsset) {
        return PolygonGasless.now() + (redeemAsset === 'BTC'
            ? PolygonGaslessHtlc.BTC_OPENING_DEADLINE_SECONDS
            : PolygonGaslessHtlc.OPENING_DEADLINE_SECONDS);
    }

    /**
     * Checks an opening's deadline once the HTLC is known: it must still leave the relay enough time, and must not be
     * after the HTLC's timeout, as opening the HTLC later is of no use.
     *
     * @param {number} deadline
     * @param {number} htlcTimeout
     */
    static checkOpeningDeadline(deadline, htlcTimeout) {
        if (deadline < PolygonGasless.now() + PolygonGasless.MIN_DEADLINE_SECONDS) {
            throw new Errors.InvalidRequestError('The deadline of the HTLC opening has passed');
        }
        if (htlcTimeout < deadline) {
            throw new Errors.InvalidRequestError('The funding HTLC times out before the deadline of its opening');
        }
    }

    /**
     * A redeem signed when setting up a swap has the HTLC's timeout as its deadline, as redeeming is only possible
     * until then. This timeout comes from the request and is not checked against the HTLC on-chain.
     *
     * @param {number} htlcTimeout
     */
    static checkRedeemTimeout(htlcTimeout) {
        if (htlcTimeout <= PolygonGasless.now()) {
            throw new Errors.InvalidRequestError('The redeeming HTLC has timed out already');
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
                auth: PolygonGasless.tokenAuthMessage(authorization),
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
     * Signs the HTLC opening over the permit, which got signed when the user confirmed the swap.
     *
     * @param {PolygonGaslessHtlc.Sign} sign
     * @param {KeyguardRequest.PolygonHtlcOpenRequest} request
     * @param {KeyguardRequest.PolygonTokenPermit} authorization
     * @returns {Promise<KeyguardRequest.SignedPolygonHtlcOpen>}
     */
    static async signOpen(sign, request, authorization) {
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

/** How long an opening stays valid after the user confirmed the swap. */
PolygonGaslessHtlc.OPENING_DEADLINE_SECONDS = 5 * 60;

/**
 * The same for a swap to Bitcoin. In the worst case, the opening has to wait for a Bitcoin block. If that block takes
 * longer than this, the swap is abandoned.
 */
PolygonGaslessHtlc.BTC_OPENING_DEADLINE_SECONDS = 30 * 60;

/**
 * The longest a signed redeem or refund stays valid when it is signed on its own. A redeem signed when setting up a
 * swap is valid until the HTLC times out.
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
