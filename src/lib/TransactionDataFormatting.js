/* global Nimiq */
/* global Constants */
/* global I18n */
/* global Utf8Tools */

class TransactionDataFormatting { // eslint-disable-line no-unused-vars
    /**
     * Translate transaction data into more user-friendly info. The info for advanced transactions is still mostly
     * suitable for advanced users though. For more common advanced transactions like swaps or staking transactions,
     * which are also meant for regular users, special, more user-friendly UI should be provided instead of using this
     * method.
     *
     * @param {Nimiq.Transaction} transaction
     * @returns {string}
     */
    static formatTransactionData(transaction) {
        // Handle special Cashlink data
        if (Nimiq.BufferUtils.equals(transaction.data, Constants.CASHLINK_FUNDING_DATA)) {
            return I18n.translatePhrase('tx-data-funding-cashlink');
        }

        // For regular transactions allow interpreting the data as utf8
        if (transaction.flags === Nimiq.TransactionFlag.None
            && transaction.senderType === Nimiq.AccountType.Basic
            && transaction.recipientType === Nimiq.AccountType.Basic
            && transaction.senderData.length === 0
            && Utf8Tools.isValidUtf8(transaction.data)) {
            return Utf8Tools.utf8ByteArrayToString(transaction.data);
        }

        const plainTransaction = transaction.toPlain();
        const plainData = plainTransaction.data;

        // Contract withdrawal without any data
        // If a transaction has no transaction data but a special sender type, try to give it a useful label nonetheless
        if (transaction.senderData.length === 0
            && transaction.data.length === 0
            && transaction.senderType !== Nimiq.AccountType.Basic) {
            return I18n.translatePhrase('tx-data-contract-withdrawal', {
                contractType: TransactionDataFormatting._capitalize(plainTransaction.senderType),
            });
        }

        let prefix = '';
        let includeDataType = true;

        // Contract creation
        if (transaction.flags & Nimiq.TransactionFlag.ContractCreation) { // eslint-disable-line no-bitwise
            prefix = I18n.translatePhrase('tx-data-contract-creation', {
                contractType: TransactionDataFormatting._capitalize(plainTransaction.recipientType),
            });
            includeDataType = plainData.type !== plainTransaction.recipientType; // don't repeat contract type
        }

        // Staking transaction
        if (transaction.senderType === Nimiq.AccountType.Staking) {
            // A staking withdrawal transaction. Those are never signaling transactions.
            prefix = I18n.translatePhrase('tx-data-contract-withdrawal', { contractType: 'Staking' });
        } else if (transaction.recipientType === Nimiq.AccountType.Staking) {
            if (!(transaction.flags & Nimiq.TransactionFlag.Signaling)) { // eslint-disable-line no-bitwise
                // A staking transaction which creates/adds actual stake by moving funds to the staking contract
                prefix = I18n.translatePhrase('tx-data-contract-creation', { contractType: 'Staking' });
            } else {
                // A staking signaling transaction which does not move funds but only updates the staking setup
                prefix = I18n.translatePhrase('tx-data-staking-update');
            }
        }

        const formattedPlainData = TransactionDataFormatting._formatPlainData(plainData, includeDataType);
        const formattedData = [prefix, formattedPlainData].filter(entry => !!entry).join(': ');
        return TransactionDataFormatting._capitalize(formattedData, true);
    }

    /**
     * @private
     * @param {Nimiq.PlainTransactionRecipientData} plainData
     * @param {boolean} includeDataType
     * @returns {string}
     */
    static _formatPlainData(plainData, includeDataType) {
        if (plainData.type === 'raw') return plainData.raw; // Return plain hex. Empty if transaction has no data.

        /** @type {string[]} */
        const entries = [];

        // Ensure type is included first
        if (includeDataType) {
            entries.push(`type ${plainData.type}`);
        }

        // Add other info
        for (const [key, value] of Object.entries(plainData)) {
            if (key === 'type' || key === 'raw' || value === undefined) continue; // Skip type, raw and unset options
            const formattedKey = TransactionDataFormatting._splitPascalCase(key);
            const formattedValue = typeof value === 'object' ? JSON.stringify(value) : value.toString();
            entries.push(`${formattedKey} ${formattedValue}`);
        }

        return entries.join(', ');
    }

    /**
     * @private
     * @param {string} str
     * @param {boolean} [onlyFirstWord=false]
     * @returns {string}
     */
    static _capitalize(str, onlyFirstWord = false) {
        if (str.toLowerCase() === 'htlc') return 'HTLC';
        const regex = new RegExp(`(?<=^${!onlyFirstWord ? '|\\s+' : ''}).`, 'gu');
        return str.replace(regex, char => char.toUpperCase());
    }

    /**
     * @private
     * @param {string} str
     * @returns {string}
     */
    static _splitPascalCase(str) {
        return str.replace(/(?<!^)[A-Z]/g, char => ` ${char.toLowerCase()}`);
    }
}
