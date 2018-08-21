/* global TopLevelApi */
/* global Create */

class CreateApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {CreateRequest} request
     */
    async onRequest(request) {
        const handler = new Create(request, this.resolve.bind(this), this.reject.bind(this));
        handler.run();
    }
}
