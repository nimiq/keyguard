/* global RequestParser */
/* global TopLevelApi */
/* global SignMessage */
/* global Errors */

class SignMessageApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignMessageRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await RequestParser.parse(request, 'SignMessageRequest');
        /** @type {HTMLDivElement} */
        const $page = (document.getElementById(SignMessage.Pages.AUTHORIZE));

        const handler = new SignMessage(
            $page,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

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
