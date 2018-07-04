describe("i18n test suite", function () {

    it("i18n dict has languages", function () {
        const languages = i18n.availableLanguages();
        expect(languages).not.toBeNull();
        expect(languages.length).toBeGreaterThan(0);
        expect(languages).not.toContain('');
    });

    it("i18n dict languages have labels", function () {
        for (const language of i18n.availableLanguages()) {
            expect(i18n._dict[language]).toBeDefined();
            expect(i18n._dict[language]._language).toBeDefined();
        }
    });

    it("i18n dict entries are complete", function () {
        const BASELINE = 'en';
        const english = i18n._dict[BASELINE];
        const languages = i18n.availableLanguages();
        for (const id in english) {
            for (const language of languages) {
                expect(i18n._dict[language][id]).toBeDefined();
            }
        }
    });
});
