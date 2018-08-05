/* global I18n */
/* global Nimiq */
class RemovalWarning extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        super();

        this.$el = RemovalWarning._createElement($el);

        this.$cancel = /** @type {HTMLElement} */ (this.$el.querySelector('.cancel'));
        this.$proceed = /** @type {HTMLElement} */ (this.$el.querySelector('.proceed'));

        this.$cancel.addEventListener('click', () => { this.fire(RemovalWarning.Events.CANCEL); });
        this.$proceed.addEventListener('click', () => { this.fire(RemovalWarning.Events.CONTINUE); });
    }

    /**
     * @param {HTMLElement} [$el]
     *
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('.removal-warning');

        $el.innerHTML = `
            <h1>Key Removal</h1>
            <div class="grow"></div>
            <div class="spacing-bottom center warning" style="max-width: 75rem;">
                <strong>You are about to remove a key. This operation cannot be undone. 
                To be able to reimport the key, make sure you have a backup of it.</strong>
            </div>
            <div class="grow"></div>
            <div>
                <button class="small cancel">Cancel</button>
                <button class="small proceed">Proceed</button>
            </div>
        `;

        I18n.translateDom($el);

        return $el;
    }
}

RemovalWarning.Events = {
    CANCEL: 'warning-cancel',
    CONTINUE: 'warning-continue',
};
