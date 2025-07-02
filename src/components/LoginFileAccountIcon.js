/* global LoginFileConfig */
/* global IqonHash */

class LoginFileAccountIcon { // eslint-disable-line no-unused-vars
    /**
     * @param {string} [address]
     * @param {HTMLDivElement} [$el]
     */
    constructor(address, $el) {
        this._address = address;

        this.$el = LoginFileAccountIcon._createElement($el);

        this._update();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {string} address
     */
    set address(address) {
        this._address = address;
        this._update();
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        $element.classList.add('login-file-account-icon');
        const $img = new Image();
        // Converted to data-URL with https://yoksel.github.io/url-encoder/
        // eslint-disable-next-line max-len
        $img.src = "data:image/svg+xml,%3Csvg width='16' height='28' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='.5' fill='%23fff'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M6.36 18.85h-2a.34.34 0 0 1-.34-.34v-2.04c0-.18.15-.34.33-.34h2.01c.19 0 .34.16.34.34v2.04c0 .19-.15.34-.34.34Zm-1.59-2.04a.08.08 0 0 0-.08.09v1.19c0 .04.04.08.08.08h1.18c.04 0 .08-.04.08-.08v-1.2a.08.08 0 0 0-.08-.08H4.77ZM4.35 21.57h2.01c.19 0 .34.15.34.34v2.04c0 .18-.15.34-.34.34h-2a.34.34 0 0 1-.34-.34V21.9c0-.19.15-.34.33-.34Zm1.6 2.04c.04 0 .08-.04.08-.09v-1.19a.08.08 0 0 0-.08-.08H4.77a.08.08 0 0 0-.08.08v1.2c0 .04.04.08.08.08h1.18ZM9.71 16.13h2.01c.19 0 .34.16.34.34v2.04c0 .19-.15.34-.34.34h-2a.34.34 0 0 1-.34-.34v-2.04c0-.18.15-.34.33-.34Zm1.6 2.04c.04 0 .08-.04.08-.08v-1.2a.08.08 0 0 0-.08-.08h-1.18a.08.08 0 0 0-.08.09v1.19c0 .04.04.08.08.08h1.18Z'/%3E%3Cpath d='M7.37 17.58h.33c.14 0 .26-.12.26-.26a.25.25 0 0 0-.26-.25.08.08 0 0 1-.08-.09v-.5a.25.25 0 0 0-.25-.26.25.25 0 0 0-.25.25v.85c0 .14.11.26.25.26ZM8.37 16.73c.05 0 .09.04.09.08v1.87c0 .14.11.26.25.26s.25-.12.25-.26v-2.2a.25.25 0 0 0-.25-.26h-.34a.25.25 0 0 0-.25.25c0 .15.12.26.25.26ZM5.95 19.7c0 .14.1.26.25.26h1.17c.14 0 .25-.12.25-.26v-1.36a.25.25 0 0 0-.25-.25.25.25 0 0 0-.25.25v1.02c0 .05-.04.09-.09.09H6.2a.25.25 0 0 0-.25.25Z'/%3E%3Cpath d='M5.02 19.45a.25.25 0 0 0-.25.25v.85c0 .05-.03.09-.08.09h-.34a.25.25 0 0 0-.25.25c0 .14.12.25.25.25h4.36c.14 0 .25-.1.25-.25v-1.02a.25.25 0 0 0-.25-.25.25.25 0 0 0-.25.25v.68c0 .05-.04.09-.09.09H5.36a.08.08 0 0 1-.08-.09v-.85a.25.25 0 0 0-.26-.25ZM8.63 21.9a.25.25 0 0 0-.26-.25h-1a.25.25 0 0 0-.25.26v1.36c0 .14.11.25.25.25s.25-.11.25-.25v-1.02c0-.05.04-.09.08-.09h.67c.14 0 .26-.11.26-.25ZM11.72 23.7H8.88a.08.08 0 0 1-.09-.1v-.67a.25.25 0 0 0-.25-.26.25.25 0 0 0-.25.26v1.02c0 .14.11.25.25.25h3.18c.14 0 .26-.11.26-.25a.25.25 0 0 0-.26-.26Z'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M10.55 23.01h-1a.25.25 0 0 1-.25-.25v-1.02c0-.14.1-.26.25-.26h1c.14 0 .25.12.25.26v1.02c0 .14-.11.25-.25.25ZM9.88 22a.08.08 0 0 0-.08.09v.34c0 .05.04.08.08.08h.34c.04 0 .08-.03.08-.08v-.34a.08.08 0 0 0-.08-.09h-.34Z'/%3E%3Cpath d='M11.56 20.47a.25.25 0 0 0-.25.25v2.2c0 .15.1.26.25.26.14 0 .25-.11.25-.25v-2.21a.25.25 0 0 0-.25-.25ZM11.8 19.53a.25.25 0 0 0-.24-.25H9.7a.25.25 0 0 0-.25.25v1.02c0 .14.12.26.25.26.14 0 .26-.12.26-.26v-.68c0-.05.03-.08.08-.08h1.5c.15 0 .26-.12.26-.26Z'/%3E%3C/g%3E%3Ccircle opacity='.4' cx='7.97' cy='7.95' r='3.26' fill='%23fff'/%3E%3C/svg%3E%0A";
        while ($element.firstChild) { $element.removeChild($element.firstChild); }
        $element.appendChild($img);

        return $element;
    }

    _update() {
        if (!this._address) {
            return;
        }

        const bgColorClassName = LoginFileConfig[IqonHash.getBackgroundColorIndex(this._address)].className;
        this.$el.classList.add(bgColorClassName);
    }
}
