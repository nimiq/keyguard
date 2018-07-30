/* global Nimiq */
/* global I18n */

class DownloadKeyfile extends Nimiq.Observable {
    /**
     * @param {?HTMLElement} $el
     */
    constructor($el) {
        super();
        this.$el = DownloadKeyfile._createElement($el);

        this.$downloadButton = /** @type {HTMLElement} */ (this.$el.querySelector('.download'));
        this.$continueButton = /** @type {HTMLElement} */ (this.$el.querySelector('.continue'));

        this.$downloadButton.addEventListener('click', () => this.fire(DownloadKeyfile.Events.DOWNLOADED));
        this.$continueButton.addEventListener('click', () => this.fire(DownloadKeyfile.Events.CONTINUE));
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('download-keyfile');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h1>Download Loginfile</h1>
            <h2 secondary>
                The file is encrypted with the passphrase you just specified. You can recover your accounts from it.
            </h2>
            <div class="grow"></div>
            <button class="download">Download</button>
            <div class="grow"></div>
            <button class="continue" disabled>Continue</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }
}

DownloadKeyfile.Events = {
    DOWNLOADED: 'keyfile-downloaded',
    CONTINUE: 'keyfile-continue',
};
