/* global FlippableHandler */
/* global I18n */
/* global PasswordBox */
/* global ProgressIndicator */
/* global BackupCodesIllustration */
/* global BackupCodes */
/* global ViewTransitionHandler */
/* global KeyStore */
/* global AccountStore */
/* global Errors */
/* global Utf8Tools */
/* global ClipboardUtils */
/* global TopLevelApi */
/* global Key */

/**
 * @callback ExportBackupCodes.resolve
 * @param {KeyguardRequest.SimpleResult} result
 */

// Note: different to ExportWords and ExportFile, ExportBackupCodes is currently not planned to be part of a longer flow
// including multiple backup options, and thus does not need to flip the page via FlippableHandler, notify others of an
// unlocked key via Observable, or receive an unlocked key from others via a setKey method.
class ExportBackupCodes {
    /**
     * @param {Parsed<KeyguardRequest.ExportRequest>} request
     * @param {ExportBackupCodes.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        /** @type {Promise<[string, string]>} */
        this._backupCodesPromise = Promise.resolve(['', '']);

        // pages
        /** @type {ExportBackupCodes.Pages[]} */
        this._pageIds = Object.values(ExportBackupCodes.Pages);
        /** @type {Record<ExportBackupCodes.Pages, HTMLElement>} */
        this._pagesById = this._pageIds.reduce(
            (result, pageId) => ({ ...result, [pageId]: /** @type {HTMLElement} */ (document.getElementById(pageId)) }),
            /** @type {Record<ExportBackupCodes.Pages, HTMLElement>} */ ({}),
        );

        // illustrations
        /** @type {Record<BackupCodesIllustration.Steps, BackupCodesIllustration>} */
        this._illustrationsByStep = this._pageIds.reduce(
            (result, pageId) => {
                if (pageId === ExportBackupCodes.Pages.UNLOCK) return result;
                const $page = this._pagesById[pageId];
                const $illustration = /** @type {HTMLDivElement} */ ($page.querySelector('.backup-codes-illustration'));
                return {
                    ...result,
                    [pageId]: new BackupCodesIllustration(pageId, $illustration),
                };
            },
            /** @type {Record<BackupCodesIllustration.Steps, BackupCodesIllustration>} */ ({}),
        );

        // password box
        const $passwordBox = /** @type {HTMLFormElement} */ (
            this._pagesById[ExportBackupCodes.Pages.UNLOCK].querySelector('.password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            buttonI18nTag: 'passwordbox-log-in',
            hideInput: !request.keyInfo.encrypted,
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });
        this._passwordBox.on(PasswordBox.Events.SUBMIT, this._generateCodes.bind(this));
        TopLevelApi.focusPasswordBox();

        // Handle heading and continue button translation interpolations.
        for (const codeIndex of [/** @type {'1'} */('1'), /** @type {'2'} */('2')]) {
            const pageId = ExportBackupCodes.Pages[`SEND_CODE_${codeIndex}`];
            const $page = this._pagesById[pageId];
            const $heading = /** @type {HTMLHeadingElement} */ ($page.querySelector('.nq-h1'));
            const $continueButton = /** @type {HTMLButtonElement} */ ($page.querySelector('.nq-button'));
            I18n.translateToHtmlContent($heading, 'export-backup-codes-send-code-heading', { n: codeIndex });
            I18n.translateToHtmlContent($continueButton, 'export-backup-codes-send-code-copy', { n: codeIndex });
        }

