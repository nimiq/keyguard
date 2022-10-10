/* global Nimiq */
/* global Dummy */
/* global LoginFile */
/* global QrScanner */
/* global Utf8Tools */

describe('LoginFile', () => {

    beforeAll(() => {
        I18n.initialize(window.TRANSLATIONS, 'en');
    });

    it('can generate a Login File', async () => {
        const entropy = new Nimiq.Entropy(Dummy.keys[0]);

        self.NIMIQ_IQONS_SVG_PATH = '/base/src/assets/Iqons.min.svg';

        const loginFile1 = new LoginFile(entropy.toBase64());
        const loginFile2 = new LoginFile(entropy.toBase64(), undefined, 'My labelled account');
        const dataUrl1 = await loginFile1.toDataUrl();
        const dataUrl2 = await loginFile2.toDataUrl();
        expect(typeof dataUrl1 === 'string' && dataUrl1.length > 100).toBe(true);
        expect(typeof dataUrl2 === 'string' && dataUrl2.length > 100).toBe(true);
    });

    it('can read a generated Login File', async () => {
        const entropy = new Nimiq.Entropy(Dummy.keys[0]);
        const label = 'My labelled account';

        const labelBytes = Utf8Tools.stringToUtf8ByteArray(label);
        const entropyWithLabel = new Nimiq.SerialBuffer(entropy.serializedSize + 1 + labelBytes.byteLength);
        entropyWithLabel.write(entropy.serialize());
        entropyWithLabel.writeUint8(labelBytes.byteLength);
        entropyWithLabel.write(labelBytes);

        const serializedEntropy = entropy.toBase64();
        const serializedEntropyWithLabel = Nimiq.BufferUtils.toBase64(entropyWithLabel);

        const loginFile1 = new LoginFile(serializedEntropy, 2);
        const loginFile2 = new LoginFile(serializedEntropyWithLabel, 2, label);
        const dataUrl1 = await loginFile1.toObjectUrl();
        const dataUrl2 = await loginFile2.toObjectUrl();

        const $img1 = await new Promise(resolve => {
            const _$img = new Image();
            _$img.onload = () => resolve(_$img);
            _$img.src = dataUrl1;
        });
        const $img2 = await new Promise(resolve => {
            const _$img = new Image();
            _$img.onload = () => resolve(_$img);
            _$img.src = dataUrl2;
        });

        // const file = new File([await fetch(dataUrl).then(r => r.blob())], 'LoginFile.png');

        const qrPosition = LoginFile.calculateQrPosition();

        QrScanner.WORKER_PATH = '/base/src/lib/QrScannerWorker.js';
        const decoded1 = await QrScanner.scanImage($img1, qrPosition, undefined, undefined, true);
        const decoded2 = await QrScanner.scanImage($img2, qrPosition, undefined, undefined, true);
        expect(decoded1).toEqual(serializedEntropy);
        expect(decoded2).toEqual(serializedEntropyWithLabel);

        // Validate that entropy and label are decoded correctly
        const buffer = Nimiq.BufferUtils.fromBase64(decoded2);
        const decodedEntropy = new Nimiq.Entropy(buffer.read(Nimiq.Entropy.SIZE));
        const labelLength = buffer.readUint8();
        const decodedLabel = Utf8Tools.utf8ByteArrayToString(buffer.read(labelLength));
        expect(decodedEntropy.equals(entropy)).toBe(true);
        expect(decodedLabel).toEqual(label);
    });
});
