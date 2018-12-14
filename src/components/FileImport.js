/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */
/* global LoginFile */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // TODO Re-add the drop target interaction and event listeners?

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', this._onFileSelected.bind(this));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 data-i18n="file-import-prompt">Drop your Key File here</h3>
            <span class="click-hint" data-i18n="file-import-click-hint">Or click to select a file.</span>
            <span class="error-message"></span>
            <input type="file" accept="image/*">
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @returns {HTMLElement}
     */
    getElement() {
        return this.$el;
    }

    _openFileInput() {
        this.$fileInput.click();
    }

    /**
     * @param {DOMEvent} event
     */
    _onFileSelected(event) {
        this.$errorMessage.textContent = '';
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read Key File.';
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        const qrPosition = LoginFile.calculateQrPosition();
        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
        } catch (e) {
            this._onQrError();
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
