/* global TopLevelApi */
/* global Connect */
/* global Errors */

const PermissionKeyguardCommands = [
    /** @type {KeyguardRequest.KeyguardCommand} */ ('remove-key'),
    /** @type {KeyguardRequest.KeyguardCommand} */ ('export'),
    /** @type {KeyguardRequest.KeyguardCommand} */ ('change-password'),
    // /** @type {KeyguardRequest.KeyguardCommand} */ ('sign-transaction'), // Already third-party whitelisted in Hub
    /** @type {KeyguardRequest.KeyguardCommand} */ ('sign-multisig-transaction'),
    // /** @type {KeyguardRequest.KeyguardCommand} */ ('sign-message'), // Already third-party whitelisted in Hub
    /** @type {KeyguardRequest.KeyguardCommand} */ ('derive-address'),
    // Bitcoin
    /** @type {KeyguardRequest.KeyguardCommand} */ ('sign-btc-transaction'),
    /** @type {KeyguardRequest.KeyguardCommand} */ ('derive-btc-xpub'),
    // Swap
    /** @type {KeyguardRequest.KeyguardCommand} */ ('sign-swap'),
];

/** @extends {TopLevelApi<KeyguardRequest.ConnectRequest>} */
class ConnectApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.ConnectRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.ConnectRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.requestedKeyPaths = request.requestedKeyPaths.map(
            path => this.parsePath(path, 'requestedKeyPaths'),
        );
        parsedRequest.appLogoUrl = /** @type {URL} */ (this.parseLogoUrl(request.appLogoUrl, false, 'appLogoUrl'));
        parsedRequest.permissions = this.parsePermissions(request.permissions);
        parsedRequest.challenge = /** @type {string} */ (this.parseMessage(request.challenge, true));

        // Temporary limitation of permissions until UI can represent other permissions
        // When adding new permissioned request types here, the Connect UI must be updated to be able
        // to display these permissions to the user.
        if (parsedRequest.permissions.length !== 1 || parsedRequest.permissions[0] !== 'sign-multisig-transaction') {
            throw new Errors.InvalidRequestError(
                'Only the sign-multisig-transaction permission is supported currently',
            );
        }

        return parsedRequest;
    }

    /**
     * @param {unknown} permissions
     * @returns {KeyguardRequest.KeyguardCommand[]}
     */
    parsePermissions(permissions) {
        if (!Array.isArray(permissions)) {
            throw new Errors.InvalidRequestError('permissions must be an array');
        }

        for (const permission of permissions) {
            if (!PermissionKeyguardCommands.includes(permission)) {
                throw new Errors.InvalidRequestError(`invalid permission requested: ${permission}`);
            }
        }

        return permissions;
    }

    get Handler() {
        return Connect;
    }
}
