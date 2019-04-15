const SignMessageConstants = {
    SIGN_MSG_PREFIX: '\x16Nimiq Signed Message:\n',
};

// 'export' to client via side effects
window.__messageSigningPrefix = {
    MSG_PREFIX: SignMessageConstants.SIGN_MSG_PREFIX,
};
