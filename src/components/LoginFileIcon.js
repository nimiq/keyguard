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

        /* eslint-disable max-len */
        $el.innerHTML = `
            <svg class="nq-icon lock">
                <use class="lock-unlocked" xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-lock-unlocked"/>
                <use class="lock-locked" xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-lock-locked"/>
            </svg>
            <svg class="nq-icon qr-code"><use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-qr-code"/></svg>
        `;
        /* eslint-enable max-len */

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
