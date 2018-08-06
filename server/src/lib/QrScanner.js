/* eslint-disable prefer-promise-reject-errors, no-throw-literal */

// eslint-disable-next-line max-len
/** @typedef {HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | File} imageOrFileOrUrl */

class QrScanner {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {((value: string) => string | PromiseLike<string>)} [onDecode]
     * @param {number} [canvasSize] - Edge length of the quadratic canvas
     */
    constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._active = false;

        this.$canvas.width = canvasSize;
        this.$canvas.height = canvasSize;
        this._sourceRect = {
            x: 0,
            y: 0,
            width: canvasSize,
            height: canvasSize,
        };

        this.$video.addEventListener('canplay', () => this._updateSourceRect());
        this.$video.addEventListener('play', () => {
            this._updateSourceRect();
            this._scanFrame();
        }, false);
        this._qrWorker = new Worker(QrScanner.WORKER_PATH);
    }

    _updateSourceRect() {
        const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
        const sourceRectSize = Math.round(2 / 3 * smallestDimension);
        this._sourceRect.width = sourceRectSize;
        this._sourceRect.height = sourceRectSize;
        this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
        this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
    }

    /**
     * Triggers this._onDecode for each frame, calls itself recursively until the video is paused or ends
     *
     * @returns {boolean}
     */
    _scanFrame() {
        if (this.$video.paused || this.$video.ended) return false;
        requestAnimationFrame(() => {
            QrScanner.scanImage(this.$video, this._sourceRect, this._qrWorker, this.$canvas, true)
                .then(this._onDecode, /** @param {string} error */ error => {
                    if (error !== 'QR code not found.') {
                        console.error(error);
                    }
                })
                .then(() => this._scanFrame());
        });

        return true;
    }

    /**
     * @param {string | object} [facingMode]
     * @param {boolean} [exact]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            if (exact) {
                facingMode = { exact: facingMode };
            }
            constraintsToTry.forEach(constraint => { constraint.facingMode = facingMode; });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {Array} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (constraintsToTry.length === 0) {
            return Promise.reject('Camera not found.');
        }
        return navigator.mediaDevices.getUserMedia({
            video: constraintsToTry.shift(),
        }).catch(() => this._getMatchingCameraStream(constraintsToTry));
    }

    start() {
        if (this._active) {
            return Promise.resolve();
        }
        this._active = true;
        clearTimeout(/** @type {number | undefined} */ (this._offTimeout));
        let facingMode = 'environment';
        return this._getCameraStream('environment', true)
            .catch(() => {
                // we (probably) don't have an environment camera
                facingMode = 'user';
                return this._getCameraStream(); // throws if we can't access the camera
            })
            .then(stream => {
                this.$video.srcObject = stream;
                this._setVideoMirror(facingMode);
            })
            .catch(e => {
                this._active = false;
                throw e;
            });
    }

    stop() {
        if (!this._active) {
            return;
        }
        this._active = false;
        this.$video.pause();
        this._offTimeout = (setTimeout(() => {
            // @ts-ignore
            this.$video.srcObject.getTracks()[0].stop();
            this.$video.srcObject = null;
        }, 3000));
    }

    /**
     * @param {string} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {number} red
     * @param {number} green
     * @param {number} blue
     */
    setGrayscaleWeights(red, green, blue) {
        this._qrWorker.postMessage({
            type: 'grayscaleWeights',
            data: { red, green, blue },
        });
    }

    /**
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @param {object?} sourceRect
     * @param {Worker?} worker
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @param {boolean} [alsoTryWithoutSourceRect]
     * @returns {Promise<string>}
     */
    static async scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false,
        alsoTryWithoutSourceRect = false) {
        const promise = new Promise((resolve, reject) => {
            worker = worker || new Worker(QrScanner.WORKER_PATH);
            /** @type {number | undefined} */
            let timeout;
            /** @type {EventListener} */
            let onError;
            /**
             * @param {Event} event
             */
            const onMessage = event => {
                // @ts-ignore
                if (event.data.type !== 'qrResult') {
                    return;
                }
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                // @ts-ignore
                if (event.data.data !== null) {
                    // @ts-ignore
                    resolve(event.data.data);
                } else {
                    reject('QR code not found.');
                }
            };
            onError = () => {
                /** @type {Worker} */ (worker).removeEventListener('message', onMessage);
                /** @type {Worker} */ (worker).removeEventListener('error', onError);
                clearTimeout(timeout);
                reject('Worker error.');
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            timeout = setTimeout(onError, 3000);
            QrScanner._loadImage(imageOrFileOrUrl).then(image => {
                const imageData = QrScanner._getImageData(image, sourceRect, canvas, fixedCanvasSize);
                /** @type {Worker} */ (worker).postMessage({
                    type: 'decode',
                    data: imageData,
                }, [imageData.data.buffer]);
            }).catch(reject);
        });

        if (sourceRect && alsoTryWithoutSourceRect) {
            return promise.catch(() => QrScanner.scanImage(imageOrFileOrUrl, null, worker, canvas, fixedCanvasSize));
        }
        return promise;
    }


    /**
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap} image
     * @param {object?} sourceRect
     * @param {HTMLCanvasElement?} canvas
     * @param {boolean} [fixedCanvasSize]
     * @returns {ImageData}
     */
    static _getImageData(image, sourceRect = null, canvas = null, fixedCanvasSize = false) {
        canvas = canvas || document.createElement('canvas');
        const sourceRectX = sourceRect && sourceRect.x ? sourceRect.x : 0;
        const sourceRectY = sourceRect && sourceRect.y ? sourceRect.y : 0;
        // @ts-ignore
        const sourceRectWidth = sourceRect && sourceRect.width ? sourceRect.width : image.width || image.videoWidth;
        const sourceRectHeight = sourceRect && sourceRect.height
            ? sourceRect.height
            : image.height
            // @ts-ignore
            || image.videoHeight;
        if (!fixedCanvasSize && (canvas.width !== sourceRectWidth || canvas.height !== sourceRectHeight)) {
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
     * @param {imageOrFileOrUrl} imageOrFileOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap>}
     */
    static async _loadImage(imageOrFileOrUrl) {
        if (imageOrFileOrUrl instanceof HTMLCanvasElement
            || imageOrFileOrUrl instanceof HTMLVideoElement
            // @ts-ignore
            || (window.ImageBitmap && imageOrFileOrUrl instanceof window.ImageBitmap)
        ) {
            // @ts-ignore
            return Promise.resolve(imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof Image) {
            return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
        } if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
            || typeof (imageOrFileOrUrl) === 'string') {
            const image = new Image();
            if (imageOrFileOrUrl instanceof File) {
                image.src = URL.createObjectURL(imageOrFileOrUrl);
            } else {
                // @ts-ignore
                image.src = imageOrFileOrUrl;
            }
            return QrScanner._awaitImageLoad(image).then(() => {
                if (imageOrFileOrUrl instanceof File) {
                    URL.revokeObjectURL(image.src);
                }
                return image;
            });
        }
        return Promise.reject('Unsupported image type.');
    }

    /**
     * @param {HTMLImageElement} image
     */
    static async _awaitImageLoad(image) {
        return new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth !== 0) {
                // already loaded
                resolve();
            } else {
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
            }
        });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.min.js';
