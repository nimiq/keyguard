/* global Nimiq */
/* global CookieJar */
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
        const isSessionStoragePartitioned = await this.isSessionStoragePartitioned();
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
        if (await this.isSessionStoragePartitioned()) {
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
     * @returns {Promise<boolean>}
     */
    static async isSessionStoragePartitioned() {
        if (!this.hasSessionStorageAccess()) {
            // sessionStorage is not even accessible. Report as being partitioned to avoid using it.
            return true;
        }

        // Create a hash of the user agent to consume less space in the flag cookie than the complete user agent.
        const userAgentHash = new Uint8Array(await crypto.subtle.digest(
            'SHA-256',
            Nimiq.BufferUtils.fromAscii(navigator.userAgent), // Don't use Utf8Utils as they're not bundled in iframe.
        ));
        const userAgentHashString = Nimiq.BufferUtils.toBase64Url(userAgentHash).substring(0, 6);

        const otherContextEntryName = NonPartitionedSessionStorage.isIframe()
            ? NonPartitionedSessionStorage.TOP_LEVEL_SESSION_STORAGE_ENTRY
            : NonPartitionedSessionStorage.IFRAME_SESSION_STORAGE_ENTRY;
        if (sessionStorage.getItem(otherContextEntryName)) {
            // The sessionStorage was proven to not be partitioned. Persist this info, such that we also know it in
            // other windows and without having the conditions for successfully running the check, namely Keyguard being
            // opened as top-level and then as iframe, or vice-versa, in the same tab, because sessionStorage always
            // exists per tab only. Note that this check would be inaccurate if the iframe would be embedded into a
            // Keyguard top level window, because no partitioning occurs if the top-level window and the iframe are on
            // the same origin. As the Keyguard is only ever embedded as iframe into the Hub, this check is accurate.
            // Also note, that in the opposite case, where an entry is not readable in the other context, nothing is
            // proven because the Keyguard might not have been opened in the other context before in the same tab.
            // We store a hash of the user agent string, to re-run the check on browser update because the partitioning
            // behavior can change over time.
            CookieJar.writeCookie(CookieJar.Cookie.FLAG_SESSION_STORAGE_NOT_PARTITIONED, userAgentHashString);
            return false;
        }

        const flagNonPartitioned = CookieJar.readCookie(CookieJar.Cookie.FLAG_SESSION_STORAGE_NOT_PARTITIONED);
        if (flagNonPartitioned) {
            if (flagNonPartitioned === userAgentHashString) return false;
            // remove flag of previous browser version
            CookieJar.deleteCookie(CookieJar.Cookie.FLAG_SESSION_STORAGE_NOT_PARTITIONED);
        }

        // We have to rely on browser detection here. Embedding an iframe within the Keyguard for testing purposes
        // wouldn't work, see above.
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
NonPartitionedSessionStorage.TOP_LEVEL_SESSION_STORAGE_ENTRY = '_topLevelEntry';
NonPartitionedSessionStorage.IFRAME_SESSION_STORAGE_ENTRY = '_iframeEntry';
/** @type {boolean | undefined} */
NonPartitionedSessionStorage._hasSessionStorageAccess = undefined;

// Set a top-level or iframe entry for detection whether it can be read in the other context.
try {
    if (NonPartitionedSessionStorage.hasSessionStorageAccess()) {
        const currentContextEntryName = NonPartitionedSessionStorage.isIframe()
            ? NonPartitionedSessionStorage.IFRAME_SESSION_STORAGE_ENTRY
            : NonPartitionedSessionStorage.TOP_LEVEL_SESSION_STORAGE_ENTRY;
        sessionStorage.setItem(currentContextEntryName, '1');
    }
} catch (e) {} // eslint-disable-line no-empty
