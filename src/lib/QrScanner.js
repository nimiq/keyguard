/* eslint-disable prefer-promise-reject-errors, no-throw-literal */
/* global BarcodeDetector */

/**
 * @typedef {{
 *     x?: number,
 *     y?: number,
 *     width?: number,
 *     height?: number,
 *     downScaledWidth?: number,
 *     downScaledHeight?: number,
 * }} ScanRegion
 */

class QrScanner {
    /**
     * @returns {Promise<boolean>}
     */
    static async hasCamera() {
        if (!navigator.mediaDevices) return false;
        // note that enumerateDevices can always be called and does not prompt the user for permission. However, device
        // labels are only readable if served via https and an active media stream exists or permanent permission is
        // given. That doesn't matter for us though as we don't require labels.
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (error) {
            return false;
        }
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLVideoElement} video
     * @param {(result: string) => any} onDecode
     * @param {(error: string) => any} [onDecodeError]
     * @param {(video: HTMLVideoElement) => ScanRegion} [calculateScanRegion]
     * @param {'environment' | 'user'} [preferredFacingMode = 'environment']
     */
    constructor(
        video,
        onDecode,
        onDecodeError,
        calculateScanRegion,
        preferredFacingMode = 'environment',
    ) {
        this.$video = video;
        this.$canvas = document.createElement('canvas');
        this._onDecode = onDecode;
        this._onDecodeError = onDecodeError || this._onDecodeError;
        this._calculateScanRegion = calculateScanRegion || this._calculateScanRegion;
        this._preferredFacingMode = preferredFacingMode;
        this._active = false;
        this._paused = false;

        this._scanRegion = this._calculateScanRegion(video);

        this._onPlay = this._onPlay.bind(this);
        this._onLoadedMetaData = this._onLoadedMetaData.bind(this);
        this._onVisibilityChange = this._onVisibilityChange.bind(this);

        // Allow inline playback on iPhone instead of requiring full screen playback,
        // see https://webkit.org/blog/6784/new-video-policies-for-ios/
        // @ts-ignore Property 'playsInline' does not exist on type 'HTMLVideoElement'
        this.$video.playsInline = true;
        // Allow play() on iPhone without requiring a user gesture. Should not really be needed as camera stream
        // includes no audio, but just to be safe.
        this.$video.muted = true;
        // @ts-ignore Property 'disablePictureInPicture' does not exist on type 'HTMLVideoElement'
        this.$video.disablePictureInPicture = true;
        this.$video.addEventListener('play', this._onPlay);
        this.$video.addEventListener('loadedmetadata', this._onLoadedMetaData);
        document.addEventListener('visibilitychange', this._onVisibilityChange);

        this._qrEnginePromise = QrScanner.createQrEngine();
    }

    destroy() {
        this.$video.removeEventListener('loadedmetadata', this._onLoadedMetaData);
        this.$video.removeEventListener('play', this._onPlay);
        document.removeEventListener('visibilitychange', this._onVisibilityChange);

        this.stop();
        QrScanner._postWorkerMessage(this._qrEnginePromise, 'close');
    }

    async start() {
        if (this._active && !this._paused) return;

        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            // warn but try starting the camera anyways
            console.warn('The camera stream is only accessible if the page is transferred via https.');
        }
        this._active = true;
        this._paused = false;
        if (document.hidden) return; // camera will be started as soon as tab is in foreground

        window.clearTimeout(this._offTimeout);
        this._offTimeout = undefined;
        if (this.$video.srcObject) {
            // camera stream already/still set
            this.$video.play();
            return;
        }

