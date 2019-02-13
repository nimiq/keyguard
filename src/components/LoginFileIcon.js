class LoginFileIcon { // eslint-disable-line no-unused-vars
    /**
     *
     * @param {HTMLDivElement?} [$el]
     */
    constructor($el) {
        this.colorClass = '';
        this.fileUnavailable = false;

        $el = $el || document.createElement('div');
        $el.classList.add('nq-icon', 'login-file-icon');

        const $lock = document.createElement('div');
        $lock.classList.add('lock');
        $el.appendChild($lock);
        const $grow = document.createElement('div');
        $grow.classList.add('flex-grow');
        $el.appendChild($grow);
        const $qrCodeIcon = document.createElement('div');
        $qrCodeIcon.classList.add('qr-code-icon');
        $el.appendChild($qrCodeIcon);

        this.$el = $el;
    }

    lock(colorClassName = '') {
        if (!this.fileUnavailable && colorClassName) {
            this.colorClass = colorClassName;
            this.$el.classList.add(this.colorClass);
        }
        this.$el.classList.add('locked');
    }

    setFileUnavailable(unavailable = true) {
        this.fileUnavailable = unavailable;
        this.$el.classList.toggle('file-unavailable', unavailable);
    }

    unlock() {
        if (this.colorClass) {
            this.$el.classList.remove(this.colorClass);
            this._colorClass = '';
        }
        this.$el.classList.remove('locked');
    }

    getElement() {
        return this.$el;
    }
}
