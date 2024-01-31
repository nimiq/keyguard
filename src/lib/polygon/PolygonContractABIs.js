/* eslint-disable max-len */
const PolygonContractABIs = { // eslint-disable-line no-unused-vars
    USDC_CONTRACT_ABI: [
        'function approve(address spender, uint256 amount) returns (bool)',
    ],

    USDC_HTLC_CONTRACT_ABI: [
        'function open(bytes32 id, address token, uint256 amount, address refundAddress, address recipientAddress, bytes32 hash, uint256 timeout, uint256 fee)',
        'function openWithApproval(bytes32 id, address token, uint256 amount, address refundAddress, address recipientAddress, bytes32 hash, uint256 timeout, uint256 fee, uint256 approval, bytes32 sigR, bytes32 sigS, uint8 sigV)',
        'function redeem(bytes32 id, address target, bytes32 secret, uint256 fee)',
        'function redeemWithSecretInData(bytes32 id, address target, uint256 fee)',
        'function refund(bytes32 id, address target, uint256 fee)',
    ],

    NATIVE_USDC_CONTRACT_ABI: [],

    NATIVE_USDC_TRANSFER_CONTRACT_ABI: [
        'function transfer(address token, uint256 amount, address target, uint256 fee)',
        'function transferWithPermit(address token, uint256 amount, address target, uint256 fee, uint256 value, bytes32 sigR, bytes32 sigS, uint8 sigV)',
    ],

    SWAP_CONTRACT_ABI: [
        'function swap(address token, uint256 amount, address pool, uint256 targetAmount, uint256 fee)',
        'function swapWithApproval(address token, uint256 amount, address pool, uint256 targetAmount, uint256 fee, uint256 approval, bytes32 sigR, bytes32 sigS, uint8 sigV)',
    ],
};
/* eslint-enable max-len */
