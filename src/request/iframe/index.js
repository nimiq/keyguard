/* global runKeyguard */
/* global IFrameApi */

runKeyguard(IFrameApi, {
    loadNimiq: true, // At least Nimiq.Address is used in all methods
    whitelist: [
        'list',
        'hasKeys',
        'deriveAddresses', // To derive addresses from paths of keys stored in SessionStorage after key import
        'releaseKey', // To remove a key from SessionStorage when account detection has finished
        'listLegacyAccounts', // deprecated
        'hasLegacyAccounts', // deprecated
        'migrateAccountsToKeys', // deprecated
    ],
});
