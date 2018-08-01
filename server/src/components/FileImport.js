/* global Nimiq */
/* global AnimationUtils */
/* global QrScanner */

class FileImport extends Nimiq.Observable {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = FileImport._createElement($el);

        /** @type {HTMLInputElement} */
        this.$fileInput = (this.$el.querySelector('input'));
        /** @type {HTMLDivElement} */
        this.$importIcon = (this.$el.querySelector('.import-file-icon'));

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
            <div class="file-import-icon"></div>
            <button>Select file</button>
            <input type="file" accept="image/*">`;

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
        // @ts-ignore
        const files = event.target.files;
        this._readFile(files[0]);
        this.$fileInput.value = '';
    }

    _onQrError() {
        AnimationUtils.animate('shake', this.$importIcon);
        // XToast.error('Couldn\'t read Backup File');
    }

    /**
     * @param {File} file
     */
    async _readFile(file) {
        // TODO Add WalletBackup to keyguard-next code base
        // const qrPosition = WalletBackup.calculateQrPosition();
        const qrPosition = {
            x: 156,
            y: 548.6886,
            width: 173.4,
            height: 173.4,
            size: 185.4,
            padding: 12,
        };

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
