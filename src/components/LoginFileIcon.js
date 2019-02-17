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

        $el.innerHTML = `
            <div class="nq-icon lock"></div>
            <div class="flex-grow"></div>
            <div class="nq-icon qr-code-icon"></div>
        `;

        this.$el = $el;
    }

    /**
     *
     * @param {string} [colorClassName = ''] - only relevant for LoginFileIcon without `setFileUnavailable(true)`
     */
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
