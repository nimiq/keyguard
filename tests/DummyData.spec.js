const Dummy = {};

/** @type {AccountInfo[]} */
Dummy.deprecatedAccountInfo = [
    {
        userFriendlyAddress: 'NQ60 DUNG SUCK PAPA K1UM XB4A MTLL A189 2N4C',
        type: 'low',
        label: 'An account'
    },
    {
        userFriendlyAddress: 'NQ32 473Y R5T3 979R 325K S8UT 7E3A NRNS VBX2',
        type: 'high',
        label: 'Another account'
    }
];

/** @type {KeyInfo[]} */
Dummy.keyInfo = [
    {
        userFriendlyAddress: 'NQ60 DUNG SUCK PAPA K1UM XB4A MTLL A189 2N4C',
        type: /** @type {1 | 2} */ (1)
    },
    {
        userFriendlyAddress: 'NQ32 473Y R5T3 979R 325K S8UT 7E3A NRNS VBX2',
        type: /** @type {1 | 2} */ (2)
    },
    {
        userFriendlyAddress: 'NQ26 12H4 HMS0 RDNX 60XQ 171C SVVM X8AH B34F',
        type: /** @type {1 | 2} */ (1)
    }
];

Dummy.keyInfoCookieEncoded = '1by0NcZO6rqmHlfLIqu6UUFCRWIw2Icf8l2NJ05GIs9I5s7hqtm2ur8I1CKJI10DLbeMD2AnCzXe18hUVjI8';

/** @type {string} */
Dummy.cookie = `k=${Dummy.keyInfoCookieEncoded};accounts=${JSON.stringify(Dummy.deprecatedAccountInfo)};some=thing;`;

Dummy.DATABASE_ID = 'keyguard-dummy-database';

