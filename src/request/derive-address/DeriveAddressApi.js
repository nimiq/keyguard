/* global TopLevelApi */
/* global DeriveAddress */
/* global RequestParser */
/* global Errors */

class DeriveAddressApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.DeriveAddressRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await RequestParser.parse(request, 'DeriveAddressRequest');
        const handler = new DeriveAddress(parsedRequest, this.resolve.bind(this), this.reject.bind(this));

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));

        handler.run();
    }
}
