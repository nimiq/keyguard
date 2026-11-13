/* global CONFIG */
/* global Errors */
/* global ethers */

/**
 * Gasless USDC and USDT0 transfers through the GaslessTransfer contract and the Nimiq relay, see
 * https://github.com/NimiqToolbox/gas-abstraction.
 *
 * The Keyguard pins the deployment in its config and never takes contract, relay or token domain details from the
 * calling app. Typed data is always built here from validated fields.
 */
class PolygonGasless { // eslint-disable-line no-unused-vars
    /**
     * @returns {string}
     */
    static contract() {
        if (!CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS || !CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES.length) {
            throw new Errors.KeyguardError('Gasless Polygon transfers are not configured');
        }
        return CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS;
    }

    /**
     * @param {string} tokenAddress
     * @returns {'usdc' | 'usdt'}
     */
    static stablecoin(tokenAddress) {
        // A token that is not available on this network has an empty address in the config, which must not match.
        if (!tokenAddress) throw new Errors.InvalidRequestError('Unsupported token');

        switch (tokenAddress.toLowerCase()) {
            case CONFIG.NATIVE_USDC_CONTRACT_ADDRESS.toLowerCase(): return 'usdc';
            case CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS.toLowerCase(): return 'usdt';
            default: throw new Errors.InvalidRequestError('Unsupported token');
        }
    }

    /**
     * @returns {number} Current unix time in seconds
     */
    static now() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * Checks that the relay is a pinned relay and the fee is within the fee the user is asked to sign at most. The
     * contracts do not cap the fee.
     *
     * @param {string} fee
     * @param {string} relay
     * @param {string} name
     */
    static checkFeeAndRelay(fee, relay, name) {
        if (!CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES.some(pinned => pinned.toLowerCase() === relay.toLowerCase())) {
            throw new Errors.InvalidRequestError(`${name}.relay is not a known relay`);
        }
        if (BigInt(fee) > BigInt(CONFIG.POLYGON_GASLESS_MAX_ACCEPTABLE_FEE)) {
            throw new Errors.InvalidRequestError(`${name}.fee is above the highest acceptable fee`);
        }
    }

    /**
     * Whether tokens sent to the address would be lost: the zero address, the tokens and Nimiq's contracts.
     *
     * @param {string} address
     * @returns {boolean}
     */
    static isDeniedRecipient(address) {
        return [
            ethers.constants.AddressZero,
            CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS,
            CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS,
            ...CONFIG.POLYGON_GASLESS_DENIED_RECIPIENTS,
        ].some(denied => denied.toLowerCase() === address.toLowerCase());
    }

    /**
     * The signed authorization as the contracts include it in their typed data.
     *
     * @param {KeyguardRequest.PolygonTokenPermit} authorization
     * @returns {{mode: number, v: number, r: string, s: string}}
     */
    static tokenAuthMessage(authorization) {
        return {
            mode: PolygonGasless.AUTH_MODE_PERMIT,
            v: authorization.v,
            r: authorization.r,
            s: authorization.s,
        };
    }

    /**
     * @param {KeyguardRequest.PolygonGaslessTransferRequest} request
     * @param {KeyguardRequest.PolygonTokenPermit} authorization
     * @returns {PolygonTypedData}
     */
    static transferTypedData(request, authorization) {
        return {
            domain: {
                name: PolygonGasless.DOMAIN_NAME,
                version: PolygonGasless.DOMAIN_VERSION,
                chainId: CONFIG.POLYGON_CHAIN_ID,
                verifyingContract: PolygonGasless.contract(),
            },
            types: PolygonGasless.TRANSFER_TYPES,
            message: {
                token: request.token,
                from: request.from,
                to: request.to,
                amount: request.amount,
                fee: request.fee,
                relay: request.relay,
                nonce: request.nonce,
                deadline: request.deadline,
                auth: PolygonGasless.tokenAuthMessage(authorization),
            },
        };
    }
}

PolygonGasless.DOMAIN_NAME = 'Nimiq Gasless Transfer';
PolygonGasless.DOMAIN_VERSION = '3';

/**
 * How long a transfer stays valid after the user confirmed it, by the device's clock. The relay refuses a transfer
 * that has less than a minute left when it arrives, and accepts deadlines up to 2 hours ahead. 5 minutes leave room for
 * a device clock that is a few minutes slow, while a payment that does not execute is decided soon.
 */
PolygonGasless.DEADLINE_SECONDS = 5 * 60;

/** The contracts' TokenAuth mode for a permit. The other modes, 0 for none and 2 for META_TX, are not used here. */
PolygonGasless.AUTH_MODE_PERMIT = 1;

/** `from` pays `amount` to `to` and `fee` to `relay`. */
PolygonGasless.TRANSFER_TYPES = {
    GaslessTransfer: [
        { name: 'token', type: 'address' },
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'fee', type: 'uint256' },
        { name: 'relay', type: 'address' },
        { name: 'nonce', type: 'uint256' },
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