        // progress indicators, continue buttons and back buttons
        let progressIndicatorStep = 1;
        for (const pageId of this._pageIds) {
            const $page = this._pagesById[pageId];

            // progress indicator
            const $progressIndicator = /** @type {HTMLDivElement} */ ($page.querySelector('.progress-indicator'));
            new ProgressIndicator($progressIndicator, 5, progressIndicatorStep); // eslint-disable-line no-new
            if (pageId !== ExportBackupCodes.Pages.SEND_CODE_1 && pageId !== ExportBackupCodes.Pages.SEND_CODE_2) {
                // Advance the progress indicator step if the page is not followed by a confirmation page.
                progressIndicatorStep += 1;
            }

            // continue button
            const $continueButton = $page.querySelector('.nq-button:not(.submit)');
            if ($continueButton) {
                // If the page has a continue button (that is not in the password form), add the event listener.
                $continueButton.addEventListener('click', async () => {
                    if (pageId === ExportBackupCodes.Pages.SUCCESS) {
                        this._resolve({ success: true });
                        return;
                    }
                    const backupCodesHandlingPromise = this._backupCodesPromise.then(([code1, code2]) => {
                        if (pageId === ExportBackupCodes.Pages.INTRO) {
                            // Set code 2 in the INTRO page's foreground message bubble when the page shouldn't be
                            // visible anymore, for if that was skipped in _generateCodes.
                            setTimeout(() => { this._illustrationsByStep[pageId].code2 = code2; }, 100);
                        }
                        if (pageId === ExportBackupCodes.Pages.SEND_CODE_1) {
                            ClipboardUtils.copy(code1);
                        }
                        if (pageId === ExportBackupCodes.Pages.SEND_CODE_2) {
                            ClipboardUtils.copy(code2);
                        }
                    });
                    if (pageId !== ExportBackupCodes.Pages.INTRO) {
                        // Only on the INTRO page allow continuing to the next page when the backup codes are not ready
                        // yet, in which case a loading animation will then be shown on the following SEND_CODE_1 page.
                        // Note that on all the other pages, the codes should already be available, and the promise
                        // should resolve instantly, by design of the flow.
                        await backupCodesHandlingPromise;
                    }
                    this._changePage('forward');
                });
            }

            // back button
            const $backButton = $page.querySelector('.nq-button-s');
            if ($backButton) {
                // If the page has a back button, add the event listener.
                $backButton.addEventListener('click', () => this._changePage('back'));
            }
        }

        // View transitions
        this._viewTransitionHandler = new ViewTransitionHandler(
            // Disable view transitions for the unlock page, as it has its own, separate transition effect.
            /** @type {Array<Exclude<ExportBackupCodes.Pages, typeof ExportBackupCodes.Pages.UNLOCK>>} */ (
                this._pageIds.filter(page => page !== ExportBackupCodes.Pages.UNLOCK)),
            async (viewTransition, oldState, newState) => {
                const $viewport = this._pagesById[newState];
                await BackupCodesIllustration.customizeViewTransition(viewTransition, oldState, newState, $viewport);
            },
        );

        // Augment browser navigations with view transition animations.
        window.addEventListener('popstate', event => {
            const hasUAVisualTransition = 'hasUAVisualTransition' in event && !!event.hasUAVisualTransition;
            // At the time of a popstate event, location.hash is already updated, but the document / DOM not yet and the
            // hashchange event has not triggered yet.
            const oldTarget = document.querySelector(':target');
            const oldPageId = oldTarget ? oldTarget.id : null;
            const newPageId = window.location.hash.replace(/^#/, '');
            if (!this._viewTransitionHandler.shouldTransitionView(oldPageId, newPageId)
                // The user agent already provided a visual transition itself (e.g. swipe back).
                || hasUAVisualTransition
            ) return;

            // Before transitioning the view, temporarily show the old page and enforce view transition names on it
            // instead of on the new :target for the View Transition API to be able to capture snapshots of it. Note
            // that this would not be necessary when using the Navigation API as it can detect and intercept navigations
            // before they happen, but unfortunately it is not widely supported yet.
            for (const $page of Object.values(this._pagesById)) {
                if ($page === oldTarget) {
                    $page.classList.add('display-flex', 'enforce-view-transition-names');
                    $page.style.zIndex = '99'; // cover new page to avoid it being visible to the user already
                } else {
                    $page.classList.add('disable-view-transition-names');
                }
            }

            this._viewTransitionHandler.transitionView(() => {
                for (const $page of Object.values(this._pagesById)) {
                    $page.classList.remove(
                        'display-flex',
                        'enforce-view-transition-names',
                        'disable-view-transition-names',
                    );
                    $page.style.zIndex = '';
                }
            }, oldPageId, newPageId);
        });
    }

    run() {
        FlippableHandler.disabled = true; // avoid conflicts between FlippableHandler's hashchange events and ours
        window.location.hash = ExportBackupCodes.Pages.UNLOCK;
    }

