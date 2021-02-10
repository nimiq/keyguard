/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global NumberFormatting */
/* global BitcoinConstants */
/* global BitcoinUtils */
/* global BitcoinKey */
/* global EuroConstants */
/* global EuroUtils */
/* global Identicon */
/* global IqonHash */
/* global LoginFileConfig */
/* global TemplateTags */
/* global I18n */
/* global SignSwapApi */
/* global SwapFeesTooltip */

/**
 * @callback SignSwap.resolve
 * @param {KeyguardRequest.SimpleResult} result
 */

class SignSwap {
    /**
     * @param {Parsed<KeyguardRequest.SignSwapRequest>} request
     * @param {SignSwap.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        /** @type {HTMLElement} */
        this.$el = (document.getElementById(SignSwap.Pages.CONFIRM_SWAP));

        const fundTx = request.fund;
        const redeemTx = request.redeem;

        // Remove unused layout HTML before getting DOM nodes
        if (request.layout === SignSwapApi.Layouts.STANDARD) {
            /** @type {HTMLDivElement} */
            const sliderLayout = (this.$el.querySelector('.layout-slider'));
            this.$el.removeChild(sliderLayout);
        }
        if (request.layout === SignSwapApi.Layouts.SLIDER) {
            /** @type {HTMLDivElement} */
            const standardLayout = (this.$el.querySelector('.layout-standard'));
            this.$el.removeChild(standardLayout);
        }

        this.$el.classList.add(`layout-${request.layout}`);

        /** @type {HTMLDivElement} */
        const $exchangeRate = (this.$el.querySelector('#exchange-rate'));
        /** @type {HTMLDivElement} */
        const $leftIdenticon = (this.$el.querySelector('.left-account .identicon'));
        /** @type {HTMLDivElement} */
        const $rightIdenticon = (this.$el.querySelector('.right-account .identicon'));
        /** @type {HTMLSpanElement} */
        const $leftLabel = (this.$el.querySelector('.left-account .label'));
        /** @type {HTMLSpanElement} */
        const $rightLabel = (this.$el.querySelector('.right-account .label'));
        /** @type {HTMLDivElement} */
        const $swapValues = (this.$el.querySelector('.swap-values'));
        /** @type {HTMLSpanElement} */
        const $swapLeftValue = (this.$el.querySelector('#swap-nim-value'));
        /** @type {HTMLSpanElement} */
        const $swapRightValue = (this.$el.querySelector('#swap-btc-value'));

