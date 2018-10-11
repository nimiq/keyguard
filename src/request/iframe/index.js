/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: false,
    whitelist: [
        'list',
        'migrateAccountsToKeys',
        'derivePaths', // To derive paths from keys stored in SessionStorage after key import
        'releaseKey', // To remove a key from SessionStorage when account detection has finished
    ],
});
