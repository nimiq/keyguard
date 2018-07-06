class BrowserDetection {
    static isDesktopSafari() {
        // see https://stackoverflow.com/a/23522755
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    }

    static isSafari() {
        return !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
    }

    static isIos() {
        // @ts-ignore (MSStream is not on window)
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    static iosVersion() {
        if (BrowserDetection.isIos()) {
            const v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            if (v) {
                return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || '0', 10)];
            }
        }

        throw new Error('No iOS version detected');
    }

    static isBadIos() {
        const version = this.iosVersion();
        return version[0] < 11 || (version[0] === 11 && version[1] === 2); // Only 11.2 has the WASM bug
    }
}