        // The total amount the user loses
        let swapFromValue = 0;
        switch (fundTx.type) {
            case 'NIM': swapFromValue = fundTx.transaction.value + fundTx.transaction.fee; break;
            case 'BTC': swapFromValue = fundTx.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0)
                    - (fundTx.changeOutput ? fundTx.changeOutput.value : 0); break;
            case 'EUR': swapFromValue = fundTx.amount + fundTx.fee; break;
            default: throw new Errors.KeyguardError('Invalid asset');
        }

        // The total amount the user receives
        let swapToValue = 0;
        switch (redeemTx.type) {
            case 'NIM': swapToValue = redeemTx.transaction.value; break;
            case 'BTC': swapToValue = redeemTx.output.value; break;
            // case 'EUR': swapToValue = redeemTx.amount - redeemTx.fee; break;
            default: throw new Errors.KeyguardError('Invalid asset');
        }

        const leftAsset = request.layout === SignSwapApi.Layouts.SLIDER ? 'NIM' : fundTx.type;
        const rightAsset = request.layout === SignSwapApi.Layouts.SLIDER ? 'BTC' : redeemTx.type;

        const leftAmount = fundTx.type === leftAsset ? swapFromValue : swapToValue;
        const rightAmount = redeemTx.type === rightAsset ? swapToValue : swapFromValue;

        $swapLeftValue.textContent = NumberFormatting.formatNumber(
            this._unitsToCoins(leftAsset, leftAmount),
            this._assetDecimals(leftAsset),
            leftAsset === 'EUR' ? this._assetDecimals(leftAsset) : 0,
        );

        $swapRightValue.textContent = NumberFormatting.formatNumber(
            this._unitsToCoins(rightAsset, rightAmount),
            this._assetDecimals(rightAsset),
            // rightAsset === 'EUR'? this._assetDecimals(rightAsset) : 0,
        );

        $swapValues.classList.add(`${fundTx.type.toLowerCase()}-to-${redeemTx.type.toLowerCase()}`);

        /** @type {'NIM' | 'BTC' | 'EUR'} */
        let exchangeBaseAsset;
        // If EUR is part of the swap, the other currency is the base asset
        if (fundTx.type === 'EUR') exchangeBaseAsset = redeemTx.type;
        // else if (redeemTx.type === 'EUR') exchangeRateBaseAsset = fundTx.type; // TODO: Enable when swapping to EUR
        // If NIM is part of the swap, it is the base asset
        else if (fundTx.type === 'NIM' || redeemTx.type === 'NIM') exchangeBaseAsset = 'NIM';
        else exchangeBaseAsset = fundTx.type;

        const exchangeOtherAsset = exchangeBaseAsset === fundTx.type ? redeemTx.type : fundTx.type;

        // Exchange rate
        /** @type {number} */
        let exchangeBaseValue;
        switch (exchangeBaseAsset) {
            case 'NIM':
                exchangeBaseValue = fundTx.type === 'NIM'
                    // When the user funds NIM, the service receives the HTLC balance - their network fee.
                    ? fundTx.transaction.value - request.serviceFundingFee
                    : redeemTx.type === 'NIM'
                        // When the user redeems NIM, the service lost the HTLC balance + their network fee.
                        // The transaction value is "HTLC balance - tx fee", therefore the "HTLC balance"
                        // is the transaction value + tx fee.
                        ? redeemTx.transaction.value + redeemTx.transaction.fee + request.serviceRedeemingFee
                        : 0; // Should never happen, if parsing works correctly
                break;
            case 'BTC':
                exchangeBaseValue = fundTx.type === 'BTC'
                    // When the user funds BTC, the service receives the HTLC balance - their network fee.
                    ? fundTx.recipientOutput.value - request.serviceFundingFee
                    : redeemTx.type === 'BTC'
                        // When the user redeems BTC, the service lost the HTLC balance + their network fee.
                        // The HTLC balance is represented by the redeeming tx input value.
                        ? redeemTx.input.witnessUtxo.value + request.serviceRedeemingFee
                        : 0; // Should never happen, if parsing works correctly
                break;
            // case 'EUR':
            //      exchangeBaseValue = ...
            //      break;
            default:
                throw new Errors.KeyguardError('UNEXPECTED: Unsupported exchange rate base asset');
        }

        /** @type {number} */
        let exchangeOtherValue;
        switch (exchangeOtherAsset) {
            case 'NIM':
                exchangeOtherValue = fundTx.type === 'NIM'
                    // When the user funds NIM, the service receives the HTLC balance - their network fee.
                    ? fundTx.transaction.value - request.serviceFundingFee
                    : redeemTx.type === 'NIM'
                        // When the user redeems NIM, the service lost the HTLC balance + their network fee.
                        // The transaction value is "HTLC balance - tx fee", therefore the "HTLC balance"
                        // is the transaction value + tx fee.
                        ? redeemTx.transaction.value + redeemTx.transaction.fee + request.serviceRedeemingFee
                        : 0; // Should never happen, if parsing works correctly
                break;
            case 'BTC':
                exchangeOtherValue = fundTx.type === 'BTC'
                    // When the user funds BTC, the service receives the HTLC balance - their network fee.
                    ? fundTx.recipientOutput.value - request.serviceFundingFee
                    : redeemTx.type === 'BTC'
                        // When the user redeems BTC, the service lost the HTLC balance + their network fee.
                        // The HTLC balance is represented by the redeeming tx input value.
                        ? redeemTx.input.witnessUtxo.value + request.serviceRedeemingFee
                        : 0; // Should never happen, if parsing works correctly
                break;
            case 'EUR':
                exchangeOtherValue = fundTx.type === 'EUR'
                    ? fundTx.amount - request.serviceFundingFee
                    // : redeemTx.type === 'EUR'
                    //     ? redeemTx.amount + request.serviceRedeemingFee
                    : 0; // Should never happen, if parsing works correctly
                break;
            default:
                throw new Errors.KeyguardError('UNEXPECTED: Unsupported exchange rate other asset');
        }

        if (!exchangeBaseValue || !exchangeOtherValue) {
            throw new Errors.KeyguardError(
                'UNEXPECTED: Swap rate values are invalid -'
                    + ` ${exchangeBaseAsset}: ${this._unitsToCoins(exchangeBaseAsset, exchangeBaseValue)}`
                    + `, ${exchangeOtherAsset}: ${this._unitsToCoins(exchangeOtherAsset, exchangeOtherValue)}`,
            );
        }

        const exchangeRate = this._unitsToCoins(exchangeOtherAsset, exchangeOtherValue)
            / this._unitsToCoins(exchangeBaseAsset, exchangeBaseValue);
        $exchangeRate.textContent = `1 ${exchangeBaseAsset} = ${NumberFormatting.formatCurrency(
            exchangeRate,
            exchangeOtherAsset.toLocaleLowerCase(),
        )}`;

        /** @type {HTMLDivElement} */
        const $topRow = (this.$el.querySelector('.nq-notice'));
        $topRow.appendChild(
            new SwapFeesTooltip(
                request,
                fundTx.type === exchangeBaseAsset ? exchangeBaseValue : exchangeOtherValue,
            ).$el,
        );

        if (request.layout === SignSwapApi.Layouts.STANDARD) {
            /** @type {HTMLDivElement} */
            const $leftAccount = (this.$el.querySelector('.left-account'));
            /** @type {HTMLDivElement} */
            const $rightAccount = (this.$el.querySelector('.right-account'));

            $leftAccount.classList.add(request.fund.type.toLocaleLowerCase());
            $rightAccount.classList.add(request.redeem.type.toLocaleLowerCase());

            // Add ticker symbols
            /** @type {HTMLSpanElement} */
            const $fromSymbol = (this.$el.querySelector('.swap-values .from-symbol'));
            /** @type {HTMLSpanElement} */
            const $toSymbol = (this.$el.querySelector('.swap-values .to-symbol'));

            $fromSymbol.classList.add(`${request.fund.type.toLowerCase()}-symbol`);
            $toSymbol.classList.add(`${request.redeem.type.toLowerCase()}-symbol`);

            if (request.fund.type === 'NIM') {
                const address = request.fund.transaction.sender.toUserFriendlyAddress();
                new Identicon(address, $leftIdenticon); // eslint-disable-line no-new
                $leftLabel.textContent = request.fund.senderLabel;
            } else if (request.fund.type === 'BTC') {
                $leftIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/bitcoin.svg"></img>`;
                $leftLabel.textContent = I18n.translatePhrase('bitcoin');
            } else if (request.fund.type === 'EUR') {
                $leftIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/bank.svg"></img>`;
                $leftLabel.textContent = request.fund.bankLabel || I18n.translatePhrase('sign-swap-your-bank');
            }

            if (request.redeem.type === 'NIM') {
                const address = request.redeem.transaction.recipient.toUserFriendlyAddress();
                new Identicon(address, $rightIdenticon); // eslint-disable-line no-new
                $rightLabel.textContent = request.redeem.recipientLabel;
            } else if (request.redeem.type === 'BTC') {
                $rightIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/bitcoin.svg"></img>`;
                $rightLabel.textContent = I18n.translatePhrase('bitcoin');
            // } else if (request.redeem.type === 'EUR') {
            //     $rightIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/bank.svg"></img>`;
            //     $rightLabel.textContent = request.redeem.bankLabel || I18n.translatePhrase('sign-swap-your-bank');
            }
        }

        if (request.layout === SignSwapApi.Layouts.SLIDER) {
            /** @type {HTMLDivElement} */
            const $balanceBar = (this.$el.querySelector('.balance-bar'));
            /** @type {HTMLSpanElement} */
            const $newNimBalance = (this.$el.querySelector('#new-nim-balance'));
            /** @type {HTMLSpanElement} */
            const $newBtcBalance = (this.$el.querySelector('#new-btc-balance'));
            /** @type {HTMLSpanElement} */
            const $newNimBalanceFiat = (this.$el.querySelector('#new-nim-balance-fiat'));
            /** @type {HTMLSpanElement} */
            const $newBtcBalanceFiat = (this.$el.querySelector('#new-btc-balance-fiat'));
            /** @type {HTMLSpanElement} */
            const $swapLeftValueFiat = (this.$el.querySelector('#swap-nim-value-fiat'));
            /** @type {HTMLSpanElement} */
            const $swapRightValueFiat = (this.$el.querySelector('#swap-btc-value-fiat'));

            const swapNimAddress = fundTx.type === 'NIM'
                ? fundTx.transaction.sender.toUserFriendlyAddress()
                : redeemTx.type === 'NIM'
                    ? redeemTx.transaction.recipient.toUserFriendlyAddress()
                    : ''; // Should never happen, if parsing works correctly

            // eslint-disable-next-line no-new
            new Identicon(swapNimAddress, $leftIdenticon);
            $leftLabel.textContent = fundTx.type === 'NIM'
                ? fundTx.senderLabel
                : redeemTx.type === 'NIM'
                    ? redeemTx.recipientLabel
                    : ''; // Should never happen, if parsing works correctly

            $rightIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/bitcoin.svg"></img>`;
            $rightLabel.textContent = I18n.translatePhrase('bitcoin');

            // Add signs in front of swap amounts
            $swapLeftValue.textContent = `${fundTx.type === leftAsset ? '-' : '+'}\u2009`
                + `${$swapLeftValue.textContent}`;
            $swapRightValue.textContent = `${redeemTx.type === rightAsset ? '+' : '-'}\u2009`
                + `${$swapRightValue.textContent}`;

            // Fiat swap amounts
            const leftFiatRate = fundTx.type === leftAsset ? request.fundingFiatRate : request.redeemingFiatRate;
            const rightFiatRate = redeemTx.type === rightAsset ? request.redeemingFiatRate : request.fundingFiatRate;
            $swapLeftValueFiat.textContent = NumberFormatting.formatCurrency(
                this._unitsToCoins(leftAsset, leftAmount) * leftFiatRate,
                request.fiatCurrency,
            );
            $swapRightValueFiat.textContent = NumberFormatting.formatCurrency(
                this._unitsToCoins(rightAsset, rightAmount) * rightFiatRate,
                request.fiatCurrency,
            );

            const nimAddressInfo = request.nimiqAddresses.find(address => address.address === swapNimAddress);
            if (!nimAddressInfo) {
                throw new Errors.KeyguardError('UNEXPECTED: Address info of swap NIM address not found');
            }

            const newNimBalance = nimAddressInfo.balance + (leftAmount * (fundTx.type === 'NIM' ? -1 : 1));
            const newBtcBalance = request.bitcoinAccount.balance + (rightAmount * (fundTx.type === 'BTC' ? -1 : 1));

            $newNimBalance.textContent = NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(newNimBalance));
            $newNimBalanceFiat.textContent = NumberFormatting.formatCurrency(
                Nimiq.Policy.lunasToCoins(newNimBalance) * leftFiatRate,
                request.fiatCurrency,
            );
            $newBtcBalance.textContent = NumberFormatting.formatNumber(BitcoinUtils.satoshisToCoins(newBtcBalance), 8);
            const newBtcBalanceFiat = BitcoinUtils.satoshisToCoins(newBtcBalance) * rightFiatRate;
            $newBtcBalanceFiat.textContent = NumberFormatting.formatCurrency(newBtcBalanceFiat, request.fiatCurrency);

            // Draw distribution graph
            const nimDistributionData = request.nimiqAddresses.map(addressInfo => {
                const active = swapNimAddress === addressInfo.address;
                const backgroundClass = LoginFileConfig[IqonHash.getBackgroundColorIndex(addressInfo.address)]
                    .className;
                const oldBalance = Nimiq.Policy.lunasToCoins(addressInfo.balance) * leftFiatRate;
                const newBalance = active
                    ? Nimiq.Policy.lunasToCoins(newNimBalance) * leftFiatRate
                    : oldBalance;

                return {
                    oldBalance,
                    newBalance,
                    backgroundClass,
                    active,
                };
            });

            const btcDistributionData = {
                oldBalance: BitcoinUtils.satoshisToCoins(request.bitcoinAccount.balance) * rightFiatRate,
                newBalance: newBtcBalanceFiat,
                backgroundClass: 'bitcoin',
                active: true,
            };

            const totalBalance = nimDistributionData.reduce((sum, data) => sum + data.newBalance, 0)
                + btcDistributionData.newBalance;

            /**
             * @param {{oldBalance: number, newBalance: number, backgroundClass: string, active: boolean}} data
             * @returns {HTMLDivElement}
             */
            function createBar(data) { // eslint-disable-line no-inner-declarations
                const $bar = document.createElement('div');
                $bar.classList.add('bar', data.backgroundClass);
                $bar.classList.toggle('active', data.active);
                $bar.style.width = `${data.newBalance / totalBalance * 100}%`;
                if (data.active && data.newBalance > data.oldBalance) {
                    const $change = document.createElement('div');
                    $change.classList.add('change');
                    $change.style.width = `${(data.newBalance - data.oldBalance) / data.newBalance * 100}%`;
                    $bar.appendChild($change);
                }
                return $bar;
            }

            const $bars = document.createDocumentFragment();
            for (const data of nimDistributionData) {
                $bars.appendChild(createBar(data));
            }
            const $separator = document.createElement('div');
            $separator.classList.add('separator');
            $bars.appendChild($separator);
            $bars.appendChild(createBar(btcDistributionData));

            $balanceBar.appendChild($bars);
        }

        // Set up password box.
        /** @type {HTMLFormElement} */
        const $passwordBox = (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-confirm-swap',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            /** @param {string} [password] */ password => {
                this._onConfirm(request, resolve, reject, password);
            },
        );
    }

    /**
     * @param {'NIM' | 'BTC' | 'EUR'} asset
     * @param {number} units
     * @returns {number}
     */
    _unitsToCoins(asset, units) {
        switch (asset) {
            case 'NIM': return Nimiq.Policy.lunasToCoins(units);
            case 'BTC': return BitcoinUtils.satoshisToCoins(units);
            case 'EUR': return EuroUtils.centsToCoins(units);
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }

    /**
     * @param {'NIM' | 'BTC' | 'EUR'} asset
     * @returns {number}
     */
    _assetDecimals(asset) {
        switch (asset) {
            case 'NIM': return Math.log10(Nimiq.Policy.LUNAS_PER_COIN);
            case 'BTC': return Math.log10(BitcoinConstants.SATOSHIS_PER_COIN);
            case 'EUR': return Math.log10(EuroConstants.CENTS_PER_COIN);
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }

    /**
     * @param {Parsed<KeyguardRequest.SignSwapRequest>} request
     * @param {SignSwap.resolve} resolve
     * @param {reject} reject
     * @param {string} [password]
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, password) {
        TopLevelApi.setLoading(true);
        const passwordBuf = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(request.keyInfo.id, passwordBuf);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(e));
            return;
        }
        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        const btcKey = new BitcoinKey(key);

        /** @type {{nim: string, btc: string[], btc_refund?: string}} */
        const privateKeys = {};

        if (request.fund.type === 'NIM') {
            const privateKey = key.derivePrivateKey(request.fund.keyPath);
            privateKeys.nim = privateKey.toHex();
        }

        if (request.fund.type === 'BTC') {
            const keyPairs = request.fund.inputs.map(input => btcKey.deriveKeyPair(input.keyPath));
            const privKeys = keyPairs.map(keyPair => Nimiq.BufferUtils.toHex(
                /** @type {Buffer} */ (keyPair.privateKey),
            ));
            privateKeys.btc = privKeys;

            if (request.fund.changeOutput) {
                // Calculate, validate and store output address
                const address = btcKey.deriveAddress(request.fund.changeOutput.keyPath);
                if (request.fund.changeOutput.address && request.fund.changeOutput.address !== address) {
                    throw new Errors.InvalidRequestError(
                        'Given address is different from derived address for change output',
                    );
                }
                request.fund.changeOutput.address = address;
            }

            // Calculate and store refund key
            const refundKeyPair = btcKey.deriveKeyPair(request.fund.refundKeyPath);
            const privKey = Nimiq.BufferUtils.toHex(
                /** @type {Buffer} */ (refundKeyPair.privateKey),
            );
            privateKeys.btc_refund = privKey;

            // Calculate and store refund address
            request.fund.refundAddress = btcKey.deriveAddress(request.fund.refundKeyPath);
        }

        if (request.fund.type === 'EUR') {
            // No action required
        }

        if (request.redeem.type === 'NIM') {
            const privateKey = key.derivePrivateKey(request.redeem.keyPath);
            privateKeys.nim = privateKey.toHex();
        }

        if (request.redeem.type === 'BTC') {
            const keyPairs = [btcKey.deriveKeyPair(request.redeem.input.keyPath)];
            const privKeys = keyPairs.map(keyPair => Nimiq.BufferUtils.toHex(
                /** @type {Buffer} */ (keyPair.privateKey),
            ));
            privateKeys.btc = privKeys;

            // Calculate, validate and store output address
            const address = btcKey.deriveAddress(request.redeem.output.keyPath);
            if (request.redeem.output.address && request.redeem.output.address !== address) {
                throw new Errors.InvalidRequestError(
                    'Given address is different from derived address for output',
                );
            }
            request.redeem.output.address = address;
        }

        // if (request.redeem.type === 'EUR') {
        //     // Derive private key to sign settlement instructions and return its public key to Hub
        // }

        try {
            // Serialize request to store in SessionStorage
            /** @type {any} */
            const plainRequest = request;
            if (request.fund.type === 'NIM') {
                // Plainify Nimiq.Transaction
                plainRequest.fund.transaction = request.fund.transaction.toPlain();
            }
            if (request.fund.type === 'BTC') {
                // Plainify BTC input script buffers
                for (let i = 0; i < request.fund.inputs.length; i++) {
                    plainRequest.fund.inputs[i].witnessUtxo.script = Nimiq.BufferUtils.toHex(
                        request.fund.inputs[i].witnessUtxo.script,
                    );
                }
            }
            if (request.redeem.type === 'NIM') {
                // Plainify Nimiq.Transaction
                plainRequest.redeem.transaction = request.redeem.transaction.toPlain();
            }

            sessionStorage.setItem(
                SignSwapApi.SESSION_STORAGE_KEY_PREFIX + request.swapId,
                JSON.stringify({
                    keys: privateKeys,
                    request: plainRequest,
                }),
            );
        } catch (error) {
            reject(error);
            return;
        }

        resolve({ success: true });
    }

    run() {
        // Go to start page
        window.location.hash = SignSwap.Pages.CONFIRM_SWAP;
    }
}

SignSwap.Pages = {
    CONFIRM_SWAP: 'confirm-swap',
};
