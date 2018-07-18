describe('MnemonicPhrase', function() {
    var VECTORS = [
        /* 16 */ { key: new Uint8Array([ 104, 142, 17, 70, 140, 183, 251, 150, 83, 141, 245, 127, 181, 228, 86, 205 ]),
                   mnemonic: 'hammer identify faculty bonus leisure sleep evolve salt leisure quality between option' },
        /* 20 */ { key: new Uint8Array([ 247, 34, 33, 91, 36, 86, 30, 10, 34, 121, 46, 151, 62, 43, 229, 69, 157, 47, 145, 225 ]),
                   mnemonic: 'warm baby fine emerge giggle agree measure chair now vanish welcome menu spray similar lumber' },
        /* 24 */ { key: new Uint8Array([ 161, 10, 14, 35, 220, 165, 52, 255, 54, 91, 98, 29, 14, 117, 220, 160, 45, 219, 85, 110, 194, 251, 92, 228 ]),
                   mnemonic: 'patient expire material rich fashion legend sunny hobby brown inhale jaguar doctor tank primary roast garage friend celery' },
        /* 28 */ { key: new Uint8Array([ 40, 222, 71, 149, 226, 232, 97, 51, 82, 254, 105, 160, 108, 229, 165, 5, 250, 29, 229, 117, 218, 62, 116, 43, 144, 90, 17, 82 ]),
                   mnemonic: 'churn vendor tornado shift maid often episode snake parrot grunt harsh armor peace verify student elephant injury frame bird cargo canyon' },
        /* 32 */ { key: new Uint8Array([ 169, 203, 76, 129, 160, 230, 129, 141, 117, 240, 195, 239, 197, 18, 196, 30, 26, 52, 253, 1, 21, 81, 249, 22, 234, 115, 246, 14, 62, 197, 228, 223 ]),
                   mnemonic: 'prefer foil call dove gym shop style blur used chuckle rain destroy person leader affair pretty weekend resemble ostrich ugly token glass nature visa' }
    ];

    it('generates a mnemonic phrase from byte arrays', function() {
        VECTORS.forEach(vector => {
            expect(MnemonicPhrase.keyToMnemonic(vector.key)).toEqual(vector.mnemonic);
        });
    });

    it('recreates the correct key from mnemonic phrases', function() {
        VECTORS.forEach(vector => {
            expect(MnemonicPhrase.mnemonicToKey(vector.mnemonic)).toEqual(vector.key);
        });
    });

    it('fail on wrong word', function() {
        // changed last word to 'options'
        const wrong = 'hammer identify faculty bonus leisure sleep evolve salt leisure quality between options';
        expect(() => MnemonicPhrase.mnemonicToKey(wrong)).toThrowError();
    });

    it('fail when recovery words are not exactly 24 words', function() {
        // popped last byte
        const tooShort = 'prefer foil call dove gym shop style blur used chuckle rain destroy person leader affair pretty weekend resemble ostrich ugly token glass nature';
        // duplicated last byte
        const tooLong = 'prefer foil call dove gym shop style blur used chuckle rain destroy person leader affair pretty weekend resemble ostrich ugly token glass nature visa visa';
        expect(() => MnemonicPhrase.mnemonicToKey(tooShort)).toThrowError();
        expect(() => MnemonicPhrase.mnemonicToKey(tooLong)).toThrowError();
    });

    it('fail when key is not exactly 32 bytes long', function() {
        // popped last byte
        const tooShort = new Uint8Array([ 169, 203, 76, 129, 160, 230, 129, 141, 117, 240, 195, 239, 197, 18, 196, 30, 26, 52, 253, 1, 21, 81, 249, 22, 234, 115, 246, 14, 62, 197, 228 ]);
        // duplicated last byte
        const tooLong = new Uint8Array([ 169, 203, 76, 129, 160, 230, 129, 141, 117, 240, 195, 239, 197, 18, 196, 30, 26, 52, 253, 1, 21, 81, 249, 22, 234, 115, 246, 14, 62, 197, 228, 233, 233 ]);
        expect(() => MnemonicPhrase.keyToMnemonic(tooShort)).toThrowError();
        expect(() => MnemonicPhrase.keyToMnemonic(tooLong)).toThrowError();
    });
});
