const SignMessageConstants = {
    SIGN_MSG_PREFIX: 'Nimiq Signed Message:\n',
};

// 'export' to client via side effects
window.__messageSigningPrefix = {
    MSG_PREFIX: SignMessageConstants.SIGN_MSG_PREFIX,
};
