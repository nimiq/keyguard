export enum KeyguardCommand {
    CREATE = 'create',
    REMOVE = 'remove-key',
    IMPORT = 'import',
    EXPORT = 'export',
    CHANGE_PASSPHRASE = 'change-passphrase',
    SIGN_TRANSACTION = 'sign-transaction',
    DERIVE_ADDRESS = 'derive-address',

    // Iframe requests
    LIST = 'list',
    HAS_KEYS = 'hasKeys',
    DERIVE_ADDRESSES = 'deriveAddresses',
    RELEASE_KEY = 'releaseKey',

    // Deprecated iframe requests
    LIST_LEGACY_ACCOUNTS = 'listLegacyAccounts',
    HAS_LEGACY_ACCOUNTS = 'hasLegacyAccounts',
    MIGRATE_ACCOUNTS_TO_KEYS = 'migrateAccountsToKeys',
}
