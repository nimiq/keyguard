/* global Constants */
/* global Errors */
/* global Utf8Tools */
/* global KeyStore */
/* global BitcoinKey */
/* global PolygonKey */
/* global NonPartitionedSessionStorage */
/* global TopLevelApi */
/* global ImportApi */
/* global ImportFile */
/* global ImportWords */
/* global FlippableHandler */
/* global DownloadLoginFile */
/* global LoginFileIcon */
/* global LoginFileConfig */
/* global IqonHash */
/* global PasswordInput */
/* global PasswordSetterBox */

/**
 * @callback Import.resolve
 * @param {KeyguardRequest.KeyResult} result
 */

class Import {
    /**
     * @param {Parsed<KeyguardRequest.ImportRequest>} request
     * @param {Import.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;
        /** @type {{entropy: Key?, privateKey: Key?}} */
        this._importedKeys = { entropy: null, privateKey: null };
        /** @type {KeyguardRequest.KeyResult} */
        this._importResult = [];

        FlippableHandler.init();

        const importFileHandler = new ImportFile(request);
        const importWordsHandler = new ImportWords(request);
        this._initialHandler = request.wordsOnly ? importWordsHandler : importFileHandler;

        // Pages
        this.$setPasswordPage = /** @type {HTMLFormElement} */ (
            document.getElementById(Import.Pages.SET_PASSWORD));
        const $downloadFilePage = /** @type {HTMLFormElement} */ (
            document.getElementById(Import.Pages.DOWNLOAD_LOGINFILE));

        // Elements
        const $passwordSetter = /** @type {HTMLFormElement} */ (
            this.$setPasswordPage.querySelector('.password-setter-box'));
        const $loginFileIcon = /** @type {HTMLDivElement} */ (
            this.$setPasswordPage.querySelector('.login-file-icon'));
        const $downloadLoginFile = /** @type {HTMLDivElement} */ (
            $downloadFilePage.querySelector('.download-loginfile'));
        const $skipDownloadButton = /** @type {HTMLLinkElement} */ (
            $downloadFilePage.querySelector('.skip'));

        // Components
        this._passwordSetter = new PasswordSetterBox($passwordSetter, { buttonI18nTag: 'passwordbox-confirm-log-in' });
        this._loginFileIcon = new LoginFileIcon($loginFileIcon);
        const downloadLoginFile = new DownloadLoginFile($downloadLoginFile);

        // Events for import handlers

        importFileHandler.on(
            ImportFile.Events.IMPORT,
            (keys, labels, password) => this._importKeys(keys, labels, password),
        );
        importFileHandler.on(ImportFile.Events.RESET, () => this._resetKeys());
        importWordsHandler.on(ImportWords.Events.IMPORT, keys => this._importKeys(keys));
        importWordsHandler.on(ImportWords.Events.RESET, () => this._resetKeys());

        importFileHandler.on(ImportFile.Events.GO_TO_OTHER_IMPORT_OPTION, () => importWordsHandler.run());
        importFileHandler.on(ImportFile.Events.GO_TO_CREATE, () => reject(new Errors.GoToCreate()));

        // Events for SET_PASSWORD page

        this._passwordSetter.on(PasswordSetterBox.Events.RESET, () => {
            this._passwordSetter.reset();
            this._loginFileIcon.unlock();
            TopLevelApi.focusPasswordBox();
        });
        this._passwordSetter.on(PasswordSetterBox.Events.ENTERED, () => {
            let colorClass = '';
            const entropyKey = this._importedKeys.entropy;
            if (entropyKey) {
                const colorIndex = IqonHash.getBackgroundColorIndex(entropyKey.defaultAddress.toUserFriendlyAddress());
                colorClass = LoginFileConfig[colorIndex].className;
            }
            this._loginFileIcon.lock(colorClass);
        });

        this._passwordSetter.on(PasswordSetterBox.Events.SUBMIT, async password => {
            if (!await this._storeKeysAndComputeResult(password)) return;

            if (!this._importedKeys.entropy || this._importedKeys.privateKey) {
                // Don't offer to download a Login File, if the imported key is not or not unambiguously an entropy.
                TopLevelApi.setLoading(true); // keep the loading spinner spinning until the request is finished
                resolve(this._importResult);
                return;
            }

            const entropy = /** @type {Nimiq.Entropy} */ (this._importedKeys.entropy.secret);
            const encryptedSecret = await entropy.exportEncrypted(password);
            downloadLoginFile.setEncryptedEntropy(encryptedSecret, this._importedKeys.entropy.defaultAddress);

            $skipDownloadButton.style.display = '';
            window.location.hash = Import.Pages.DOWNLOAD_LOGINFILE;
        });

        // Events for DOWNLOAD_LOGINFILE page

        downloadLoginFile.on(DownloadLoginFile.Events.INITIATED, () => { $skipDownloadButton.style.display = 'none'; });
        downloadLoginFile.on(DownloadLoginFile.Events.DOWNLOADED, () => resolve(this._importResult));

