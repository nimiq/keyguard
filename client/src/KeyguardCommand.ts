export enum KeyguardCommand {
    CREATE = 'create',
    REMOVE = 'remove-key',
    IMPORT = 'import',
    EXPORT = 'export',
    CHANGE_PASSWORD = 'change-password',
    SIGN_TRANSACTION = 'sign-transaction',
    SIGN_MULTISIG_TRANSACTION = 'sign-multisig-transaction',
    SIGN_MESSAGE = 'sign-message',
    CONNECT_ACCOUNT = 'connect',
    DERIVE_ADDRESS = 'derive-address',

    // Bitcoin
    SIGN_BTC_TRANSACTION = 'sign-btc-transaction',
    DERIVE_BTC_XPUB = 'derive-btc-xpub',

    // Polygon
    SIGN_POLYGON_TRANSACTION = 'sign-polygon-transaction',
    DERIVE_POLYGON_ADDRESS = 'derive-polygon-address',

    // Swap
    SIGN_SWAP = 'sign-swap',

    // Iframe requests
    LIST = 'list',
    HAS_KEYS = 'hasKeys',
    DERIVE_ADDRESSES = 'deriveAddresses',
    RELEASE_KEY = 'releaseKey',

    // SwapIframe requests
    SIGN_SWAP_TRANSACTIONS = 'signSwapTransactions',

    // Deprecated iframe requests
    LIST_LEGACY_ACCOUNTS = 'listLegacyAccounts',
    HAS_LEGACY_ACCOUNTS = 'hasLegacyAccounts',
    MIGRATE_ACCOUNTS_TO_KEYS = 'migrateAccountsToKeys',
}
