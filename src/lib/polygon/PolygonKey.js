/* global Nimiq */
/* global Errors */
/* global ethers */
/* global CONFIG */

class PolygonKey { // eslint-disable-line no-unused-vars
    /**
     * @param {Key} key
     */
    constructor(key) {
        if (key.type !== Nimiq.Secret.Type.ENTROPY) {
            throw new Errors.KeyguardError('Key must be of type Nimiq.Entropy');
        }
        this._key = key;
    }

    /**
     * @param {string} path
     * @returns {string}
     */
    deriveAddress(path) {
        const wallet = this.deriveKeyPair(path);
        return wallet.address;
    }

    /**
     * @param {string} path
     * @param {ethers.providers.TransactionRequest} transaction
     * @returns {Promise<string>}
     */
    async sign(path, transaction) {
        const wallet = this.deriveKeyPair(path);
        return wallet.signTransaction(transaction);
    }

    /**
     *
     * @param {string} path
     * @param {ethers.TypedDataDomain} domain
     * @param {Record<string, Array<ethers.TypedDataField>>} types
     * @param {Record<string, any>} value
     * @returns {Promise<string>}
     */
    async signTypedData(path, domain, types, value) {
        const wallet = this.deriveKeyPair(path);
        return wallet._signTypedData(domain, types, value);
    }

    /**
     * @param {string} path
     * @param {string} spenderAddress
     * @param {string} approvalAmount
     * @param {number} tokenNonce
     * @param {string} ownerAddress
     * @param {string} deadline
     * @returns {Promise<{sigR: string, sigS: string, sigV: number}>}
     */
    async signUsdcPermit(path, spenderAddress, approvalAmount, tokenNonce, ownerAddress, deadline) {
        const domain = {
            name: CONFIG.NATIVE_USDC_DOMAIN_NAME, // The token's `name()`, which differs between testnet and mainnet
            version: '2', // This is currently the same for testnet and mainnet
            verifyingContract: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            chainId: CONFIG.POLYGON_CHAIN_ID,
        };

        const types = {
            Permit: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };

        const message = {
            owner: ownerAddress,
            spender: spenderAddress,
            value: approvalAmount,
            nonce: tokenNonce.toString(),
            deadline,
        };

        const signature = await this.signTypedData(
            path,
            domain,
            types,
            message,
        );

        return this._signatureToParts(signature);
    }

    /**
     * @param {string} path
     * @param {string} spenderAddress
     * @param {string} approvalAmount
     * @param {number} tokenNonce
     * @param {string} ownerAddress
     * @param {string} deadline
     * @returns {Promise<{sigR: string, sigS: string, sigV: number}>}
     */
    async signUsdtPermit(path, spenderAddress, approvalAmount, tokenNonce, ownerAddress, deadline) {
        const domain = {
            name: 'USDT0', // This is the same for the mainnet token and the mock USDT0 of the Amoy deployment
            version: '1', // This is the same for the mainnet token and the mock USDT0 of the Amoy deployment
            verifyingContract: CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS,
            salt: ethers.utils.hexZeroPad(ethers.utils.hexlify(CONFIG.POLYGON_CHAIN_ID), 32),
        };

        const types = {
            Permit: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };

        const message = {
            owner: ownerAddress,
            spender: spenderAddress,
            value: approvalAmount,
            nonce: tokenNonce.toString(),
            deadline,
        };

        const signature = await this.signTypedData(
            path,
            domain,
            types,
            message,
        );

        return this._signatureToParts(signature);
    }

    /**
     * @param {string} path
     * @param {Uint8Array} message - A byte array
     * @throws
     */
    signMessage(path, message) { // eslint-disable-line no-unused-vars
        throw new Errors.KeyguardError('signMessage is not implemented for Polygon keys');
    }

    /**
     * @param {string} path
     * @returns {ethers.Wallet}
     */
    deriveKeyPair(path) {
        const mnemonic = Nimiq.MnemonicUtils.entropyToMnemonic(this.secret);
        return ethers.Wallet.fromMnemonic(mnemonic.join(' '), path);
    }

    /**
     * @returns {Key}
     */
    key() {
        return this._key;
    }

    /**
     * @param {string} signature
     * @returns {{sigR: string, sigS: string, sigV: number}}
     */
    _signatureToParts(signature) {
        const sigR = signature.slice(0, 66); // 0x prefix plus 32 bytes = 66 characters
        const sigS = `0x${signature.slice(66, 130)}`; // 32 bytes = 64 characters
        const sigV = parseInt(signature.slice(130, 132), 16); // last byte = 2 characters

        return { sigR, sigS, sigV };
    }

    /**
     * @type {string}
     */
    get id() {
        return this._key.id;
    }

    /**
     * @type {Nimiq.Entropy}
     */
    get secret() {
        return /** @type {Nimiq.Entropy} */ (this._key.secret);
    }

    /**
     * @type {Nimiq.Secret.Type}
     */
    get type() {
        return this._key.secret instanceof Nimiq.PrivateKey
            ? Nimiq.Secret.Type.PRIVATE_KEY
            : Nimiq.Secret.Type.ENTROPY;
    }
}
