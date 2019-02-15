/* global TopLevelApi */
/* global SignMessage */
/* global Errors */

class SignMessageApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {ParsedSignMessageRequest} request
     */
    async onRequest(request) {
        /** @type {HTMLDivElement} */
        const $page = (document.getElementById(SignMessage.Pages.AUTHORIZE));

        const handler = new SignMessage(
            $page,
            request,
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
        TopLevelApi.setLoading(false);
    }

    /**
     * @param {KeyguardRequest.SignMessageRequest} request
     * @returns {Promise<ParsedSignMessageRequest>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.message = this.parseMessage(request.message);
        parsedRequest.signerLabel = this.parseLabel(request.signerLabel);
        parsedRequest.signer = this.parseAddress(request.signer, 'signer');

        return parsedRequest;
    }
}
