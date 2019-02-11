/* global Dummy */
/* global CookieJar */

describe('CookieJar', () => {
    it('can encode keys', () => {
        expect(CookieJar._encodeCookie(Dummy.keyInfos)).toBe(Dummy.keyInfoCookieEncoded);
    });

    it('can decode a cookie', () => {
        const decoded = CookieJar._decodeCookie(Dummy.keyInfoCookieEncoded);
        expect(decoded).toEqual(Dummy.keyInfos);
    });

    it('can be filled with key info', () => {
        spyOnProperty(document, 'cookie', 'set').and.callFake((/** @type {string} */ cookie) => {
            expect(cookie.valueOf().substr(0, Dummy.keyInfoCookieEncoded.length + 2)).toEqual(`k=${Dummy.keyInfoCookieEncoded}`);
        });
        CookieJar.fill(Dummy.keyInfos);
    });

    it('can be eaten from', () => {
        spyOnProperty(document, 'cookie', 'get').and.returnValue(Dummy.cookie);
        const deprecatedAccountInfo = CookieJar.eat(/*listDeprecatedAccounts*/ true);
        expect(deprecatedAccountInfo).toEqual(Dummy.deprecatedAccountInfos);
        let keyInfo = CookieJar.eat();
        keyInfo = keyInfo.map(/** @param {KeyInfo} x */(x) => ({ ...x, encrypted: true });
        expect(keyInfo).toEqual(Dummy.keyInfos);
    });
});
