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

        // TODO Re-add the drop target interaction and event listeners

        this.$el.addEventListener('click', this._openFileInput.bind(this));
        this.$fileInput.addEventListener('change', e => this._onFileSelected(e));
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('file-import');

        $el.innerHTML = `
            <h3 class="nq-h3 nq-light-blue" data-i18n="file-import-prompt">Drag here or click to upload</h3>
            <span class="error-message"></span>
            <div class="qr-code"></div>
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
     * @param {Event} event
     */
    _onFileSelected(event) {
        /** @type {HTMLInputElement} */
        const eventTarget = (event.target);
        if (eventTarget && eventTarget.files && eventTarget.files.length === 1) {
            this.$errorMessage.textContent = '';
            const files = eventTarget.files;

            const fileReader = new FileReader();
            fileReader.onload = async e => {
                const qrCodeFound = await this._readFile(files[0]);
                this.$fileInput.value = '';
                if (!qrCodeFound) return;

                // Set image in UI
                const image = document.createElement('img');
                // @ts-ignore Object is possibly 'null'. Property 'result' does not exist on type 'EventTarget'.
                image.src = e.target.result;
                this.$el.appendChild(image);
                image.onload = () => { image.classList.add('pop-down'); };
            };
            fileReader.readAsDataURL(files[0]);
        }
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$el);
        this.$errorMessage.textContent = 'Could not read LoginFile.';
    }

    /**
     * @param {File} file
     * @returns {Promise<boolean>}
     */
    async _readFile(file) {
        const qrPosition = LoginFile.calculateQrPosition();
        try {
            const decoded = await QrScanner.scanImage(file, qrPosition, null, null, false, true);
            this.fire(FileImport.Events.IMPORT, decoded);
            return true;
        } catch (e) {
            this._onQrError();
            return false;
        }
    }
}

FileImport.Events = {
    IMPORT: 'import',
};
