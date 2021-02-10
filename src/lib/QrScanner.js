/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

class QrScanner {
    /**
     * @param {HTMLImageElement | string} imageOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} givenWorker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrUrl, sourceRect = null, givenWorker = null, canvas = null,
        alsoTryWithoutSourceRect = false) {
        let createdNewWorker = false;
        /** @type {Worker} */
        let worker;
        if (!givenWorker) {
            worker = new Worker(QrScanner.WORKER_PATH);
            createdNewWorker = true;
        } else {
            worker = givenWorker;
        }
        try {
            return await new Promise((resolve, reject) => {
                /** @type {number | undefined} */
                let timeout;
                /** @type {(e: ErrorEvent | Error | string) => any} */
                let onError;
                /**
                 * @param {Event} event
                 */
                const onMessage = event => {
                    // @ts-ignore
                    if (event.data.type !== 'qrResult') {
                        return;
                    }
                    worker.removeEventListener('message', onMessage);
                    worker.removeEventListener('error', onError);
                    window.clearTimeout(timeout);
                    // @ts-ignore
                    if (event.data.data !== null) {
                        // @ts-ignore
                        resolve(event.data.data);
                    } else {
                        reject('QR code not found.');
                    }
                };
                /**
                 * @param {ErrorEvent | Error | string} e
                 */
                onError = e => {
                    worker.removeEventListener('message', onMessage);
                    worker.removeEventListener('error', onError);
                    window.clearTimeout(timeout);
                    const errorMessage = !e
                        ? 'Unknown Error'
                        : typeof e === 'string' ? e : e.message;
                    reject(`Scanner error: ${errorMessage}`);
                };
                worker.addEventListener('message', onMessage);
                worker.addEventListener('error', onError);
                timeout = window.setTimeout(() => onError('timeout'), 3000);
                QrScanner._loadImage(imageOrUrl).then(image => {
                    const imageData = QrScanner._getImageData(image, sourceRect, canvas);
                    worker.postMessage({
                        type: 'decode',
                        data: imageData,
                    }, [imageData.data.buffer]);
                }).catch(onError);
            });
        } catch (e) {
            if (sourceRect && alsoTryWithoutSourceRect) {
                return await QrScanner.scanImage(imageOrUrl, null, worker, canvas);
            }
            throw e;
        } finally {
            if (createdNewWorker) {
                worker.postMessage({
                    type: 'close',
                });
            }
        }
    }


    /**
     * @param {HTMLImageElement} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width;
        const sourceRectHeight = sourceRect && sourceRect.height ? sourceRect.height : image.height;
        if (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight) {
            canvas.width = sourceRectWidth;
            canvas.height = sourceRectHeight;
        }
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw ('Cannot get canvas 2D context');
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            sourceRectX,
            sourceRectY,
            sourceRectWidth,
            sourceRectHeight,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        return context.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * @param {HTMLImageElement | string} imageOrUrl
     * @returns {Promise<HTMLImageElement>}
     */
    static async _loadImage(imageOrUrl) {
        let image;
        if (imageOrUrl instanceof Image) {
            image = imageOrUrl;
        } else {
            image = new Image();
            image.src = imageOrUrl;
        }
        await QrScanner._awaitImageLoad(image);
        return image;
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        if (image.complete && image.naturalWidth !== 0) {
            // already loaded
            return;
        }
        await new Promise((resolve, reject) => {
            /** @type {EventListener} */
            let onError;
            const onLoad = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                image.removeEventListener('load', onLoad);
                image.removeEventListener('error', onError);
                resolve();
            };
            onError = () => {
                image.removeEventListener('load', onLoad);
                image.removeEventListener('error', onError);
                reject('Image load error');
            };
            image.addEventListener('load', onLoad);
            image.addEventListener('error', onError);
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.js';
