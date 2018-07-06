describe('CookieJar', function () {
    /** @type {KeyInfo[]} */
    const KEYS = [
        {
            userFriendlyAddress: 'NQ60 DUNG SUCK PAPA K1UM XB4A MTLL A189 2N4C',
            type: 1
        },
        {
            userFriendlyAddress: 'NQ32 473Y R5T3 979R 325K S8UT 7E3A NRNS VBX2',
            type: 2
        },
        {
            userFriendlyAddress: 'NQ26 12H4 HMS0 RDNX 60XQ 171C SVVM X8AH B34F',
            type: 1
        },
    ];

    const COOKIE = '1by0NcZO6rqmHlfLIqu6UUFCRWIw2Icf8l2NJ05GIs9I5s7hqtm2ur8I1CKJI10DLbeMD2AnCzXe18hUVjI8';


    it('can encode keys', function() {
        expect(CookieJar._encodeCookie(KEYS)).toBe(COOKIE);
    });

    it('can decode a cookie', function() {
        const decoded = CookieJar._decodeCookie(COOKIE);
        expect(decoded).toEqual(KEYS);
    });
});
