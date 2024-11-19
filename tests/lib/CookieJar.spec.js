/* global Dummy */
/* global CookieJar */

describe('CookieJar', () => {
    it('can encode keys', () => {
        expect(CookieJar._encodeKeysCookie(Dummy.keyInfos())).toBe(Dummy.keyInfoCookieEncoded);
    });

    it('can decode a cookie', () => {
        const decoded = CookieJar._decodeKeysCookie(Dummy.keyInfoCookieEncoded);

        const expected = Dummy.cookieKeyInfos();
        for (let i = 0; i < Math.max(decoded.length, expected.length); i++) {
            expect(decoded[i].equals(expected[i])).toBe(true);
        }
    });

    it('can be filled with key info', () => {
        /** @type {string} */
        let cookies = '';
        spyOnProperty(document, 'cookie', 'set').and.callFake((/** @type {string} */ cookie) => {
            expect(cookie.startsWith(`k=${Dummy.keyInfoCookieEncoded};`)).toBe(true);
            cookies = `${cookies ? `${cookies}; ` : ''}${cookie.split(';')[0]}`;
        });
        spyOnProperty(document, 'cookie', 'get').and.callFake(() => cookies);
        CookieJar.fillKeys(Dummy.keyInfos());
    });

    it('can be eaten from', () => {
        spyOnProperty(document, 'cookie', 'get').and.returnValue(Dummy.cookie);
        const deprecatedAccountInfo = CookieJar.eatDeprecatedAccounts();
        expect(deprecatedAccountInfo).toEqual(Dummy.deprecatedAccountInfos);
        const keyInfo = CookieJar.eatKeys();

        const expected = Dummy.cookieKeyInfos();
        for (let i = 0; i < Math.max(keyInfo.length, expected.length); i++) {
            expect(keyInfo[i].equals(expected[i])).toBe(true);
        }
    });
});
