describe("I18n", function () {

    beforeAll(() => {
        I18n.initialize(window.TRANSLATIONS, 'en');
    });

    it("dictionary has languages", function () {
        const languages = I18n.availableLanguages();
        expect(languages).not.toBeNull();
        expect(languages.length).toBeGreaterThan(0);
        expect(languages).not.toContain('');
    });

    it("dictionary languages have labels", function () {
        for (const language of I18n.availableLanguages()) {
            expect(I18n.dictionary[language]).toBeDefined();
            expect(I18n.dictionary[language]._language).toBeDefined();
        }
    });

    it("dictionary entries are complete", function () { // Checked by tools/translationValidator
        const BASELINE = 'en';
        const english = I18n.dictionary[BASELINE];
        const languages = I18n.availableLanguages();
        for (const id in english) {
            for (const language of languages) {
                expect(I18n.dictionary[language][id]).toBeDefined();
            }
        }
    });
});
