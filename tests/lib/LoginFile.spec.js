/* global Nimiq */
/* global Dummy */
/* global LoginFile */
/* global QrScanner */

describe('LoginFile', () => {

    it('can generate a Wallet File', async () => {
        const entropy = new Nimiq.Entropy(Dummy.keys[0]);

        // @ts-ignore
        self.NIMIQ_IQONS_SVG_PATH = '/base/src/assets/Iqons.min.svg';

        const walletFile = new LoginFile(entropy.toBase64());
        const dataUrl = await walletFile.toDataUrl();
        expect(typeof dataUrl === 'string' && dataUrl.length > 100).toBe(true);
    });

    it('can read a generated Wallet File', async () => {
        const entropy = new Nimiq.Entropy(Dummy.keys[0]);

        const serializedKey = entropy.toBase64();
        const walletFile = new LoginFile(serializedKey, 2);
        const dataUrl = await walletFile.toDataUrl();

        const $img = await new Promise(resolve => {
            const _$img = new Image();
            _$img.onload = () => resolve(_$img);
            _$img.src = dataUrl;
        });

        const qrPosition = LoginFile.calculateQrPosition();

        QrScanner.WORKER_PATH = '/base/src/lib/QrScannerWorker.min.js';
        const decoded = await QrScanner.scanImage($img, qrPosition, null, null, false, true);
        expect(decoded).toEqual(serializedKey);
    });
});
