/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */
/* global I18n */
/* global LoginFile */

class FileImporter extends Nimiq.Observable {
    /**
     * @param {HTMLLabelElement} [$el]
     * @param {boolean} [displayFile = true]
     */
    constructor($el, displayFile = true) {
        super();
        this.$el = FileImporter._createElement($el);
        this._displayFile = displayFile;

        /** @type {HTMLElement} */
        this.$errorMessage = (this.$el.querySelector('.error-message'));
        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));

        // Add drag-and-drop handlers
        this.$el.addEventListener('dragover', this._onDragOver.bind(this));
        this.$el.addEventListener('dragleave', this._onDragEnd.bind(this));
        this.$el.addEventListener('dragend', this._onDragEnd.bind(this));
        this.$el.addEventListener('drop', this._onFileDrop.bind(this));

        this.$fileInput.addEventListener('change', e => this._onFileSelected(e));

        // Prevent dropping on window
        window.addEventListener('dragover', event => event.preventDefault());
        window.addEventListener('drop', event => event.preventDefault());
    }

    /**
     * @param {HTMLLabelElement} [$el]
     * @returns {HTMLLabelElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('label');
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

    /**
     * @param {Event} event
     */
    _onFileSelected(event) {
        /** @type {HTMLInputElement} */
        const eventTarget = (event.target);
        if (!eventTarget.files || !eventTarget.files.length) return;
        this._handleFile(eventTarget.files[0]);
    }

    /**
     * @param {File} file
     */
    _handleFile(file) {
        this.$errorMessage.textContent = '';

        const fileReader = new FileReader();
        fileReader.onload = async event => {
            this.$fileInput.value = '';
            /** @type {string} */
            // @ts-ignore Object is possibly 'null'. Property 'result' does not exist on type 'EventTarget'.
            const dataUrl = event.target.result;
            const decoded = await this._decodeFile(file);

            if (!decoded) {
                AnimationUtils.animate('shake', this.$el);
                this.$errorMessage.textContent = 'Could not read Login File.';
                return;
            }

            if (this._displayFile) {
                // Set image in UI
                const image = this.$el.querySelector('img') || document.createElement('img');
                image.src = dataUrl;
                this.$el.appendChild(image);
                image.classList.remove('pop-down');
                image.onload = () => image.classList.add('pop-down');
            }

            this.fire(FileImporter.Events.IMPORT, decoded, dataUrl);
        };
        fileReader.readAsDataURL(file);
    }

    /**
     * @param {File} file
     * @returns {Promise<string?>}
     */
    async _decodeFile(file) {
        try {
            const qrPosition = LoginFile.calculateQrPosition();
            return await QrScanner.scanImage(file, qrPosition, null, null, false, true);
        } catch (e) {
            return null;
        }
    }

    /**
     * @param {DragEvent} event
     */
    async _onFileDrop(event) {
        event.stopPropagation();
        event.preventDefault();
        if (!event.dataTransfer || !event.dataTransfer.files || !event.dataTransfer.files.length) return;
        this._handleFile(event.dataTransfer.files[0]);

        this._onDragEnd();
    }

    /**
     * @param {DragEvent} event
     */
    _onDragOver(event) {
        event.stopPropagation();
        event.preventDefault();

        // Remove the red message when background changes to blue
        this.$errorMessage.textContent = '';

        if (!event.dataTransfer) return;

        event.dataTransfer.dropEffect = 'copy';

        this.$el.classList.add('drag-over');
    }

    _onDragEnd() {
        this.$el.classList.remove('drag-over');
    }
}

FileImporter.Events = {
    IMPORT: 'import',
};
