/* global Nimiq */
/* global I18n */
/* global RecoveryWords */
class EnterRecoveryWords extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {HTMLFormElement} [$el]
     */
    constructor($el) {
        super();

        this.$el = EnterRecoveryWords._createElement($el);

        /** @type {HTMLElement} */
        const $wordsInput = (this.$el.querySelector('.input'));
        /** @type {HTMLButtonElement} */
        const $wordsConfirm = (this.$el.querySelector('button'));

        const recoveryWords = new RecoveryWords($wordsInput, true);
        recoveryWords.on(RecoveryWords.Events.COMPLETE, () => { $wordsConfirm.disabled = false; });
        recoveryWords.on(RecoveryWords.Events.INCOMPLETE, () => { $wordsConfirm.disabled = true; });
        recoveryWords.on(RecoveryWords.Events.INVALID, () => { $wordsConfirm.disabled = true; });

        this.$el.addEventListener('submit', event => {
            event.preventDefault();
            if (recoveryWords.mnemonic) {
                this.fire(EnterRecoveryWords.Events.COMPLETE, recoveryWords.mnemonic, recoveryWords.mnemonicType);
            }
        });

        this._recoveryWords = recoveryWords;
    }

    /**
     * @param {?HTMLFormElement} [$el]
     * @returns {HTMLFormElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('form');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h1 data-i18n="enter-recovery-words-heading">Import from recovery words</h1>
            <h2 data-i18n="enter-recovery-words-subheading">Please enter your 24 recovery words.</h2>
            <div class="grow"></div>
            <div class="input"></div>
            <div class="grow"></div>
            <button data-i18n="continue" type="submit" disabled>Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    focus() {
        this._recoveryWords.focus();
    }
}

EnterRecoveryWords.Events = {
    COMPLETE: 'enter-recovery-words-complete',
};
