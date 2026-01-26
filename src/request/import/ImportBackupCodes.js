/* global Constants */
/* global I18n */
/* global Observable */
/* global Nimiq */
/* global TopLevelApi */
/* global BackupCodes */
/* global ViewTransitionHandler */
/* global ProgressIndicator */
/* global BackupCodesInput */

class ImportBackupCodes extends Observable {
    /**
     * @param {Parsed<KeyguardRequest.ImportRequest | KeyguardRequest.ResetPasswordRequest>} request
     */
    constructor(request) {
        super();

        this._request = request;
        this._codesComplete = false;
        this._warningText = '';

        // Pages
        this.$codesPage = /** @type {HTMLDivElement} */ (document.getElementById(ImportBackupCodes.Pages.ENTER_CODES));

        // Elements
        const $progressIndicator = /** @type {HTMLDivElement} */ (this.$codesPage.querySelector('.progress-indicator'));
        const $backupCodesInput = /** @type {HTMLFormElement} */ (this.$codesPage.querySelector('.backup-codes-input'));
        this.$warning = /** @type {HTMLParagraphElement} */ (this.$codesPage.querySelector('.warning'));

        // Components
        this._progressIndicator = new ProgressIndicator($progressIndicator, 2, 1);
        this._backupCodesInput = new BackupCodesInput(BackupCodesInput.Steps.ENTER_CODE_1, $backupCodesInput);

        // Events
        this._backupCodesInput.on(BackupCodesInput.Events.CODE_EDIT, (codeIndex, code) => {
            if (!code || window.location.hash.replace(/^#/, '') !== ImportBackupCodes.Pages.ENTER_CODES) return;
            if (this._codesComplete) {
                this.fire(ImportBackupCodes.Events.RESET);
            }
            this._codesComplete = false;
            this._setWarning('');
        });
        this._backupCodesInput.on(
            BackupCodesInput.Events.INVALID_EDIT,
            () => this._setWarning(I18n.translatePhrase('import-backup-codes-warning-invalid-characters')),
        );
        this._backupCodesInput.on(BackupCodesInput.Events.CODE_COMPLETE, async codeIndex => {
            this._backupCodesInput.blur();
            if (codeIndex !== 1) return;
            await new Promise(resolve => requestAnimationFrame(resolve));
            this._changeStep(BackupCodesInput.Steps.ENTER_CODE_2);
        });
        this._backupCodesInput.on(
            BackupCodesInput.Events.CODES_COMPLETE,
            backupCodes => this._onBackupCodesComplete(backupCodes),
        );

        // View transitions
        this._viewTransitionHandler = new ViewTransitionHandler(
            Object.values(BackupCodesInput.Steps),
            async (viewTransition, oldState, newState) => {
                await BackupCodesInput.customizeViewTransition(viewTransition, oldState, newState, this.$codesPage);
            },
        );
    }

    run() {
        window.location.hash = ImportBackupCodes.Pages.ENTER_CODES;
        this._codesComplete = false;
        this._setWarning('');
        this._changeStep(BackupCodesInput.Steps.ENTER_CODE_1, /* transition */ false);
    }

    /**
     * @private
     * @param {[string, string]} backupCodes
     */
    async _onBackupCodesComplete(backupCodes) {
        // Let the browser render any UI updates, e.g. pasting of codes, before doing expensive computations.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        /** @type {{entropy: Key?, privateKey: Key?}} */
        const keys = { entropy: null, privateKey: null };
        try {
            TopLevelApi.setLoading(true);
            const key = await BackupCodes.recoverKey(backupCodes[0], backupCodes[1]);

            if ('expectedKeyId' in this._request && key.id !== this._request.expectedKeyId) {
                throw new Error('expectedKeyId mismatch');
            }

            if (key.secret instanceof Nimiq.Entropy) {
                keys.entropy = key;
            } else if (key.secret instanceof Nimiq.PrivateKey) {
                keys.privateKey = key;
            }
            this.fire(ImportBackupCodes.Events.IMPORT, keys);
            // Imported successfully. Reset view afterward. Delay the change for a small moment, to hopefully perform
            // the change unnoticed in the background, while ImportBackupCodes should not be visible anymore.
            await new Promise(resolve => setTimeout(resolve, 200));
            this._changeStep(BackupCodesInput.Steps.ENTER_CODE_1, /* transition */ false);
        } catch (error) {
            console.error(error);
            if (error instanceof Error && error.message.includes('expectedKeyId')) {
                this._setWarning(I18n.translatePhrase('import-backup-codes-warning-different-account'));
            } else {
                this._setWarning(I18n.translatePhrase('import-backup-codes-warning-invalid'));
            }
            this._changeStep(BackupCodesInput.Steps.ENTER_CODE_1);
        } finally {
            TopLevelApi.setLoading(false);
        }
    }

    /**
     * @private
     * @param {BackupCodesInput.Steps} newStep
     * @param {boolean} [transition=true]
     */
    async _changeStep(newStep, transition = true) {
        const steps = Object.values(BackupCodesInput.Steps);
        const domUpdateHandler = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
            this._progressIndicator.setStep(steps.indexOf(newStep) + 1);
            this._backupCodesInput.step = newStep;
            if (newStep === BackupCodesInput.Steps.ENTER_CODE_1) {
                // Reset codes
                this._backupCodesInput.code1 = '';
                this._backupCodesInput.code2 = '';
            }
            this.$warning.textContent = this._warningText; // apply warning text as part of the change transition
        };
        if (transition) {
            const oldStep = steps.find(step => step !== newStep);
            this._backupCodesInput.shakeAnimationDisabled = true;
            await this._viewTransitionHandler.transitionView(
                domUpdateHandler,
                oldStep,
                newStep,
                /* awaitPreviousTransitions */ true,
            );
            this._backupCodesInput.shakeAnimationDisabled = false;
        } else {
            domUpdateHandler();
        }
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this._backupCodesInput.focus();
        }
    }

    /**
     * @private
     * @param {string} warning
     */
    _setWarning(warning) {
        this._warningText = warning;
        if (this.$warning.textContent === this._warningText) return;
        // Apply the changed text via a view transition. Preferably, we do this in the same view transition as a step
        // change, so we wait a little for whether such will be triggered.
        setTimeout(() => {
            if (this.$warning.textContent === this._warningText) return; // Change already applied, e.g. by _changeStep.
            // Otherwise, we have to run our own view transition.
            this._viewTransitionHandler.transitionView(
                () => { this.$warning.textContent = this._warningText; },
                this._backupCodesInput.step,
                this._backupCodesInput.step,
                /* awaitPreviousTransitions */ true,
            );
        }, 200);
    }
}

ImportBackupCodes.Pages = {
    ENTER_CODES: 'backup-codes',
};

ImportBackupCodes.Events = {
    IMPORT: 'import',
    RESET: 'reset',
};
