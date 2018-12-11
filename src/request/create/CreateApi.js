/* global TopLevelApi */
/* global Create */
/* global Errors */

class CreateApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.CreateRequest} request
     */
    async onRequest(request) {
        const parsedRequest = this.parseRequest(request);
        const handler = new Create(parsedRequest, this.resolve.bind(this), this.reject.bind(this));

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));

        handler.run();
    }

    /**
     * @param {KeyguardRequest.CreateRequest} request
     * @returns {KeyguardRequest.CreateRequest}
     */
    parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.defaultKeyPath = this.parsePath(request.defaultKeyPath, 'defaultKeyPath');

        return parsedRequest;
    }
}
