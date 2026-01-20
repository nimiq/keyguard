/* global I18n */
/* global AnimationUtils */
/* global BackupCodes */
/* global BackupCodesIllustrationBase */

/**
 * @extends {BackupCodesIllustrationBase<BackupCodesInput.Steps, 'form', 'label', 'textarea'>}
 */
class BackupCodesInput extends BackupCodesIllustrationBase {
    /**
     * @param {BackupCodesInput.Steps} step
     * @param {?HTMLFormElement} [$el]
     */
    constructor(step, $el) {
        super(BackupCodesInput.Steps, step, { container: 'form', messageBubble: 'label', code: 'textarea' }, $el);
        this.$el.classList.add('backup-codes-input');

        /** @type {[?string, ?string]} */
        this._backupCodes = [null, null]; // successfully validated codes
        this._ignoreInputEvents = false;
        this._disableShakeAnimation = false;

        for (const codeIndex of /** @type {[1, 2]} */([1, 2])) {
            const $code = this._codes[codeIndex - 1];
            $code.name = `backup-code-${codeIndex}`;
            $code.spellcheck = false;
            $code.autocapitalize = 'off';
            $code.autocomplete = 'off';
            $code.setAttribute('autocorrect', 'off');
            $code.placeholder = I18n.translatePhrase('backup-codes-input-placeholder');
            $code.setAttribute('data-i18n-placeholder', 'backup-codes-input-placeholder'); // auto-update on lang change

            $code.addEventListener('keydown', event => {
                if (this._ignoreInputEvents) return;
                const key = event.key;
                if (key.length === 1 && !BackupCodes.isValidCharacter(key)) {
                    // Omit characters outside the allowed alphabet. We don't simply call _sanitizeAndValidateCode to
                    // avoid a bogus undo history entry getting created while the sanitized code didn't actually change.
                    event.preventDefault();
                    this.fire(BackupCodesInput.Events.INVALID_EDIT, codeIndex);
                    if (this._disableShakeAnimation) return;
                    AnimationUtils.animate('shake-only', this._messageBubbles[codeIndex - 1]);
                }
                if (event.key === 'Enter' || event.key === 'Escape') {
                    // Interpret as the user trying to submit the code. We don't include Tab to not break the browser's
                    // default behavior of switching to the next UI element. For Tab, _sanitizeAndValidateCode is called
                    // via a blur event.
                    event.preventDefault();
                    this._sanitizeAndValidateCode(codeIndex);
                }
            });
            $code.addEventListener('input', () => {
                if (this._ignoreInputEvents) return;
                this.fire(BackupCodesInput.Events.CODE_EDIT, codeIndex, $code.value);
                this._sanitizeAndValidateCode(codeIndex, /* onlyFeedbackOnInvalidCharacters */ true);
            });
            $code.addEventListener('blur', () => this._sanitizeAndValidateCode(codeIndex));
        }
    }

    /**
     * @override
     * @type {BackupCodesInput.Steps}
     */
    get step() {
        // Just delegate to parent getter.
        // Note that we redeclare the getter, because when overwriting a setter, the getter needs to be overridden, too.
        return super.step;
    }

    /**
     * @override
     * @param {BackupCodesInput.Steps} step
     */
    set step(step) {
        super.step = step;
        this._updateDisabledStates();
    }

    /**
     * @override
     * @param {boolean} isLoading
     */
    set loading(isLoading) {
        super.loading = isLoading;
        this._updateDisabledStates();
    }

    /**
     * @param {boolean} disabled
     */
    set shakeAnimationDisabled(disabled) {
        this._disableShakeAnimation = disabled;
        this.$el.classList.toggle('disable-shake-animation', disabled);
    }

    focus() {
        const $codeToFocus = this._codes.find($code => !$code.disabled);
        if (!$codeToFocus) return;
        $codeToFocus.focus();
    }

    /**
     * @override
     * @protected
     * @param {1 | 2} codeIndex
     * @param {string} code
     */
    _setCode(codeIndex, code) {
        this._codes[codeIndex - 1].value = code;
        this.fire(BackupCodesInput.Events.CODE_EDIT, codeIndex, code);
        this._sanitizeAndValidateCode(codeIndex);
    }

    /**
     * @override
     * @protected
     * @param {HTMLLabelElement} messageBubble
     * @param {BackupCodesInput.Steps} step
     * @returns {Record<'masked' | 'faded' | 'zoomed' | 'complete', boolean>}
     */
    _getMessageBubbleClasses(messageBubble, step) {
        const { ENTER_CODE_1 } = BackupCodesInput.Steps;
        const codeIndex = this._messageBubbles.indexOf(messageBubble) + 1;

        const masked = false;
        const faded = codeIndex === (step === ENTER_CODE_1 ? 2 : 1);
        const zoomed = true;
        const complete = false;
        return { masked, faded, zoomed, complete }; // eslint-disable-line object-curly-newline
    }

