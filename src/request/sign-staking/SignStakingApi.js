/* global TopLevelApi */
/* global SignStaking */
/* global Errors */
/* global Nimiq */

/** @extends {TopLevelApi<KeyguardRequest.SignStakingRequest>} */
class SignStakingApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignStakingRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignStakingRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignStakingRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);

        const type = this.parseStakingType(request.type);
        parsedRequest.type = type;
        let isSignalling = false;
        switch (type) {
            case SignStakingApi.IncomingStakingType.CREATE_STAKER:
            case SignStakingApi.IncomingStakingType.UPDATE_STAKER: {
                parsedRequest.delegation = this.parseAddress(request.delegation, 'delegation');
                const data = new Nimiq.SerialBuffer(
                    1 // Data type
                    + 1 // Option<> indicator
                    + Nimiq.Address.SERIALIZED_SIZE // Validator address (delegation)
                    + Nimiq.SignatureProof.SINGLE_SIG_SIZE, // Staker signature
                );
                data.writeUint8(type);
                data.writeUint8(1); // Delegation is optional, this signals that we are including it.
                data.write(parsedRequest.delegation.serialize());
                request.data = data;
                isSignalling = type === SignStakingApi.IncomingStakingType.UPDATE_STAKER;
                break;
            }
            case SignStakingApi.IncomingStakingType.STAKE: {
                const sender = this.parseAddress(request.sender, 'sender');
                const data = new Nimiq.SerialBuffer(
                    1 // Data type
                    + Nimiq.Address.SERIALIZED_SIZE, // Staker address
                );
                data.writeUint8(type);
                data.write(sender.serialize());
                request.data = data;
                break;
            }
            case SignStakingApi.IncomingStakingType.UNSTAKE: {
                // No special data format is required for unstaking
                break;
            }
            default:
                throw new Errors.KeyguardError('Unreachable');
        }

        parsedRequest.transaction = this.parseTransaction(request);

        if (isSignalling) {
            // @ts-ignore Private property access
            parsedRequest.transaction._value = 0;
            // @ts-ignore Private property access
            parsedRequest.transaction._flags = 0b10; // Signalling flag
        }

        return parsedRequest;
    }

    /**
     * Checks that the given layout is valid
     * @param {unknown} type
     * @returns {number}
     */
    parseStakingType(type) {
        if (!type || typeof type !== 'number') {
            throw new Errors.InvalidRequestError('Staking type must be a number');
        }
        if (Object.values(SignStakingApi.IncomingStakingType).indexOf(type) === -1) {
            throw new Errors.InvalidRequestError('Invalid staking type');
        }
        return type;
    }

    get Handler() {
        return SignStaking;
    }
}

SignStakingApi.IncomingStakingType = {
    UNSTAKE: 1,

    CREATE_STAKER: 6,
    STAKE: 7,
    UPDATE_STAKER: 8,
};
