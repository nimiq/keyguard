describe('Utf8Tools', function() {
    const ASCII_MESSAGE = "This message is very nice!";
    const UTF8_MESSAGE = "Örölö dürülü ❤";

    it('can encode and decode correctly', function() {
        const toolsEncodedAscii = Utf8Tools.stringToUtf8ByteArray(ASCII_MESSAGE);
        const nimiqEncodedAscii = Nimiq.BufferUtils.fromAscii(ASCII_MESSAGE);
        expect(toolsEncodedAscii).toEqual(nimiqEncodedAscii);

        const toolsEncodedUtf8 = Utf8Tools.stringToUtf8ByteArray(UTF8_MESSAGE);
        const toolsDecodedUtf8 = Utf8Tools.utf8ByteArrayToString(toolsEncodedUtf8);
        expect(toolsDecodedUtf8).toEqual(UTF8_MESSAGE);
    });

    it('can detect valid UTF-8 byte arrays', function() {
        const toolsEncodedUtf8_1 = Utf8Tools.stringToUtf8ByteArray(ASCII_MESSAGE);
        const toolsEncodedUtf8_2 = Utf8Tools.stringToUtf8ByteArray(UTF8_MESSAGE);

        const isValidUtf8_1 = Utf8Tools.isValidUtf8(toolsEncodedUtf8_1);
        const isValidUtf8_2 = Utf8Tools.isValidUtf8(toolsEncodedUtf8_2);
        expect(isValidUtf8_1).toBe(true);
        expect(isValidUtf8_2).toBe(true);

        const invalidUtf8_1 = toolsEncodedUtf8_2.slice(1); // Cut off first element
        const invalidUtf8_2 = toolsEncodedUtf8_2.slice(0, toolsEncodedUtf8_2.length - 2); // Cut off last element
        const isInvalidUtf8_1 = Utf8Tools.isValidUtf8(invalidUtf8_1);
        const isInvalidUtf8_2 = Utf8Tools.isValidUtf8(invalidUtf8_2);
        expect(isInvalidUtf8_1).toBe(false);
        expect(isInvalidUtf8_2).toBe(false);
    });
});
