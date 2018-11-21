export enum KeyguardCommand {
    CREATE = 'create',
    REMOVE = 'remove-key',
    IMPORT = 'import',
    EXPORT_WORDS = 'export-words',
    EXPORT_FILE = 'export-file',
    EXPORT = 'export',
    CHANGE_PASSPHRASE = 'change-passphrase',
    SIGN_TRANSACTION = 'sign-transaction',
    SIGN_MESSAGE = 'sign-message',
    DERIVE_ADDRESS = 'derive-address',

    // Iframe requests
    LIST = 'list',
    MIGRATE_ACCOUNTS_TO_KEYS = 'migrateAccountsToKeys',
    DERIVE_ADDRESSES = 'deriveAddresses',
    RELEASE_KEY = 'releaseKey',
}
