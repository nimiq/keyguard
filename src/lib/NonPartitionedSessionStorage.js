/* global Nimiq */
/* global CookieStorage */
/* global BrowserDetection */

class NonPartitionedSessionStorage {
    /**
     * @param {string} name
     * @param {Uint8Array} data
     * @param {Uint8Array} [encryptionKey]
     * @returns {Promise<Uint8Array | null>} New CookieStorage encryption key, if one was created.
     */
    static async set(name, data, encryptionKey) {
        const isSessionStoragePartitioned = this.isSessionStoragePartitioned();
        // Delete old data entries that might not have been migrated over yet.
        this.delete(name);

        if (isSessionStoragePartitioned) {
            // Use CookieStorage. We currently only support encrypted CookieStorage entries, to encourage encryption.
            return CookieStorage.set(name, data, encryptionKey, NonPartitionedSessionStorage.COOKIE_MAX_AGE);
        }

        sessionStorage.setItem(name, Nimiq.BufferUtils.toBase64(data));
        return null;
    }

    /**
     * @param {string} name
     * @param {Uint8Array} [encryptionKey]
     * @returns {Promise<Uint8Array | { data: Uint8Array, newEncryptionKey: Uint8Array } | null>}
     */
    static async get(name, encryptionKey) {
        /** @type {Uint8Array | null} */
        const cookieStorageData = CookieStorage.has(name)
            // We currently only support encrypted CookieStorage entries, to encourage encryption. Throws for wrong key.
            ? await CookieStorage.get(name, encryptionKey)
            : null;
        const sessionStorageDataBase64 = sessionStorage.getItem(name);
        const sessionStorageData = sessionStorageDataBase64
            ? Nimiq.BufferUtils.fromBase64(sessionStorageDataBase64)
            : null;

        // Note that with sessionStorage we can expect migrations to work reasonable well because it only lives within
        // the same tab, i.e. within a well-controlled environment where we can manually make sure that the
        // encryptionKeys are available for the lifetime of the tab. Migrating longer-lived values, for example in
        // localStorage, would require additional care of persisting the shared encryption keys in both, the top-level
        // and iframe contexts, to be available at any time.
        if (this.isSessionStoragePartitioned()) {
            if (sessionStorageData && !cookieStorageData) {
                // sessionStorage is detected/assumed to be partitioned now but was not previously. Migrate data. Note
                // that if sessionStorage is partitioned, this will effectively only migrate data written in the same
                // context, i.e. in top-level contexts only the sessionStore data previously written in top-level
                // windows can be migrated and in iframes only the data written in iframes.
                const newEncryptionKey = await CookieStorage.set(
                    name,
                    sessionStorageData,
                    encryptionKey,
                    NonPartitionedSessionStorage.COOKIE_MAX_AGE,
                );
                sessionStorage.removeItem(name);
                return newEncryptionKey
                    ? { data: sessionStorageData, newEncryptionKey }
                    : sessionStorageData;
            }
            return cookieStorageData;
        } else { // eslint-disable-line no-else-return
            if (!sessionStorageData && cookieStorageData) {
                // sessionStorage is not detected/assumed to be partitioned now but was previously. Migrate data.
                sessionStorage.setItem(name, Nimiq.BufferUtils.toBase64(cookieStorageData));
                CookieStorage.delete(name);
                return cookieStorageData;
            }
            return sessionStorageData;
        }
    }

    /**
     * @param {string} name
     */
    static delete(name) {
        sessionStorage.removeItem(name);
        CookieStorage.delete(name);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    static has(name) {
        return !!sessionStorage.getItem(name) || CookieStorage.has(name);
    }

    /**
     * Is the sessionStorage partitioned between Keyguard top-level, first-party windows and third-party iframe embedded
     * in the Hub?
     * @returns {boolean}
     */
    static isSessionStoragePartitioned() {
        if (!this.hasSessionStorageAccess()) {
            // sessionStorage is not even accessible. Report as being partitioned to avoid using it.
            return true;
        }
        // Safari introduced sessionStorage partitioning with version 16.1., which is currently based on the origin of
        // the top level window, but might be changed to be based on the registrable domain or eTLD+1 (e.g. nimiq.com
        // instead of hub.nimiq.com). If this change happens, the Keyguard's sessionStorage would not be partitioned
        // anymore between the Keyguard top-level and Keyguard iframe within the Hub, because the Keyguard and Hub live
        // on the same eTLD+1. This issue is tracked here: https://bugs.webkit.org/show_bug.cgi?id=247565
        if (!BrowserDetection.isSafari()) return false;
        const safariVersion = BrowserDetection.safariVersion();
        return safariVersion[0] >= 16 && safariVersion[1] >= 1;
    }

    static hasSessionStorageAccess() {
        if (NonPartitionedSessionStorage._hasSessionStorageAccess !== undefined) {
            return NonPartitionedSessionStorage._hasSessionStorageAccess;
        }
        try {
            sessionStorage.setItem('_test', 'write-access');
            const stored = sessionStorage.getItem('_test');
            if (stored !== 'write-access') throw new Error();
            sessionStorage.removeItem('_test');
            NonPartitionedSessionStorage._hasSessionStorageAccess = true;
        } catch (e) {
            NonPartitionedSessionStorage._hasSessionStorageAccess = false;
        }
        return NonPartitionedSessionStorage._hasSessionStorageAccess;
    }

    static isIframe() {
        return window.top !== window;
    }
}
// 7 minutes to simulate an ephemeral storage, similar to sessionStorage. Note that we set a max age and don't simply
// use session cookies because session cookies live until the browser is closed, or even longer if the browser is
// configured to persist sessions.
NonPartitionedSessionStorage.COOKIE_MAX_AGE = 7 * 60; // 7 minutes; in seconds
/** @type {boolean | undefined} */
NonPartitionedSessionStorage._hasSessionStorageAccess = undefined;
