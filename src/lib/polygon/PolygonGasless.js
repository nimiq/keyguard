/* global CONFIG */
/* global Errors */
/* global NimiqGaslessCore */

/**
 * Gasless USDC and USDT0 transfers through the GaslessTransfer contract and the Nimiq relay,
 * see https://github.com/NimiqToolbox/gas-abstraction.
 *
 * The Keyguard pins the deployment itself and never takes contract, relay or token domain details from the
 * calling app. Typed data is always built here from validated fields.
 */
class PolygonGasless { // eslint-disable-line no-unused-vars
    /**
     * @returns {GaslessChainPins}
     */
    static pins() {
        if (PolygonGasless._pins) return PolygonGasless._pins;

        if (!CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS || !CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES.length) {
            throw new Errors.KeyguardError('Gasless Polygon transfers are not configured');
        }

        const chainId = CONFIG.POLYGON_CHAIN_ID;
        // Throws an InvalidPinsError on any inconsistency. On Polygon mainnet, the tokens must additionally equal the
        // SDK's frozen, mainnet-verified token constants.
        PolygonGasless._pins = NimiqGaslessCore.definePins({
            chainId,
            transfer: CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS,
            relays: CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES,
            tokens: [{
                symbol: 'USDC',
                address: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
                decimals: 6,
                authModes: ['permit', 'none'],
                domain: {
                    name: 'USD Coin',
                    version: '2',
                    chainId,
                    verifyingContract: /** @type {`0x${string}`} */ (CONFIG.NATIVE_USDC_CONTRACT_ADDRESS),
                },
            }, {
                symbol: 'USDT0',
                address: CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS,
                decimals: 6,
                authModes: ['permit', 'metaTxApprove', 'none'],
                domain: {
                    name: 'USDT0',
                    version: '1',
                    verifyingContract: /** @type {`0x${string}`} */ (CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS),
                    salt: NimiqGaslessCore.chainIdSalt(chainId),
                },
            }],
            maxFee: CONFIG.POLYGON_GASLESS_MAX_FEE,
        });
        return PolygonGasless._pins;
    }

    /**
     * @param {string} tokenAddress
     * @returns {'usdc' | 'usdt'}
     */
    static stablecoin(tokenAddress) {
        const token = NimiqGaslessCore.findPinnedToken(PolygonGasless.pins(), tokenAddress);
        if (!token) throw new Errors.InvalidRequestError('Unsupported token');
        return token.symbol === 'USDC' ? 'usdc' : 'usdt';
    }

    /**
     * @returns {number} Current unix time in seconds
     */
    static now() {
        return Math.floor(Date.now() / 1000);
    }
}

/** @type {GaslessChainPins | null} */
PolygonGasless._pins = null;
