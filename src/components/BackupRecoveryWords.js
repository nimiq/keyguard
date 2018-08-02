/* global Nimiq */
/* global I18n */
class BackupRecoveryWords extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} [$el]
     */
    constructor($el) {
        super();

        /** @type {HTMLElement} */
        this.$el = BackupRecoveryWords._createElement($el);

        /** @type {HTMLElement} */
        this.$confirmButton = (this.$el.querySelector(".continue"));
        this.$container = (this.$el.querySelector(".words-container-container"));

        this._recoveryWords = new RecoveryWords(this.$container, false);

        this.$confirmButton.addEventListener('click', () => {
            this.fire(BackupRecoveryWords.Events.CONTINUE);
        });
    }

    /**
     * @param {Nimiq.Entropy | Uint8Array} entropy
     */
    set entropy(entropy) {
        this._recoveryWords.entropy = entropy;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h1>Backup your 24 Recovery Words</h1>
            <h2 secondary>
                Write down and physically store the complete following list of 24 Account Recovery Words
                at a <strong>SAFE and SECRET</strong> place to recover this account in the future.
            </h2>
            <div class="grow"></div>
            <div class="words-container-container"></div>
            <div class="spacing-bottom center warning">
                <strong>Anyone with access to these words can steal all your funds!</strong>
            </div>
            <div class="grow"></div>
            <button class="continue">Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }
}

BackupRecoveryWords.Events = {
    CONTINUE: 'continue',
};
