/* global Nimiq */
/* global MerkleTreePatch */

class MultisigUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {Nimiq.PublicKey[]} publicKeys
     * @param {number} signersRequired
     * @returns {Nimiq.Address}
     */
    static calculateAddress(publicKeys, signersRequired) {
        publicKeys.sort((a, b) => a.compare(b));
        const combinations = [
            ...(
                // @ts-ignore Generator is not generic in Keyguard's old TS version
                /** @type {Generator<Nimiq.PublicKey[]>} */
                (Nimiq.ArrayUtils.k_combinations(publicKeys, signersRequired))
            ),
        ];
        const multiSigKeys = combinations.map(combination => Nimiq.PublicKey.sum(combination));
        multiSigKeys.sort((a, b) => a.compare(b));
        MerkleTreePatch.apply();
        const merkleRoot = Nimiq.MerkleTree.computeRoot(multiSigKeys);
        return Nimiq.Address.fromHash(merkleRoot);
    }
}
