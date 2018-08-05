/* global I18n */
/* global Nimiq */
class RemovalWarning extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     * @param {RemoveKeyRequest} request
     */
    constructor($el, request) {
        console.log(request);
        super();

        this.$el = RemovalWarning._createElement($el, request);

        this.$cancel = /** @type {HTMLElement} */ (this.$el.querySelector('.cancel'));
        this.$proceed = /** @type {HTMLElement} */ (this.$el.querySelector('.proceed'));

        this.$cancel.addEventListener('click', () => { this.fire(RemovalWarning.Events.CANCEL); });
        this.$proceed.addEventListener('click', () => { this.fire(RemovalWarning.Events.CONTINUE); });
    }

    /**
     * @param {HTMLElement} [$el]
     * @param {RemoveKeyRequest} request
     *
     * @returns {HTMLElement}
     */
    static _createElement($el, request) {
        $el = $el || document.createElement('div');
        $el.classList.add('.removal-warning');

        $el.innerHTML = `
            <h1>Key Removal</h1>
            <div class="grow"></div>
            <div class="spacing-bottom center warning" style="max-width: 75rem; display: block; ">
                <svg width="144" height="144" viewBox="0 0 24 24">
                    <path fill="black" d="M2.2,16.06L3.88,12L2.2,7.94L6.26,6.26L7.94,2.2L12,3.88L16.06,2.2L17.74,6.26L21.8,7.94L20.12,12L21.8,16.06L17.74,17.74L16.06,21.8L12,20.12L7.94,21.8L6.26,17.74L2.2,16.06M13,17V15H11V17H13M13,13V7H11V13H13Z" />
                </svg><br>
                You are about to remove <strong class="key-label-friendlyid">a key</strong>. This operation cannot be undone. 
                To be able to reimport the key, make sure you have a backup of it.
            </div>
            <div class="grow"></div>
            <div>
                <button class="small cancel">Cancel</button>
                <button class="small proceed">Proceed</button>
            </div>
        `;

        /** @type {HTMLElement} */
        const $keyLabelFriendlyId = ($el.querySelector('.key-label-friendlyid'));
        RemoveKeyApi.get_friendly_key_description($keyLabelFriendlyId, request);


        I18n.translateDom($el);

        return $el;
    }
}

RemovalWarning.Events = {
    CANCEL: 'warning-cancel',
    CONTINUE: 'warning-continue',
};
