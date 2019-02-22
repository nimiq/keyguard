/* global Dummy */
/* global CookieJar */

describe('CookieJar', () => {
    it('can encode keys', () => {
        expect(CookieJar._encodeCookie(Dummy.keyInfos)).toBe(Dummy.keyInfoCookieEncoded);
    });

    it('can decode a cookie', () => {
        const decoded = CookieJar._decodeCookie(Dummy.keyInfoCookieEncoded);
        expect(decoded).toEqual(Dummy.cookieKeyInfos);
    });

    it('can be filled with key info', () => {
        spyOnProperty(document, 'cookie', 'set').and.callFake((/** @type {string} */ cookie) => {
            const cookieValue = cookie.split(';')[0];
            expect(cookieValue).toEqual(`k=${Dummy.keyInfoCookieEncoded}`);
        });
        CookieJar.fill(Dummy.keyInfos);
    });

    it('can be eaten from', () => {
        spyOnProperty(document, 'cookie', 'get').and.returnValue(Dummy.cookie);
        const deprecatedAccountInfo = CookieJar.eatDeprecated();
        expect(deprecatedAccountInfo).toEqual(Dummy.deprecatedAccountInfos);
        const keyInfo = CookieJar.eat();
        expect(keyInfo).toEqual(Dummy.cookieKeyInfos);
    });
});