        if (request.wordsOnly && 'expectedKeyId' in request) {
            $skipDownloadButton.remove();
        } else {
            $skipDownloadButton.addEventListener('click', e => {
                e.preventDefault();
                resolve(this._importResult);
            });
        }
    }

    run() {
        this._initialHandler.run();
    }

    /**
     * @private
     * @param {{entropy: Key?, privateKey: Key?}} keys
     * @param {{entropy: string?, privateKey: string?}} [labels]
     * @param {string} [password]
     * @returns {Promise<void>}
     */
    async _importKeys(keys, labels, password) {
        if (!keys.entropy && !keys.privateKey) {
            this._reject(new Errors.KeyguardError('No keys imported'));
            return;
        }
        this._importedKeys = keys;
        if (password) {
            if (!await this._storeKeysAndComputeResult(password, labels)) return;
            TopLevelApi.setLoading(true); // keep the loading spinner spinning until the request is finished
            this._resolve(this._importResult);
        } else {
            // Let user set a password and if it's unambiguously an entropy, offer to download a Login File.
            // Here we ignore the labels, because they're only available for Login Files handled in the case above.
            await this._passwordSetter.reset();
            this._loginFileIcon.unlock();
            const isUnambiguousEntropy = !!this._importedKeys.entropy && !this._importedKeys.privateKey;
            this._loginFileIcon.setFileUnavailable(!isUnambiguousEntropy);
            this.$setPasswordPage.classList.toggle('login-file-available', isUnambiguousEntropy);
            window.location.hash = Import.Pages.SET_PASSWORD;
            setTimeout(() => TopLevelApi.focusPasswordBox(), 300);
        }
    }

    /**
     * @private
     */
    _resetKeys() {
        this._importedKeys = { entropy: null, privateKey: null };
        this._importResult = [];
    }

    /**
     * @private
     * @param {string} password
     * @param {{entropy: string?, privateKey: string?}} [labels]
     * @returns {Promise<boolean>}
     */
    async _storeKeysAndComputeResult(password, labels) {
        TopLevelApi.setLoading(true);
        let encryptionKey = null;
        if (password && password.length >= PasswordInput.DEFAULT_MIN_LENGTH) {
            encryptionKey = Utf8Tools.stringToUtf8ByteArray(password);
        }
        try {
            if (this._importedKeys.entropy) {
                const key = this._importedKeys.entropy;
                const keyLabel = labels && labels.entropy ? labels.entropy : undefined;
                const { requestedKeyPaths, bitcoinXPubPath, polygonAccountPath } = this._request;
                /** @type {{keyPath: string, address: Uint8Array}[]} */
                const addresses = requestedKeyPaths.map(keyPath => ({
                    keyPath,
                    address: key.deriveAddress(keyPath).serialize(),
                }));

                const bitcoinXPub = new BitcoinKey(key).deriveExtendedPublicKey(bitcoinXPubPath);

                const polygonKeypath = `${polygonAccountPath}/0/0`;
                const polygonAddresses = [{
                    address: new PolygonKey(key).deriveAddress(polygonKeypath),
                    keyPath: polygonKeypath,
                }];

                // Store entropy in NonPartitionedSessionStorage so addresses can be derived in the KeyguardIframe
                const tmpCookieEncryptionKey = await NonPartitionedSessionStorage.set(
                    ImportApi.SESSION_STORAGE_KEY_PREFIX + key.id,
                    key.secret.serialize(),
                ) || undefined;

                await KeyStore.instance.put(key, encryptionKey || undefined); // throws on error

                this._importResult.push({
                    keyId: key.id,
                    keyType: key.type,
                    keyLabel,
                    addresses,
                    bitcoinXPub,
                    polygonAddresses,

                    // Backup warnings should not be shown for imported accounts, only for newly created accounts.
                    // Therefore, we set all flags to true.
                    fileExported: true,
                    wordsExported: true,
                    backupCodesExported: true,

                    // The Hub will get access to the encryption key, but not the encrypted cookie. The server can
                    // potentially get access to the encrypted cookie, but not the encryption key (we set the result
                    // including the encryption key as url fragment which is not sent to the server), as long as the
                    // Hub is not compromised. An attacker would need to get access to the Keyguard and Hub servers
                    // for getting the cookie and encryption key, in order to reconstruct the entropy.
                    tmpCookieEncryptionKey,
                });
            }
            if (this._importedKeys.privateKey) {
                const key = this._importedKeys.privateKey;
                const keyId = await KeyStore.instance.put(key, encryptionKey || undefined);
                const keyLabel = labels && labels.privateKey ? labels.privateKey : undefined;

                this._importResult.push({
                    keyId,
                    keyType: key.type,
                    keyLabel,
                    addresses: [{
                        keyPath: Constants.LEGACY_DERIVATION_PATH,
                        address: key.deriveAddress(Constants.LEGACY_DERIVATION_PATH).serialize(),
                    }],
                    fileExported: false, // Legacy accounts do not get a LoginFile
                    wordsExported: true,
                    backupCodesExported: true,
                });
            }
            if (!this._importResult.length) {
                throw new Errors.KeyguardError('No keys imported');
            }
            return true;
        } catch (error) {
            console.log(error);
            this._reject(error instanceof Error ? error : new Error(String(error)));
            return false;
        } finally {
            TopLevelApi.setLoading(false);
        }
    }
}

Import.Pages = {
    // On import of a non-encrypted backup (recovery words), the user is asked to set a password and offered to download
    // a new Login File.
    SET_PASSWORD: 'set-password',
    DOWNLOAD_LOGINFILE: 'download-file',
};
