describe('AddressUtils', function() {
    it('can format addresses correctly', function() {
        const ADDRESS = 'NQ70 21SY 835N V68Y Q2AH K64A UA7G BJBC DB70';

        expect(AddressUtils.formatAddress('NQ7021SY835NV68YQ2AHK64AUA7GBJBCDB70')).toBe(ADDRESS);
        expect(AddressUtils.formatAddress('nq7021sy835nv68yq2ahk64auA7gbjbcdb70')).toBe(ADDRESS);
        expect(AddressUtils.formatAddress('  NQ7021SY 835nv68y Q2AHK64A ua7gbjbc DB70  ')).toBe(ADDRESS);
    });

    it('can validate addresses', function() {
        // Valid addresses
        expect(AddressUtils.isValidAddress('NQ70 21SY 835N V68Y Q2AH K64A UA7G BJBC DB70')).toBe(true);
        expect(AddressUtils.isValidAddress('NQ7021SY835NV68YQ2AHK64AUA7GBJBCDB70')).toBe(true);
        expect(AddressUtils.isValidAddress('nq7021sy835nv68yq2ahk64auA7gbjbcdb70')).toBe(true);
        expect(AddressUtils.isValidAddress('  NQ7021SY 835nv68y Q2AHK64A ua7gbjbc DB70  ')).toBe(true);

        // Invalid addressses
        expect(AddressUtils.isValidAddress('21SY 835N V68Y Q2AH K64A UA7G BJBC DB70')).toBe(false);
        expect(AddressUtils.isValidAddress('NQ71 21SY 835N V68Y Q2AH K64A UA7G BJBC DB70')).toBe(false);
        expect(AddressUtils.isValidAddress('NQAB 21SY 835N V68Y Q2AH K64A UA7G BJBC DB70')).toBe(false);
        expect(AddressUtils.isValidAddress('NQ70 2ISY 835N V68Y Q2AH K64A UA7G BJBC DB70')).toBe(false);
        expect(AddressUtils.isValidAddress('NQ70 21SY 835N V68Y Q2AH K64A UA7G BJBC')).toBe(false);
    });
});