        try {
            let facingMode = this._preferredFacingMode;
            /** @type {MediaStream} */
            let stream;
            try {
                stream = await this._getCameraStream(facingMode, true);
            } catch (error) {
                // We (probably) don't have a camera of the requested facing mode
                facingMode = facingMode === 'environment' ? 'user' : 'environment';
                stream = await this._getCameraStream(); // throws if camera is not accessible (e.g. due to not https)
            }

            // Try to determine the facing mode from the stream, otherwise use our guess. Note that the guess is not
            // always accurate as Safari returns cameras of different facing mode, even for exact constraints.
            facingMode = this._getFacingMode(stream) || facingMode;
            this.$video.srcObject = stream;
            this.$video.play();
            this._setVideoMirror(facingMode);
        } catch (error) {
            this._active = false;
            throw error;
        }
    }

    stop() {
        this.pause();
        this._active = false;
    }

    pause() {
        this._paused = true;
        if (!this._active) {
            return;
        }
        this.$video.pause();
        if (this._offTimeout) {
            return;
        }
        this._offTimeout = window.setTimeout(() => {
            const tracks = this.$video.srcObject && this.$video.srcObject instanceof MediaStream
                ? this.$video.srcObject.getTracks()
                : [];
            for (const track of tracks) {
                track.stop();
            }
            this.$video.srcObject = null;
            this._offTimeout = undefined;
        }, 300);
    }

    /**
     * @param {HTMLImageElement | HTMLVideoElement | string} imageOrVideoOrUrl
     * @param {ScanRegion} [scanRegion]
     * @param {Promise<Worker | BarcodeDetector>} [givenEngine]
     * @param {HTMLCanvasElement} [givenCanvas]
     * @param {boolean} [alsoTryWithoutScanRegion = false]
     * @returns {Promise<string>}
     */
    static async scanImage(
        imageOrVideoOrUrl,
        scanRegion,
        givenEngine,
        givenCanvas,
        alsoTryWithoutScanRegion = false,
    ) {
        const qrEngine = givenEngine || QrScanner.createQrEngine();
        /** @type {HTMLCanvasElement | undefined} */
        let usedCanvas;

        try {
            const [engine, image] = await Promise.all([
                qrEngine,
                QrScanner._loadImage(imageOrVideoOrUrl),
            ]);
            const [canvas, canvasContext] = this._drawToCanvas(image, scanRegion, givenCanvas);
            usedCanvas = canvas;

            if (engine instanceof Worker) {
                return await new Promise((resolve, reject) => {
                    /** @type {(error: string | ErrorEvent) => any} */
                    let onError;

                    /** @type {number} */
                    let timeout;

                    /** @param {MessageEvent} event */
                    const onMessage = event => {
                        if (event.data.type !== 'qrResult') {
                            return;
                        }
                        engine.removeEventListener('message', onMessage);
                        engine.removeEventListener('error', onError);
                        window.clearTimeout(timeout);
                        if (event.data.data !== null) {
                            resolve(event.data.data);
                        } else {
                            reject(QrScanner.NO_QR_CODE_FOUND);
                        }
                    };

                    /** @param {string | ErrorEvent} e */
                    onError = e => {
                        engine.removeEventListener('message', onMessage);
                        engine.removeEventListener('error', onError);
                        window.clearTimeout(timeout);
                        const errorMessage = !e
                            ? 'Unknown Error'
                            : (e instanceof Error ? e.message : e);
                        reject(`Scanner error: ${errorMessage}`);
                    };

                    engine.addEventListener('message', onMessage);
                    engine.addEventListener('error', onError);
                    timeout = window.setTimeout(() => onError('timeout'), 10000);

                    const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                    engine.postMessage({
                        type: 'decode',
                        data: imageData,
                    }, [imageData.data.buffer]);
                });
            }

            return await Promise.race([
                new Promise((resolve, reject) => window.setTimeout(() => reject('Scanner error: timeout'), 10000)),
                (async () => {
                    try {
                        const [scanResult] = await engine.detect(canvas);
                        if (!scanResult) throw QrScanner.NO_QR_CODE_FOUND;
                        return scanResult.rawValue;
                    } catch (e) {
                        throw `Scanner error: ${e instanceof Error ? e.message : e}`;
                    }
                })(),
            ]);
        } catch (e) {
            if (!alsoTryWithoutScanRegion) throw e;
            return await QrScanner.scanImage(
                imageOrVideoOrUrl,
                undefined,
                qrEngine,
                usedCanvas,
                false,
            );
        } finally {
            if (qrEngine !== givenEngine) {
                QrScanner._postWorkerMessage(qrEngine, 'close').catch(() => {});
            }
        }
    }

    /**
     * @param {string} [workerPath]
     * @returns {Promise<Worker | BarcodeDetector>}
     */
    static async createQrEngine(workerPath = QrScanner.WORKER_PATH) {
        const supportsBarcodeDetector = 'BarcodeDetector' in window
            && BarcodeDetector.getSupportedFormats
            && (await BarcodeDetector.getSupportedFormats()).includes('qr_code');

        if (!supportsBarcodeDetector) return new Worker(workerPath);

        // On Macs with an M1/M2 processor and macOS Ventura (macOS version 13), the BarcodeDetector is broken in
        // Chromium based browsers, regardless of the version. For that constellation, the BarcodeDetector does not
        // error but does not detect QR codes. Macs without an M1/M2 or before Ventura are fine.
        // See issue qr-scanner/#209 and https://bugs.chromium.org/p/chromium/issues/detail?id=1382442
        // TODO update this once the issue in macOS is fixed
        const userAgentData = navigator.userAgentData;
        const isChromiumOnMacWithArmVentura = userAgentData // all Chromium browsers support userAgentData
            && userAgentData.brands.some(({ brand }) => /Chromium/i.test(brand))
            && /mac ?OS/i.test(userAgentData.platform)
            // Does it have an ARM chip (e.g. M1/M2) and Ventura? Check this last as getHighEntropyValues can
            // theoretically trigger a browser prompt, although no browser currently does seem to show one.
            // If browser or user refused to return the requested values, assume broken ARM Ventura, to be safe.
            && await userAgentData.getHighEntropyValues(['architecture', 'platformVersion'])
                .then(({ architecture, platformVersion }) => /arm/i.test(architecture || 'arm')
                    && Number.parseInt(platformVersion || '13', 10) >= /* Ventura */ 13)
                .catch(() => true);
        if (isChromiumOnMacWithArmVentura) return new Worker(workerPath);

        return new BarcodeDetector({ formats: ['qr_code'] });
    }

    _onPlay() {
        this._scanRegion = this._calculateScanRegion(this.$video);
        this._scanFrame();
    }

    _onLoadedMetaData() {
        this._scanRegion = this._calculateScanRegion(this.$video);
    }

    _onVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else if (this._active) {
            this.start();
        }
    }

    /**
     * @param {HTMLVideoElement} video
     * @returns {ScanRegion}
     */
    _calculateScanRegion(video) {
        // Default scan region calculation. Note that this can be overwritten in the constructor.
        const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
        const scanRegionSize = Math.round(2 / 3 * smallestDimension);
        return {
            x: Math.round((video.videoWidth - scanRegionSize) / 2),
            y: Math.round((video.videoHeight - scanRegionSize) / 2),
            width: scanRegionSize,
            height: scanRegionSize,
            downScaledWidth: QrScanner.DEFAULT_CANVAS_SIZE,
            downScaledHeight: QrScanner.DEFAULT_CANVAS_SIZE,
        };
    }

    _scanFrame() {
        if (!this._active || this.$video.paused || this.$video.ended) return;
        // using requestAnimationFrame to avoid scanning if tab is in background
        requestAnimationFrame(async () => {
            if (this.$video.readyState <= 1) {
                // Skip scans until the video is ready as drawImage() only works correctly on a video with readyState
                // > 1, see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage#Notes.
                // This also avoids false positives for videos paused after a successful scan which remains visible on
                // the canvas until the video is started again and ready.
                this._scanFrame();
                return;
            }
            /** @type {string | undefined} */
            let result;
            try {
                result = await QrScanner.scanImage(
                    this.$video,
                    this._scanRegion,
                    this._qrEnginePromise,
                    this.$canvas,
                );
            } catch (error) {
                if (!this._active) return;
                const errorMessage = error.message || error;
                if (errorMessage.includes('service unavailable')) {
                    // When the native BarcodeDetector crashed, create a new one
                    this._qrEnginePromise = QrScanner.createQrEngine();
                }
                this._onDecodeError(error);
            }

            if (result) {
                this._onDecode(result);
            }

            this._scanFrame();
        });
    }

    /**
     * @param {string} error
     */
    _onDecodeError(error) {
        // default error handler; can be overwritten in the constructor
        if (error === QrScanner.NO_QR_CODE_FOUND) return;
        console.log(error);
    }

    /**
     * @param {'environment' | 'user'} [facingMode]
     * @param {boolean} [exact = false]
     * @returns {Promise<MediaStream>}
     */
    _getCameraStream(facingMode, exact = false) {
        /** @type {MediaTrackConstraints[]} */
        const constraintsToTry = [{
            width: { min: 1024 },
        }, {
            width: { min: 768 },
        }, {}];

        if (facingMode) {
            constraintsToTry.forEach(constraint => {
                constraint.facingMode = exact ? { exact: facingMode } : facingMode;
            });
        }
        return this._getMatchingCameraStream(constraintsToTry);
    }

    /**
     * @param {MediaTrackConstraints[]} constraintsToTry
     * @returns {Promise<MediaStream>}
     */
    async _getMatchingCameraStream(constraintsToTry) {
        if (!navigator.mediaDevices || constraintsToTry.length === 0) {
            throw 'Camera not found.';
        }
        try {
            return await navigator.mediaDevices.getUserMedia({
                video: constraintsToTry.shift(),
            });
        } catch (error) {
            return this._getMatchingCameraStream(constraintsToTry);
        }
    }

    /**
     * @param {'environment' | 'user'} facingMode
     */
    _setVideoMirror(facingMode) {
        // in user facing mode mirror the video to make it easier for the user to position the QR code
        const scaleFactor = facingMode === 'user' ? -1 : 1;
        this.$video.style.transform = `scaleX(${scaleFactor})`;
    }

    /**
     * @param {MediaStream} videoStream
     * @returns {'environment' | 'user' | null}
     */
    _getFacingMode(videoStream) {
        const videoTrack = videoStream.getVideoTracks()[0];
        if (!videoTrack) return null; // unknown
        // inspired by https://github.com/JodusNodus/react-qr-reader/blob/master/src/getDeviceId.js#L13
        if (/rear|back|environment/i.test(videoTrack.label)) return 'environment';
        if (/front|user|face/i.test(videoTrack.label)) return 'user';
        return null; // unknown
    }

    /**
     * @param {HTMLImageElement | HTMLVideoElement} image
     * @param {ScanRegion?} scanRegion
     * @param {HTMLCanvasElement?} canvas
     * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
     */
    static _drawToCanvas(image, scanRegion = null, canvas = null) {
        canvas = canvas || document.createElement('canvas');
        const scanRegionX = scanRegion && scanRegion.x ? scanRegion.x : 0;
        const scanRegionY = scanRegion && scanRegion.y ? scanRegion.y : 0;
        const scanRegionWidth = scanRegion && scanRegion.width
            ? scanRegion.width
            : image.width || /** @type {HTMLVideoElement} */ (image).videoWidth;
        const scanRegionHeight = scanRegion && scanRegion.height
            ? scanRegion.height
            : image.height || /** @type {HTMLVideoElement} */ (image).videoHeight;
        const canvasWidth = scanRegion && scanRegion.downScaledWidth
            ? scanRegion.downScaledWidth
            : scanRegionWidth;
        const canvasHeight = scanRegion && scanRegion.downScaledHeight
            ? scanRegion.downScaledHeight
            : scanRegionHeight;

        // Setting the canvas width or height clears the canvas, even if the values didn't change, therefore only set
        // them if they actually changed.
        if (canvas.width !== canvasWidth) {
            canvas.width = canvasWidth;
        }
        if (canvas.height !== canvasHeight) {
            canvas.height = canvasHeight;
        }

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw 'Unable to get canvas context';
        context.imageSmoothingEnabled = false; // gives less blurry images
        context.drawImage(
            image,
            scanRegionX, scanRegionY, scanRegionWidth, scanRegionHeight,
            0, 0, canvas.width, canvas.height,
        );
        return [canvas, context];
    }

    /**
     * @param {HTMLImageElement | HTMLVideoElement | string} imageOrVideoOrUrl
     * @returns {Promise<HTMLImageElement | HTMLVideoElement>}
     */
    static async _loadImage(imageOrVideoOrUrl) {
        if (imageOrVideoOrUrl instanceof HTMLVideoElement) {
            return imageOrVideoOrUrl;
        }

        /** @type {HTMLImageElement} */
        let image;
        if (imageOrVideoOrUrl instanceof HTMLImageElement) {
            image = imageOrVideoOrUrl;
        } else {
            image = new Image();
            image.src = imageOrVideoOrUrl;
        }
        await QrScanner._awaitImageLoad(image);
        return image;
    }

    /**
     * @param {HTMLImageElement} image
     * @returns {Promise<void>}
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
                resolve(undefined);
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

    /**
     * @param {Worker | BarcodeDetector | Promise<Worker | BarcodeDetector>} qrEngineOrQrEnginePromise
     * @param {string} type
     * @param {any} [data]
     * @returns {Promise<void>}
     */
    static async _postWorkerMessage(qrEngineOrQrEnginePromise, type, data) {
        const qrEngine = await qrEngineOrQrEnginePromise;
        if (!(qrEngine instanceof Worker)) return;
        qrEngine.postMessage({ type, data });
    }
}
QrScanner.DEFAULT_CANVAS_SIZE = 400;
QrScanner.NO_QR_CODE_FOUND = 'No QR code found';
QrScanner.WORKER_PATH = '../../lib/QrScannerWorker.js';
