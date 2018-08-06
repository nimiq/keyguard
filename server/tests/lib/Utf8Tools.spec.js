describe('Utf8Tools', function() {
    it('can encode and decode correctly', function() {
        const ASCII_MESSAGE = "This message is very nice!";
        const UTF8_MESSAGE = "Örölö dürülü ❤";

        const toolsEncodedAscii = Utf8Tools.stringToUtf8ByteArray(ASCII_MESSAGE);
        const nimiqEncodedAscii = Nimiq.BufferUtils.fromAscii(ASCII_MESSAGE);
        expect(toolsEncodedAscii).toEqual(nimiqEncodedAscii);

        const toolsEncodedUtf8 = Utf8Tools.stringToUtf8ByteArray(UTF8_MESSAGE);
        const toolsDecodedUtf8 = Utf8Tools.utf8ByteArrayToString(toolsEncodedUtf8);
        expect(toolsDecodedUtf8).toEqual(UTF8_MESSAGE);
    });
});