    /**
     * @private
     * @param {string} password
     */
    async _generateCodes(password) {
        TopLevelApi.setLoading(true);

        const passwordBuffer = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = this._request.keyInfo.useLegacyStore
                ? await AccountStore.instance.get(
                    this._request.keyInfo.defaultAddress.toUserFriendlyAddress(),
                    /** @type {Uint8Array} */ (passwordBuffer),
                )
                : await KeyStore.instance.get(this._request.keyInfo.id, passwordBuffer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                this._passwordBox.onPasswordIncorrect();
                TopLevelApi.setLoading(false);
                return;
            }
            this._reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
            return;
        }

        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        // Show a loading state on SEND_CODE_1 page for the case that the user already proceeds to that page, while the
        // codes are not ready yet.
        /** @param {boolean} isGeneratingCodes */
        const setGeneratingCodes = isGeneratingCodes => {
            const $sendCode1Page = this._pagesById[ExportBackupCodes.Pages.SEND_CODE_1];
            const sendCode1Illustration = this._illustrationsByStep[ExportBackupCodes.Pages.SEND_CODE_1];
            $sendCode1Page.classList.toggle('loading', isGeneratingCodes);
            sendCode1Illustration.loading = isGeneratingCodes;
        };
        setGeneratingCodes(true);

        this._backupCodesPromise = BackupCodes.generate(key); // generate codes in background
        this._backupCodesPromise.then(async ([code1, code2]) => {
            // Set the codes with a view transition.
            // If the user is still on the INTRO page, where the codes are masked, the change is not super noticeable
            // anyway, but we use a view transition nonetheless. Additionally, when on the INTRO page, we update only
            // code 1 which is partially hidden behind the message bubble of code 2, to make the change even less
            // noticeable, and code 2 can stay the placeholder, because when switching to SEND_CODE_1, it just changes
            // to its faded state in the background without unveiling the code. We then update code 2 of the INTRO page
            // later when the user continues to SEND_CODE_1 in the event handler of the continue button, although not
            // strictly necessary.
            // If the user already proceeded to the SEND_CODE_1 page, we transition from the loading animation there,
            // still based on the placeholders, to the actual, unveiled code, without updating the placeholders of the
            // loading animation, such that the discrepancy between the length of the placeholders and unveiled code is
            // also rather unnoticeably. Code 2 even disappears into the faded background, such that it can be updated
            // unnoticed, too.
            const currentPageId = window.location.hash.replace(/^#/, '');
            this._viewTransitionHandler.transitionView(() => {
                setGeneratingCodes(false);
                for (const [step, illustration] of Object.entries(this._illustrationsByStep)) {
                    illustration.code1 = code1;
                    if (currentPageId === ExportBackupCodes.Pages.INTRO && step === currentPageId) continue;
                    // Set code 2 only on other pages than INTRO, unless the user is not on INTRO anymore, see above.
                    illustration.code2 = code2;
                }
            }, currentPageId, currentPageId, /* awaitPreviousTransitions */ true);
        });

        // Proceed to INTRO page.
        this._changePage('forward');
        TopLevelApi.setLoading(false);
    }

    /**
     * @param {'forward' | 'back'} direction
     * @private
     */
    async _changePage(direction) {
        const oldPageId = /** @type {ExportBackupCodes.Pages} */ (window.location.hash.replace(/^#/, ''));
        const oldPageIndex = this._pageIds.indexOf(oldPageId);
        const newPageId = this._pageIds[oldPageIndex + (direction === 'forward' ? 1 : -1)];

        await this._viewTransitionHandler.transitionView(() => new Promise(resolve => {
            // Let the domUpdateHandler resolve, once the DOM actually updated.
            window.addEventListener('hashchange', () => resolve(), { once: true });
            if (direction === 'forward') {
                window.location.hash = newPageId;
            } else {
                window.history.back();
            }
        }), oldPageId, newPageId);
    }
}

/** @enum {'backup-codes-unlock' | BackupCodesIllustration.Steps} */
ExportBackupCodes.Pages = Object.freeze({
    UNLOCK: 'backup-codes-unlock',
    ...BackupCodesIllustration.Steps,
});
