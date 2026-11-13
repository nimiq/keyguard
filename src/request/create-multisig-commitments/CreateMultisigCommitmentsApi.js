/* global TopLevelApi */
/* global CreateMultisigCommitments */
/* global Errors */

/**
 * Round 1 of signing a multisig transaction with MuSig2: creates this signer's commitments and the signing state, which
 * the caller needs to pass to the sign-multisig-transaction request in round 2.
 *
 * @extends {TopLevelApi<KeyguardRequest.CreateMultisigCommitmentsRequest>}
 */
class CreateMultisigCommitmentsApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.CreateMultisigCommitmentsRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.CreateMultisigCommitmentsRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.CreateMultisigCommitmentsRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = /** @type {string} */ (this.parseLabel(request.keyLabel, false, 'keyLabel'));
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel, true, 'senderLabel');
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel, true, 'recipientLabel');
        parsedRequest.transaction = this.parseTransaction(request);
        parsedRequest.multisigConfig = this.parseMultisigConfig(request.multisigConfig);
        parsedRequest.multisigAddress = this.parseMultisigAddress(
            parsedRequest.transaction,
            parsedRequest.multisigConfig.publicKeys,
            parsedRequest.multisigConfig.numberOfSigners,
        );

        return parsedRequest;
    }

    /**
     * @param {unknown} object
     * @returns {Parsed<KeyguardRequest.CreateMultisigCommitmentsRequest>['multisigConfig']}
     */
    parseMultisigConfig(object) {
        if (!object || typeof object !== 'object') {
            throw new Errors.InvalidRequestError('multisigConfig must be an object');
        }
        const config = /** @type {Record<string, unknown>} */ (object);

        const publicKeys = this.parseMultisigPublicKeys(config.publicKeys);
        const numberOfSigners = this.parsePositiveInteger(config.numberOfSigners, false, 'numberOfSigners');
        if (numberOfSigners > publicKeys.length) {
            throw new Errors.InvalidRequestError('numberOfSigners must not exceed the number of public keys');
        }
        const userName = this.parseLabel(config.userName, true, 'userName');

        return {
            publicKeys,
            numberOfSigners,
            userName,
        };
    }

    get Handler() {
        return CreateMultisigCommitments;
    }
}
