/* global TopLevelApi */

describe("TopLevelApi", function () {

    fit("can detect migration cookie", function () {
        console.log("Existing cookies:", document.cookie);

        expect(TopLevelApi._hasMigrateFlag()).toBe(false);

        // Set migrate cookie
        document.cookie = 'migrate=1;max-age=31536000';

        expect(TopLevelApi._hasMigrateFlag()).toBe(true);

        // Delete migrate cookie
        document.cookie = 'migrate=0; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        expect(TopLevelApi._hasMigrateFlag()).toBe(false);
    });
});
