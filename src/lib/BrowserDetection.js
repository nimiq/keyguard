class BrowserDetection { // eslint-disable-line no-unused-vars
    /**
     * @returns {boolean}
     */
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    /**
     * @returns {boolean}
     */
    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d.]+.*Safari/);
    }

    /**
     * @returns {number[]}
     */
    static safariVersion() {
        const versionMatch = navigator.userAgent.match(/Version\/(\d+)(?:\.(\d+))?(?:\.(\d+))?.*Safari/);
        if (!versionMatch) throw new Error('No Safari version detected.');
        return versionMatch.slice(1).map(part => Number.parseInt(part || '0', 10));
    }

    /**
     * @returns {boolean}
     */
    static isIOS() {
        // @ts-expect-error (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * @returns {number[]}
     */
    static iOSVersion() {
        if (BrowserDetection.isIOS()) {
            const versionMatch = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (versionMatch) {
                return versionMatch.slice(1).map(part => Number.parseInt(part || '0', 10));
            }
        }

        throw new Error('No iOS version detected');
    }

    /**
     * @returns {boolean}
     */
    static isBadIOS() {
        const version = this.iOSVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }

    /**
     * @returns {boolean}
     */
    static isMobile() {
        return window.matchMedia('only screen and (max-width: 760px)').matches;
    }

    /**
     * @returns {boolean}
     */
    static isTouchDevice() {
        return (('ontouchstart' in window)
            || (navigator.maxTouchPoints > 0)
            || ('msMaxTouchPoints' in navigator
                && /** @type {{ msMaxTouchPoints: number }} */ (navigator).msMaxTouchPoints > 0));
    }
}
