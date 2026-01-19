/* global BackupCodesIllustrationBase */

/**
 * @extends BackupCodesIllustrationBase<BackupCodesIllustration.Steps>
 */
class BackupCodesIllustration extends BackupCodesIllustrationBase {
    /**
     * @param {BackupCodesIllustration.Steps} step
     * @param {?HTMLDivElement} [$el]
     */
    constructor(step, $el) {
        super(BackupCodesIllustration.Steps, step, /* tagNames */ undefined, $el);
        this.$el.classList.add('backup-codes-illustration');
    }

    /**
     * @override
     * @protected
     * @param {HTMLDivElement} messageBubble
     * @param {BackupCodesIllustration.Steps} step
     * @returns {Record<'masked' | 'faded' | 'zoomed' | 'complete', boolean>}
     */
    _getMessageBubbleClasses(messageBubble, step) {
        const {
            INTRO,
            SEND_CODE_1,
            SEND_CODE_1_CONFIRM,
            SEND_CODE_2,
            SEND_CODE_2_CONFIRM,
            SUCCESS,
        } = BackupCodesIllustration.Steps;
        const codeIndex = this._messageBubbles.indexOf(messageBubble) + 1;

        const masked = step === INTRO
            || ([SEND_CODE_1, SEND_CODE_1_CONFIRM].some(s => s === step) && codeIndex === 2);
        const faded = ([SEND_CODE_1, SEND_CODE_1_CONFIRM].some(s => s === step) && codeIndex === 2)
            || ([SEND_CODE_2, SEND_CODE_2_CONFIRM].some(s => s === step) && codeIndex === 1);
        const zoomed = [SEND_CODE_1, SEND_CODE_1_CONFIRM, SEND_CODE_2, SEND_CODE_2_CONFIRM].some(s => s === step);
        const complete = ([SEND_CODE_1_CONFIRM, SEND_CODE_2].some(s => s === step) && codeIndex === 1)
            || [SEND_CODE_2_CONFIRM, SUCCESS].some(s => s === step);
        return { masked, faded, zoomed, complete }; // eslint-disable-line object-curly-newline
    }

    /**
     * @param {ViewTransition} viewTransition
     * @param {BackupCodesIllustration.Steps} oldStep
     * @param {BackupCodesIllustration.Steps} newStep
     * @param {HTMLElement} $viewport
     * @returns {Promise<void>}
     */
    static async customizeViewTransition(viewTransition, oldStep, newStep, $viewport) {
        return BackupCodesIllustrationBase._customizeViewTransition(
            viewTransition,
            oldStep,
            newStep,
            $viewport,
            BackupCodesIllustration.TopMessageBubbleForStep,
        );
    }
}

/**
 * @enum {'backup-codes-intro' | 'backup-codes-send-code-1' | 'backup-codes-send-code-1-confirm'
 *     | 'backup-codes-send-code-2' | 'backup-codes-send-code-2-confirm' | 'backup-codes-success'}
 */
BackupCodesIllustration.Steps = Object.freeze({ // Note: these are also used in ExportBackupCodes.Pages
    INTRO: 'backup-codes-intro',
    SEND_CODE_1: 'backup-codes-send-code-1',
    SEND_CODE_1_CONFIRM: 'backup-codes-send-code-1-confirm',
    SEND_CODE_2: 'backup-codes-send-code-2',
    SEND_CODE_2_CONFIRM: 'backup-codes-send-code-2-confirm',
    SUCCESS: 'backup-codes-success',
});

BackupCodesIllustration.TopMessageBubbleForStep = Object.freeze({
    [BackupCodesIllustration.Steps.INTRO]: 2,
    [BackupCodesIllustration.Steps.SEND_CODE_1]: 1,
    [BackupCodesIllustration.Steps.SEND_CODE_1_CONFIRM]: 1,
    [BackupCodesIllustration.Steps.SEND_CODE_2]: 2,
    [BackupCodesIllustration.Steps.SEND_CODE_2_CONFIRM]: 2,
    [BackupCodesIllustration.Steps.SUCCESS]: 2,
});
