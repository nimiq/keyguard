describe("i18n test suite", function () {

    const i18n = new I18n(TRANSLATIONS);

    it("i18n dict has languages", function () {
        const languages = i18n.availableLanguages();
        expect(languages).not.toBeNull();
        expect(languages.length).toBeGreaterThan(0);
        expect(languages).not.toContain('');
    });

    it("i18n dict languages have labels", function () {
        for (const language of i18n.availableLanguages()) {
            expect(i18n.dictionary[language]).toBeDefined();
            expect(i18n.dictionary[language]._language).toBeDefined();
        }
    });

    it("i18n dict entries are complete", function () {
        const BASELINE = 'en';
        const english = i18n.dictionary[BASELINE];
        const languages = i18n.availableLanguages();
        for (const id in english) {
            for (const language of languages) {
                expect(i18n.dictionary[language][id]).toBeDefined();
            }
        }
    });
});