    /**
     * @private
     */
    _updateDisabledStates() {
        for (let i = 0; i <= 1; i++) {
            const $messageBubble = this._messageBubbles[i];
            const $code = this._codes[i];
            $code.disabled = ['masked', 'faded', 'loading'].some(cl => $messageBubble.classList.contains(cl));
        }
    }

    /**
     * @private
     * @param {1 | 2} codeIndex
     * @param {boolean} [onlyFeedbackOnInvalidCharacters=false]
     */
    _sanitizeAndValidateCode(codeIndex, onlyFeedbackOnInvalidCharacters = false) {
        const $code = this._codes[codeIndex - 1];
        const code = $code.value;
        if (code === this._backupCodes[codeIndex - 1]) return; // duplicate invocation for successfully validated code

        // Sanitize code
        // Iterate code via its iterator to correctly handle astral unicode characters represented as surrogate pairs.
        const sanitizedCode = [...code].filter(char => BackupCodes.isValidCharacter(char)).join('');
        if (sanitizedCode !== code) {
            // Set the sanitized code. Adapt the cursor position for the omitted characters. We can assume that all
            // omitted characters were before the cursor or selection end, as the cursor is typically placed after the
            // characters that have been entered, pasted or dragged-dropped, and after the selection start, if a range
            // is selected, as the change is typically contained by the range.
            const omittedCharacterCount = code.length - sanitizedCode.length;
            const selectionStart = $code.selectionStart;
            const selectionEnd = $code.selectionEnd;
            try {
                // Replace text via execCommand, such that the change is added to the undo history.
                this._ignoreInputEvents = true; // ignore input events triggered by execCommand
                if (!document.execCommand
                    || !document.execCommand('undo', false) // remove the user's history entry
                    || !document.execCommand('selectAll', false)
                    || !document.execCommand('insertText', false, sanitizedCode)) {
                    // fallback
                    $code.value = sanitizedCode;
                }
            } finally {
                this._ignoreInputEvents = false;
            }
            // Restore cursor/selection.
            $code.selectionEnd = Math.max(0, selectionEnd - omittedCharacterCount);
            $code.selectionStart = Math.min(selectionStart, $code.selectionEnd);
        }

        // Validate code
        if (BackupCodes.isValidBackupCode(sanitizedCode)) {
            if (sanitizedCode === this._backupCodes[codeIndex - 1]) return; // avoid duplicate events
            this._backupCodes[codeIndex - 1] = sanitizedCode;
            this.fire(BackupCodesInput.Events.CODE_COMPLETE, codeIndex, sanitizedCode);
            if (!this._backupCodes[0] || !this._backupCodes[1]) return;
            this.fire(BackupCodesInput.Events.CODES_COMPLETE, this._backupCodes);
        } else {
            this._backupCodes[codeIndex - 1] = null;
            if (!code || (onlyFeedbackOnInvalidCharacters && sanitizedCode === code)) return;
            this.fire(BackupCodesInput.Events.INVALID_EDIT, codeIndex);
            if (this._disableShakeAnimation) return;
            AnimationUtils.animate('shake-only', this._messageBubbles[codeIndex - 1]);
        }
    }

    /**
     * @param {ViewTransition} viewTransition
     * @param {BackupCodesInput.Steps} oldStep
     * @param {BackupCodesInput.Steps} newStep
     * @param {HTMLElement} $viewport
     * @returns {Promise<void>}
     */
    static async customizeViewTransition(viewTransition, oldStep, newStep, $viewport) {
        return BackupCodesIllustrationBase._customizeViewTransition(
            viewTransition,
            oldStep,
            newStep,
            $viewport,
            BackupCodesInput.TopMessageBubbleForStep,
        );
    }
}

/** @enum {'backup-codes-enter-code-1' | 'backup-codes-enter-code-2'} */
BackupCodesInput.Steps = Object.freeze({
    ENTER_CODE_1: 'backup-codes-enter-code-1',
    ENTER_CODE_2: 'backup-codes-enter-code-2',
});

BackupCodesInput.TopMessageBubbleForStep = Object.freeze({
    [BackupCodesInput.Steps.ENTER_CODE_1]: 1,
    [BackupCodesInput.Steps.ENTER_CODE_2]: 2,
});

BackupCodesInput.Events = Object.freeze({
    CODE_EDIT: 'code-edit',
    INVALID_EDIT: 'invalid-edit',
    CODE_COMPLETE: 'code-complete',
    CODES_COMPLETE: 'codes-complete',
});
