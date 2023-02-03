/* global ethers */
/* global TopLevelApi */
/* global SignPolygonTransaction */
/* global Errors */
/* global CONFIG */

/** @extends {TopLevelApi<KeyguardRequest.SignPolygonTransactionRequest>} */
class SignPolygonTransactionApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignPolygonTransactionRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignPolygonTransactionRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignPolygonTransactionRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = /** @type {string} */ (this.parseLabel(request.keyLabel, false, 'keyLabel'));
        parsedRequest.keyPath = this.parsePolygonPath(request.keyPath, 'keyPath');
        parsedRequest.transaction = this.parsePolygonTransaction(request);
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);

        return parsedRequest;
    }

    /**
     * @param {string} path
     * @param {string} name
     * @returns {string}
     */
    parsePolygonPath(path, name) {
        if (path.match(/^m(\/[0-9]+'?)*$/) === null) {
            throw new Errors.InvalidRequestError(`${name}: Invalid path`);
        }

        let stillHardened = true;

        // Overflow check.
        const segments = path.split('/');
        for (let i = 1; i < segments.length; i++) {
            if (parseInt(segments[i], 10) >= 0x80000000) {
                throw new Errors.InvalidRequestError(`${name}: Invalid segment ${segments[i]}`);
            }

            const isHardened = segments[i][segments[i].length - 1] === '\'';
            if (isHardened && !stillHardened) {
                throw new Errors.InvalidRequestError(`${name}: Invalid hardened segment after non-hardened segment`);
            }
            stillHardened = isHardened;
        }

        return path;
    }

    /**
     *
     * @param {KeyguardRequest.SignPolygonTransactionRequest} request
     * @returns {ParsedPolygonTransaction}
     */
    parsePolygonTransaction(request) {
        if (request.chainId !== CONFIG.POLYGON_CHAIN_ID) {
            throw new Errors.InvalidRequestError(`Unsupported chain ID, only ${CONFIG.POLYGON_CHAIN_ID} is supported`);
        }

        if (request.type !== 2) {
            throw new Errors.InvalidRequestError('Transaction type must be 2');
        }

        /** @type {string} */
        let data;
        if (typeof request.data === 'string') {
            if (!ethers.utils.isHexString(request.data)) {
                throw new Errors.InvalidRequestError('When a string, data must be HEX starting with 0x');
            }
            data = request.data.toLowerCase();
        } else if (!(request.data instanceof Uint8Array)) {
            throw new Errors.InvalidRequestError('data must be a string or Uint8Array');
        } else {
            data = ethers.utils.hexlify(request.data);
        }

        if (request.to.toLowerCase() !== CONFIG.USDC_CONTRACT_ADDRESS.toLowerCase()) {
            throw new Errors.InvalidRequestError('Transaction must interact with the USDC contract');
        }

        if (!data.substring(2).length) {
            throw new Errors.InvalidRequestError('Transaction must have data');
        }

        if (request.value !== 0) {
            throw new Errors.InvalidRequestError('Transaction must have 0 value');
        }

        const contract = new ethers.Contract(CONFIG.USDC_CONTRACT_ADDRESS, SignPolygonTransactionApi.USDC_CONTRACT_ABI);
        try {
            const description = contract.interface.parseTransaction({ data, value: request.value });
            if (!description) {
                throw new Error('Requested contract method not found');
            }
        } catch (error) {
            throw new Errors.InvalidRequestError(`Cannot decode data: ${error.message}`);
        }

        return {
            from: ethers.utils.getAddress(request.from),
            to: ethers.utils.getAddress(request.to),
            nonce: this.parsePositiveInteger(request.nonce, true, 'nonce'),
            data,
            value: ethers.BigNumber.from(request.value),
            chainId: request.chainId,
            type: request.type,
            accessList: request.accessList || [],
            gasLimit: ethers.BigNumber.from(request.gasLimit),
            maxFeePerGas: ethers.BigNumber.from(request.maxFeePerGas),
            maxPriorityFeePerGas: ethers.BigNumber.from(request.maxPriorityFeePerGas),

            customData: {},
            ccipReadEnabled: false,
        };
    }

    get Handler() {
        return SignPolygonTransaction;
    }
}

SignPolygonTransactionApi.USDC_CONTRACT_ABI = [
    // 'constructor()',
    // 'event Approval(address indexed owner, address indexed spender, uint256 value)',
    // 'event MetaTransactionExecuted(address userAddress, address relayerAddress, bytes functionSignature)',
    // 'event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)',
    // 'event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)',
    // 'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)',
    // 'event Transfer(address indexed from, address indexed to, uint256 value)',
    // 'function CHILD_CHAIN_ID() view returns (uint256)',
    // 'function CHILD_CHAIN_ID_BYTES() view returns (bytes)',
    // 'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
    // 'function DEPOSITOR_ROLE() view returns (bytes32)',
    // 'function ERC712_VERSION() view returns (string)',
    // 'function ROOT_CHAIN_ID() view returns (uint256)',
    // 'function ROOT_CHAIN_ID_BYTES() view returns (bytes)',
    // 'function allowance(address owner, address spender) view returns (uint256)',
    // 'function approve(address spender, uint256 amount) returns (bool)',
    // 'function balanceOf(address account) view returns (uint256)',
    // 'function decimals() view returns (uint8)',
    // 'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',
    // 'function deposit(address user, bytes depositData)',
    // eslint-disable-next-line max-len
    // 'function executeMetaTransaction(address userAddress, bytes functionSignature, bytes32 sigR, bytes32 sigS, uint8 sigV) payable returns (bytes)',
    // 'function getChainId() pure returns (uint256)',
    // 'function getDomainSeperator() view returns (bytes32)',
    // 'function getNonce(address user) view returns (uint256 nonce)',
    // 'function getRoleAdmin(bytes32 role) view returns (bytes32)',
    // 'function getRoleMember(bytes32 role, uint256 index) view returns (address)',
    // 'function getRoleMemberCount(bytes32 role) view returns (uint256)',
    // 'function grantRole(bytes32 role, address account)',
    // 'function hasRole(bytes32 role, address account) view returns (bool)',
    // 'function increaseAllowance(address spender, uint256 addedValue) returns (bool)',
    // 'function initialize(string name_, string symbol_, uint8 decimals_, address childChainManager)',
    // 'function name() view returns (string)',
    // 'function renounceRole(bytes32 role, address account)',
    // 'function revokeRole(bytes32 role, address account)',
    // 'function symbol() view returns (string)',
    // 'function totalSupply() view returns (uint256)',
    'function transfer(address recipient, uint256 amount) returns (bool)',
    // 'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
    // 'function withdraw(uint256 amount)',
];

// SignPolygonTransactionApi.OPENGSN_CONTRACT_ABI = [];
