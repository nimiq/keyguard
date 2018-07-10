describe('CookieJar', () => {
    it('can encode keys', () => {
        expect(CookieJar._encodeCookie(Dummy.keyInfo)).toBe(Dummy.keyInfoCookieEncoded);
    });

    it('can decode a cookie', () => {
        const decoded = CookieJar._decodeCookie(Dummy.keyInfoCookieEncoded);
        expect(decoded).toEqual(Dummy.keyInfo);
    });

    it('can be filled with key info', () => {
        spyOnProperty(document, 'cookie', 'set').and.callFake((/** @type {string} */ cookie) => {
            expect(cookie.includes(`k=${Dummy.keyInfoCookieEncoded}`)).toBe(true);
        });
        CookieJar.fill(Dummy.keyInfo);
    });

    it('can be eaten from', () => {
        spyOnProperty(document, 'cookie', 'get').and.returnValue(Dummy.cookie);
        const deprecatedAccountInfo = CookieJar.eat(/*listDeprecatedAccounts*/ true);
        expect(deprecatedAccountInfo).toEqual(Dummy.deprecatedAccountInfo);
        const keyInfo = CookieJar.eat();
        expect(keyInfo).toEqual(Dummy.keyInfo);
    });
});
