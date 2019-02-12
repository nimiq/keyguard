/* global Nimiq */
/* global I18n */

class DownloadKeyfile extends Nimiq.Observable {
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        super();

        this.$el = DownloadKeyfile._createElement($el);

        this.$downloadButtons = this.$el.querySelectorAll('.download');

        this.$downloadButtons.forEach(el => el.addEventListener('click', () => this._onDownloadClick()));
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('download-keyfile', 'actionbox');

        /* eslint-disable max-len */
        $el.innerHTML = `
            <h2 class="protected" data-i18n="downloadkeyfile-heading-protected">Your Key File is protected!</h2>
            <h2 class="unprotected" data-i18n="downloadkeyfile-heading-unprotected">Your Key File is not protected!</h2>

            <p data-i18n="downloadkeyfile-safe-place" class="nq-text">Store it in a safe place. If you lose it, it cannot be recovered!</p>

            <button class="download protected nq-button inverse" data-i18n="downloadkeyfile-download">Download LoginFile</button>
            <button class="download unprotected nq-button inverse" data-i18n="downloadkeyfile-download-anyway">Download anyway</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {Uint8Array} secret
     * @param {boolean} isProtected
     */
    setSecret(secret, isProtected) { // eslint-disable-line no-unused-vars
        // TODO Generate file from secret

        this.$el.classList.toggle('nq-bg-orange', !isProtected);
        this.$el.classList.toggle('nq-bg-green', isProtected);
        this.$downloadButtons.forEach(el => {
            el.classList.toggle('orange', !isProtected);
            el.classList.toggle('green', isProtected);
        });

        this.$el.classList.toggle('protected', isProtected);
        this.$el.classList.toggle('unprotected', !isProtected);
    }

    _onDownloadClick() {
        // TODO Generate file and wait for download completed
        this.fire(DownloadKeyfile.Events.DOWNLOADED);
    }
}

DownloadKeyfile.Events = {
    DOWNLOADED: 'keyfile-downloaded',
};
