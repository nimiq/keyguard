/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global NumberFormatting */
/* global BitcoinKey */
/* global PolygonContractABIs */
/* global PolygonKey */
/* global ethers */
/* global Identicon */
/* global TemplateTags */
/* global I18n */
/* global SignSwapApi */
/* global SwapFeesTooltip */
/* global BalanceDistributionBar */
/* global Constants */
/* global NonPartitionedSessionStorage */
/* global CONFIG */
/* global CryptoUtils */

/**
 * @callback SignSwap.resolve
 * @param {KeyguardRequest.SignSwapResult} result
 */

class SignSwap {
    /**
     * @param {Parsed<KeyguardRequest.SignSwapRequest>} request
     * @param {SignSwap.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this.$el = /** @type {HTMLElement} */ (document.getElementById(SignSwap.Pages.CONFIRM_SWAP));

        const fundTx = request.fund;
        const redeemTx = request.redeem;

        // Remove unused layout HTML before getting DOM nodes
        if (request.layout === SignSwapApi.Layouts.STANDARD) {
            const sliderLayout = /** @type {HTMLDivElement} */ (this.$el.querySelector('.layout-slider'));
            this.$el.removeChild(sliderLayout);
        }
        if (request.layout === SignSwapApi.Layouts.SLIDER) {
            const standardLayout = /** @type {HTMLDivElement} */ (this.$el.querySelector('.layout-standard'));
            this.$el.removeChild(standardLayout);
        }

        this.$el.classList.add(`layout-${request.layout}`);

        const $leftAccount = /** @type {HTMLDivElement} */ (this.$el.querySelector('.left-account'));
        const $rightAccount = /** @type {HTMLDivElement} */ (this.$el.querySelector('.right-account'));
        const $leftIdenticon = /** @type {HTMLDivElement} */ ($leftAccount.querySelector('.identicon'));
        const $rightIdenticon = /** @type {HTMLDivElement} */ ($rightAccount.querySelector('.identicon'));
        const $leftLabel = /** @type {HTMLSpanElement} */ ($leftAccount.querySelector('.label'));
        const $rightLabel = /** @type {HTMLSpanElement} */ ($rightAccount.querySelector('.label'));
        const $leftNewBalance = /** @type {HTMLSpanElement} */ ($leftAccount.querySelector('.new-balance'));
        const $rightNewBalance = /** @type {HTMLDivElement} */ ($rightAccount.querySelector('.new-balance'));
        const $swapValues = /** @type {HTMLDivElement} */ (this.$el.querySelector('.swap-values'));
        const $swapLeftValue = /** @type {HTMLSpanElement} */ (this.$el.querySelector('#swap-left-value'));
        const $swapRightValue = /** @type {HTMLSpanElement} */ (this.$el.querySelector('#swap-right-value'));

        // The total amount the user loses
        let swapFromValue = 0;
        switch (fundTx.type) {
            case 'NIM': swapFromValue = Number(fundTx.transaction.value + fundTx.transaction.fee); break;
            case 'BTC': swapFromValue = fundTx.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0)
                    - (fundTx.changeOutput ? fundTx.changeOutput.value : 0); break;
            case 'USDC_MATIC':
            case 'USDT_MATIC':
                swapFromValue = fundTx.description.args.amount.add(fundTx.description.args.fee).toNumber(); break;
            case 'EUR': swapFromValue = fundTx.amount + fundTx.fee; break;
            default: throw new Errors.KeyguardError('Invalid asset');
        }

        // The total amount the user receives
        let swapToValue = 0;
        switch (redeemTx.type) {
            case 'NIM': swapToValue = Number(redeemTx.transaction.value); break;
            case 'BTC': swapToValue = redeemTx.output.value; break;
            case 'USDC_MATIC':
            case 'USDT_MATIC':
                swapToValue = redeemTx.amount; break;
            case 'EUR': swapToValue = redeemTx.amount - redeemTx.fee; break;
            default: throw new Errors.KeyguardError('Invalid asset');
        }

        const leftAsset = request.layout === SignSwapApi.Layouts.SLIDER
            ? request.direction === 'left-to-right' ? request.fund.type : request.redeem.type
            : fundTx.type;
        const rightAsset = request.layout === SignSwapApi.Layouts.SLIDER
            ? request.direction === 'right-to-left' ? request.fund.type : request.redeem.type
            : redeemTx.type;

        const leftAmount = fundTx.type === leftAsset ? swapFromValue : swapToValue;
        const rightAmount = redeemTx.type === rightAsset ? swapToValue : swapFromValue;

        $swapLeftValue.textContent = NumberFormatting.formatNumber(
            CryptoUtils.unitsToCoins(leftAsset, leftAmount),
            ['USDC_MATIC', 'USDT_MATIC'].includes(leftAsset) ? 2 : CryptoUtils.assetDecimals(leftAsset),
            leftAsset === 'EUR' || ['USDC_MATIC', 'USDT_MATIC'].includes(leftAsset) ? 2 : 0,
        );

        $swapRightValue.textContent = NumberFormatting.formatNumber(
            CryptoUtils.unitsToCoins(rightAsset, rightAmount),
            ['USDC_MATIC', 'USDT_MATIC'].includes(rightAsset) ? 2 : CryptoUtils.assetDecimals(rightAsset),
            rightAsset === 'EUR' || ['USDC_MATIC', 'USDT_MATIC'].includes(rightAsset) ? 2 : 0,
        );

        $swapValues.classList.add(
            `${CryptoUtils.assetToCurrency(fundTx.type)}-to-${CryptoUtils.assetToCurrency(redeemTx.type)}`,
        );

        /** @type {'NIM' | 'BTC' | 'USDC_MATIC' | 'USDT_MATIC' | 'EUR'} */
        let exchangeBaseAsset;
        // If EUR is part of the swap, the other currency is the base asset
        if (fundTx.type === 'EUR') exchangeBaseAsset = redeemTx.type;
        else if (redeemTx.type === 'EUR') exchangeBaseAsset = fundTx.type;
        // If the layout is 'slider', the left asset is the base asset
        else if (request.layout === SignSwapApi.Layouts.SLIDER) exchangeBaseAsset = leftAsset;
        else exchangeBaseAsset = fundTx.type;

        const exchangeOtherAsset = exchangeBaseAsset === fundTx.type ? redeemTx.type : fundTx.type;

        // Exchange rate
        const exchangeBaseValue = this._getExchangeValue(exchangeBaseAsset, request);
        const exchangeOtherValue = this._getExchangeValue(exchangeOtherAsset, request);

        if (!exchangeBaseValue || !exchangeOtherValue) {
            throw new Errors.KeyguardError(
                'UNEXPECTED: Swap rate values are invalid -'
                    + ` ${exchangeBaseAsset}: ${CryptoUtils.unitsToCoins(exchangeBaseAsset, exchangeBaseValue)}`
                    + `, ${exchangeOtherAsset}: ${CryptoUtils.unitsToCoins(exchangeOtherAsset, exchangeOtherValue)}`,
            );
        }

        const exchangeRate = CryptoUtils.unitsToCoins(exchangeOtherAsset, exchangeOtherValue)
            / CryptoUtils.unitsToCoins(exchangeBaseAsset, exchangeBaseValue);

        // Make sure to show enough decimals
        const exchangeRateDigitsLength = exchangeRate
            .toFixed(CryptoUtils.assetDecimals(exchangeOtherAsset) + 1)
            .split('.')[0]
            .replace(/^0/, '') // Remove 0 when the number is < 1
            .length;
        const exchangeRateDecimals = Math.max(
            0,
            CryptoUtils.assetDecimals(exchangeOtherAsset) - exchangeRateDigitsLength,
        );
        const exchangeBaseCurrency = CryptoUtils.assetToCurrency(exchangeBaseAsset);
        const exchangeOtherCurrency = CryptoUtils.assetToCurrency(exchangeOtherAsset);
        const exchangeRateString = `1 ${exchangeBaseCurrency.toUpperCase()} = ${NumberFormatting.formatNumber(
            exchangeRate,
            exchangeRateDecimals,
            exchangeOtherAsset === 'EUR' ? CryptoUtils.assetDecimals(exchangeOtherAsset) : 0,
        )} ${exchangeOtherCurrency.toUpperCase()}`;

        const $topRow = /** @type {HTMLDivElement} */ (this.$el.querySelector('.nq-notice'));
        $topRow.appendChild(
            new SwapFeesTooltip(
                request,
                fundTx.type === exchangeBaseAsset ? exchangeBaseValue : exchangeOtherValue,
                fundTx.type === exchangeBaseAsset ? exchangeOtherValue : exchangeBaseValue,
                exchangeRateString,
            ).$el,
        );

        if (request.layout === SignSwapApi.Layouts.STANDARD) {
            $leftAccount.classList.add(CryptoUtils.assetToCurrency(request.fund.type));
            $rightAccount.classList.add(CryptoUtils.assetToCurrency(request.redeem.type));

            // Add ticker symbols
            const $fromSymbol = /** @type {HTMLSpanElement} */ (this.$el.querySelector('.swap-values .from-symbol'));
            const $toSymbol = /** @type {HTMLSpanElement} */ (this.$el.querySelector('.swap-values .to-symbol'));

            $fromSymbol.classList.add(`${CryptoUtils.assetToCurrency(request.fund.type)}-symbol`);
            $toSymbol.classList.add(`${CryptoUtils.assetToCurrency(request.redeem.type)}-symbol`);

            if (request.fund.type === 'NIM') {
                const address = request.fund.transaction.sender.toUserFriendlyAddress();
                new Identicon(address, $leftIdenticon); // eslint-disable-line no-new
                $leftLabel.textContent = request.fund.senderLabel;
            } else if (request.fund.type === 'BTC') {
                $leftIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/bitcoin.svg"></img>`;
                $leftLabel.textContent = 'Bitcoin';
            } else if (request.fund.type === 'USDC_MATIC') {
                $leftIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/usdc.svg"></img>`;
                $leftLabel.textContent = 'USD Coin';
            } else if (request.fund.type === 'USDT_MATIC') {
                $leftIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/usdt.svg"></img>`;
                $leftLabel.textContent = 'Tether USD';
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
                $rightLabel.textContent = 'Bitcoin';
            } else if (request.redeem.type === 'USDC_MATIC') {
                $rightIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/usdc.svg"></img>`;
                $rightLabel.textContent = 'USD Coin';
            } else if (request.redeem.type === 'USDT_MATIC') {
                $rightIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/usdt.svg"></img>`;
                $rightLabel.textContent = 'Tether USD';
            } else if (request.redeem.type === 'EUR') {
                $rightIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/bank.svg"></img>`;

                let label = request.redeem.bankLabel || I18n.translatePhrase('sign-swap-your-bank');

                // Display IBAN as recipient label if available
                if (request.redeem.settlement.type === 'sepa') {
                    label = request.redeem.settlement.recipient.iban;
                }

                $rightLabel.textContent = label;
            }
        }

        if (request.layout === SignSwapApi.Layouts.SLIDER) {
            $swapValues.classList.add(request.direction);

            const $balanceDistributionBar = /** @type {HTMLDivElement} */ (
                this.$el.querySelector('.balance-distribution-bar'));
            const $swapLeftValueFiat = /** @type {HTMLSpanElement} */ (
                this.$el.querySelector('#swap-left-value-fiat'));
            const $swapRightValueFiat = /** @type {HTMLSpanElement} */ (
                this.$el.querySelector('#swap-right-value-fiat'));
            const $swapLeftSymbol = /** @type {HTMLSpanElement} */ (
                this.$el.querySelector('#swap-left-symbol'));
            const $swapRightSymbol = /** @type {HTMLSpanElement} */ (
                this.$el.querySelector('#swap-right-symbol'));

            $swapLeftSymbol.classList.add(`${CryptoUtils.assetToCurrency(leftAsset)}-symbol`);
            $swapRightSymbol.classList.add(`${CryptoUtils.assetToCurrency(rightAsset)}-symbol`);

            /** @type {string | undefined} */
            let swapNimAddress;
            if (leftAsset === 'NIM' || rightAsset === 'NIM') {
                swapNimAddress = fundTx.type === 'NIM'
                    ? fundTx.transaction.sender.toUserFriendlyAddress()
                    : redeemTx.type === 'NIM'
                        ? redeemTx.transaction.recipient.toUserFriendlyAddress()
                        : ''; // Should never happen, if parsing works correctly

                // eslint-disable-next-line no-new
                new Identicon(swapNimAddress, leftAsset === 'NIM' ? $leftIdenticon : $rightIdenticon);
                (leftAsset === 'NIM' ? $leftLabel : $rightLabel).textContent = fundTx.type === 'NIM'
                    ? fundTx.senderLabel
                    : redeemTx.type === 'NIM'
                        ? redeemTx.recipientLabel
                        : ''; // Should never happen, if parsing works correctly
            }

            if (leftAsset === 'BTC' || rightAsset === 'BTC') {
                (leftAsset === 'BTC' ? $leftIdenticon : $rightIdenticon)
                    .innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/bitcoin.svg"></img>`;
                (leftAsset === 'BTC' ? $leftLabel : $rightLabel).textContent = 'Bitcoin';
            }

            if (leftAsset === 'USDC_MATIC' || rightAsset === 'USDC_MATIC') {
                (leftAsset === 'USDC_MATIC' ? $leftIdenticon : $rightIdenticon)
                    .innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/usdc.svg"></img>`;
                (leftAsset === 'USDC_MATIC' ? $leftLabel : $rightLabel).textContent = 'USD Coin';
            }

            if (leftAsset === 'USDT_MATIC' || rightAsset === 'USDT_MATIC') {
                (leftAsset === 'USDT_MATIC' ? $leftIdenticon : $rightIdenticon)
                    .innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/usdt.svg"></img>`;
                (leftAsset === 'USDT_MATIC' ? $leftLabel : $rightLabel).textContent = 'Tether USD';
            }

            // Add signs in front of swap amounts
            $swapLeftValue.textContent = `${fundTx.type === leftAsset ? '-' : '+'}\u2009`
                + `${$swapLeftValue.textContent}`;
            $swapRightValue.textContent = `${redeemTx.type === rightAsset ? '+' : '-'}\u2009`
                + `${$swapRightValue.textContent}`;

            // Fiat swap amounts
            const leftFiatRate = fundTx.type === leftAsset ? request.fundingFiatRate : request.redeemingFiatRate;
            const rightFiatRate = redeemTx.type === rightAsset ? request.redeemingFiatRate : request.fundingFiatRate;
            $swapLeftValueFiat.textContent = NumberFormatting.formatCurrency(
                CryptoUtils.unitsToCoins(leftAsset, leftAmount) * leftFiatRate,
                request.fiatCurrency,
            );
            $swapRightValueFiat.textContent = NumberFormatting.formatCurrency(
                CryptoUtils.unitsToCoins(rightAsset, rightAmount) * rightFiatRate,
                request.fiatCurrency,
            );

            /** @typedef {{address: string, balance: number, active: boolean, newBalance: number}} Segment */

            /** @type {Segment[] | undefined} */
            let leftSegments;
            /** @type {Segment[] | undefined} */
            let rightSegments;

            if (leftAsset === 'NIM' || rightAsset === 'NIM') {
                const activeAddress = /** @type {string} */ (swapNimAddress);

                const activeAddressInfo = request.nimiqAddresses.find(ai => ai.address === activeAddress);
                if (!activeAddressInfo) {
                    throw new Errors.KeyguardError('UNEXPECTED: Address info of swap NIM address not found');
                }

                const amount = leftAsset === 'NIM' ? leftAmount : rightAmount;

                const newBalance = activeAddressInfo.balance + (amount * (fundTx.type === 'NIM' ? -1 : 1));
                const newBalanceFormatted = NumberFormatting.formatNumber(
                    CryptoUtils.unitsToCoins('NIM', newBalance), 0, 0,
                );

                if (leftAsset === 'NIM') {
                    $leftNewBalance.textContent = `${newBalanceFormatted} NIM`;
                    $leftAccount.classList.add('nim');
                } else if (rightAsset === 'NIM') {
                    $rightNewBalance.textContent = `${newBalanceFormatted} NIM`;
                    $rightAccount.classList.add('nim');
                }

                /** @type {Segment[]} */
                const segments = request.nimiqAddresses.map(({ address, balance }) => ({
                    address,
                    balance,
                    active: address === activeAddress,
                    newBalance: address === activeAddress ? newBalance : balance,
                }));

                if (leftAsset === 'NIM') leftSegments = segments;
                else rightSegments = segments;
            }

            if (leftAsset === 'BTC' || rightAsset === 'BTC') {
                const amount = leftAsset === 'BTC' ? leftAmount : rightAmount;

                const newBalance = request.bitcoinAccount.balance + (amount * (fundTx.type === 'BTC' ? -1 : 1));
                const newBalanceFormatted = NumberFormatting.formatNumber(
                    CryptoUtils.unitsToCoins('BTC', newBalance), 8, 0,
                );

                if (leftAsset === 'BTC') {
                    $leftNewBalance.textContent = `${newBalanceFormatted} BTC`;
                    $leftAccount.classList.add('btc');
                } else if (rightAsset === 'BTC') {
                    $rightNewBalance.textContent = `${newBalanceFormatted} BTC`;
                    $rightAccount.classList.add('btc');
                }

                /** @type {Segment[]} */
                const segments = [{
                    address: 'bitcoin',
                    balance: request.bitcoinAccount.balance,
                    active: true,
                    newBalance,
                }];

                if (leftAsset === 'BTC') leftSegments = segments;
                else rightSegments = segments;
            }

            if (leftAsset === 'USDC_MATIC' || rightAsset === 'USDC_MATIC') {
                const amount = leftAsset === 'USDC_MATIC' ? leftAmount : rightAmount;

                const newBalance = request.polygonAddresses[0].usdcBalance
                    + (amount * (fundTx.type === 'USDC_MATIC' ? -1 : 1));
                const newBalanceFormatted = NumberFormatting.formatNumber(
                    CryptoUtils.unitsToCoins('USDC_MATIC', newBalance), 2, 2,
                );

                if (leftAsset === 'USDC_MATIC') {
                    $leftNewBalance.textContent = `${newBalanceFormatted} USDC`;
                    $leftAccount.classList.add('usdc');
                } else if (rightAsset === 'USDC_MATIC') {
                    $rightNewBalance.textContent = `${newBalanceFormatted} USDC`;
                    $rightAccount.classList.add('usdc');
                }

                /** @type {Segment[]} */
                const segments = [{
                    address: 'usdc',
                    balance: request.polygonAddresses[0].usdcBalance,
                    active: true,
                    newBalance,
                }];

                if (leftAsset === 'USDC_MATIC') leftSegments = segments;
                else rightSegments = segments;
            }

            if (leftAsset === 'USDT_MATIC' || rightAsset === 'USDT_MATIC') {
                const amount = leftAsset === 'USDT_MATIC' ? leftAmount : rightAmount;

                const newBalance = request.polygonAddresses[0].usdtBalance
                    + (amount * (fundTx.type === 'USDT_MATIC' ? -1 : 1));
                const newBalanceFormatted = NumberFormatting.formatNumber(
                    CryptoUtils.unitsToCoins('USDT_MATIC', newBalance), 2, 2,
                );

                if (leftAsset === 'USDT_MATIC') {
                    $leftNewBalance.textContent = `${newBalanceFormatted} USDT`;
                    $leftAccount.classList.add('usdt');
                } else if (rightAsset === 'USDT_MATIC') {
                    $rightNewBalance.textContent = `${newBalanceFormatted} USDT`;
                    $rightAccount.classList.add('usdt');
                }

                /** @type {Segment[]} */
                const segments = [{
                    address: 'usdt',
                    balance: request.polygonAddresses[0].usdtBalance,
                    active: true,
                    newBalance,
                }];

                if (leftAsset === 'USDT_MATIC') leftSegments = segments;
                else rightSegments = segments;
            }

            if (!leftSegments || !rightSegments) {
                throw new Errors.KeyguardError('Missing segments for balance distribution bar');
            }

            new BalanceDistributionBar({ // eslint-disable-line no-new
                leftAsset,
                rightAsset,
                leftSegments,
                rightSegments,
                leftFiatRate,
                rightFiatRate,
            }, $balanceDistributionBar);
        }

        // Set up password box.
        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-confirm-swap',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
            showSwapAuthorization: !!request.kyc,
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            /** @param {string} [password] */ password => {
                this._onConfirm(request, resolve, reject, password);
            },
        );
    }

    /**
     * @param {'NIM' | 'BTC' | 'USDC_MATIC' | 'USDT_MATIC' | 'EUR'} asset
     * @param {Parsed<KeyguardRequest.SignSwapRequest>} request
     * @returns {number}
     */
    _getExchangeValue(asset, request) {
        const fundTx = request.fund;
        const redeemTx = request.redeem;
        switch (asset) {
            case 'NIM':
                return fundTx.type === 'NIM'
                    // When the user funds NIM, the service receives the HTLC balance - their network fee.
                    ? Number(fundTx.transaction.value) - request.fundFees.redeeming
                    : redeemTx.type === 'NIM'
                        // When the user redeems NIM, the service lost the HTLC balance + their network fee.
                        // The transaction value is "HTLC balance - tx fee", therefore the "HTLC balance"
                        // is the transaction value + tx fee.
                        ? Number(redeemTx.transaction.value + redeemTx.transaction.fee) + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
            case 'BTC':
                return fundTx.type === 'BTC'
                    // When the user funds BTC, the service receives the HTLC balance - their network fee.
                    ? fundTx.recipientOutput.value - request.fundFees.redeeming
                    : redeemTx.type === 'BTC'
                        // When the user redeems BTC, the service lost the HTLC balance + their network fee.
                        // The HTLC balance is represented by the redeeming tx input value.
                        ? redeemTx.input.witnessUtxo.value + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
            case 'USDC_MATIC':
            case 'USDT_MATIC':
                return fundTx.type === asset
                    // When the user funds USDC/T, the service receives the HTLC balance - their network fee.
                    ? fundTx.description.args.amount.toNumber() - request.fundFees.redeeming
                    : redeemTx.type === asset
                        // When the user redeems USDC/T, the service lost the HTLC balance + their network fee.
                        // The transaction value is "HTLC balance - tx fee", therefore the "HTLC balance"
                        // is the transaction value + tx fee.
                        ? redeemTx.amount + redeemTx.description.args.fee.toNumber() + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
            case 'EUR':
                return fundTx.type === 'EUR'
                    ? fundTx.amount - request.fundFees.redeeming
                    : redeemTx.type === 'EUR'
                        ? redeemTx.amount + request.redeemFees.processing + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
            default:
                throw new Errors.KeyguardError(`UNEXPECTED: Unsupported exchange rate asset ${asset}`);
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
            return;
        }
        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        const bitcoinKey = new BitcoinKey(key);
        const polygonKey = new PolygonKey(key);

        /** @type {{nim: string, btc: string[], usdc: string, usdt: string, eur: string, btc_refund?: string}} */
        const privateKeys = {};

        if (request.fund.type === 'NIM') {
            const privateKey = key.derivePrivateKey(request.fund.keyPath);
            privateKeys.nim = privateKey.toHex();
        }

        if (request.fund.type === 'BTC') {
            const keyPaths = request.fund.inputs.map(input => input.keyPath);
            const dedupedKeyPaths = keyPaths.filter(
                (path, index) => keyPaths.indexOf(path) === index,
            );
            const keyPairs = dedupedKeyPaths.map(path => bitcoinKey.deriveKeyPair(path));
            const privKeys = keyPairs.map(keyPair => /** @type {Buffer} */ (keyPair.privateKey).toString('hex'));
            privateKeys.btc = privKeys;

            if (request.fund.changeOutput) {
                // Calculate, validate and store output address
                const address = bitcoinKey.deriveAddress(request.fund.changeOutput.keyPath);
                if (request.fund.changeOutput.address && request.fund.changeOutput.address !== address) {
                    throw new Errors.InvalidRequestError(
                        'Given address is different from derived address for change output',
                    );
                }
                request.fund.changeOutput.address = address;
            }

            // Calculate and store refund key
            const refundKeyPair = bitcoinKey.deriveKeyPair(request.fund.refundKeyPath);
            const privKey = Nimiq.BufferUtils.toHex(
                /** @type {Buffer} */ (refundKeyPair.privateKey),
            );
            privateKeys.btc_refund = privKey;

            // Calculate and store refund address
            request.fund.refundAddress = bitcoinKey.deriveAddress(request.fund.refundKeyPath);
        }

        if (request.fund.type === 'USDC_MATIC') {
            if (request.fund.description.name === 'openWithPermit') {
                const { sigR, sigS, sigV } = await polygonKey.signUsdcPermit(
                    request.fund.keyPath,
                    CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                    request.fund.description.args.value,
                    // Has been validated to be defined when function called is `openWithPermit`
                    /** @type {{ tokenNonce: number }} */ (request.fund.permit).tokenNonce,
                    request.fund.request.from,
                );

                const htlcContract = new ethers.Contract(
                    CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                    PolygonContractABIs.NATIVE_USDC_HTLC_CONTRACT_ABI,
                );

                request.fund.request.data = htlcContract.interface.encodeFunctionData(request.fund.description.name, [
                    /* bytes32 id */ request.fund.description.args.id,
                    /* address token */ request.fund.description.args.token,
                    /* uint256 amount */ request.fund.description.args.amount,
                    /* address refundAddress */ request.fund.description.args.refundAddress,
                    /* address recipientAddress */ request.fund.description.args.recipientAddress,
                    /* bytes32 hash */ request.fund.description.args.hash,
                    /* uint256 timeout */ request.fund.description.args.timeout,
                    /* uint256 fee */ request.fund.description.args.fee,
                    /* uint256 value */ request.fund.description.args.value,
                    /* bytes32 sigR */ sigR,
                    /* bytes32 sigS */ sigS,
                    /* uint8 sigV */ sigV,
                ]);
            }

            const wallet = polygonKey.deriveKeyPair(request.fund.keyPath);
            privateKeys.usdc = wallet.privateKey;
        }

        if (request.fund.type === 'USDT_MATIC') {
            if (request.fund.description.name === 'openWithApproval') {
                const { sigR, sigS, sigV } = await polygonKey.signUsdtApproval(
                    request.fund.keyPath,
                    new ethers.Contract(
                        CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS,
                        PolygonContractABIs.BRIDGED_USDT_CONTRACT_ABI,
                    ),
                    CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                    request.fund.description.args.approval,
                    // Has been validated to be defined when function called is `openWithApproval`
                    /** @type {{ tokenNonce: number }} */ (request.fund.approval).tokenNonce,
                    request.fund.request.from,
                );

                const htlcContract = new ethers.Contract(
                    CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                    PolygonContractABIs.BRIDGED_USDT_HTLC_CONTRACT_ABI,
                );

                request.fund.request.data = htlcContract.interface.encodeFunctionData(request.fund.description.name, [
                    /* bytes32 id */ request.fund.description.args.id,
                    /* address token */ request.fund.description.args.token,
                    /* uint256 amount */ request.fund.description.args.amount,
                    /* address refundAddress */ request.fund.description.args.refundAddress,
                    /* address recipientAddress */ request.fund.description.args.recipientAddress,
                    /* bytes32 hash */ request.fund.description.args.hash,
                    /* uint256 timeout */ request.fund.description.args.timeout,
                    /* uint256 fee */ request.fund.description.args.fee,
                    /* uint256 approval */ request.fund.description.args.approval,
                    /* bytes32 sigR */ sigR,
                    /* bytes32 sigS */ sigS,
                    /* uint8 sigV */ sigV,
                ]);
            }

            const wallet = polygonKey.deriveKeyPair(request.fund.keyPath);
            privateKeys.usdt = wallet.privateKey;
        }

        if (request.fund.type === 'EUR') {
            // No signature required
        }

        if (request.redeem.type === 'NIM') {
            const privateKey = key.derivePrivateKey(request.redeem.keyPath);
            privateKeys.nim = privateKey.toHex();
        }

        if (request.redeem.type === 'BTC') {
            const keyPairs = [bitcoinKey.deriveKeyPair(request.redeem.input.keyPath)];
            const privKeys = keyPairs.map(keyPair => /** @type {Buffer} */ (keyPair.privateKey).toString('hex'));
            privateKeys.btc = privKeys;

            // Calculate, validate and store output address
            const address = bitcoinKey.deriveAddress(request.redeem.output.keyPath);
            if (request.redeem.output.address && request.redeem.output.address !== address) {
                throw new Errors.InvalidRequestError(
                    'Given address is different from derived address for output',
                );
            }
            request.redeem.output.address = address;
        }

        if (request.redeem.type === 'USDC_MATIC') {
            const wallet = polygonKey.deriveKeyPair(request.redeem.keyPath);
            privateKeys.usdc = wallet.privateKey;
        }

        if (request.redeem.type === 'USDT_MATIC') {
            const wallet = polygonKey.deriveKeyPair(request.redeem.keyPath);
            privateKeys.usdt = wallet.privateKey;
        }

        /** @type {string | undefined} */
        let eurPubKey;

        if (request.redeem.type === 'EUR') {
            const privateKey = key.derivePrivateKey(request.redeem.keyPath);
            privateKeys.eur = privateKey.toHex();

            // Public key of EUR signing key is required as the contract recipient
            // when confirming a swap to Fastspot from the Hub.
            eurPubKey = Nimiq.PublicKey.derive(privateKey).toHex();
        }

        try {
            // Make private keys and parsed swap request available to swap-iframe.
            // Note that this data can be arbitrarily long, for example due to long labels or many Bitcoin inputs, but
            // NonPartitionedSessionStorage and CookieStorage can handle big data chunks.
            const data = JSON.stringify({
                keys: privateKeys,
                // Serialize request to store in NonPartitionedSessionStorage
                request,
            }, (_, value) => {
                if (value instanceof Nimiq.Transaction) {
                    return value.toPlain();
                }
                if (value instanceof Uint8Array) {
                    return Nimiq.BufferUtils.toHex(value);
                }
                if (value instanceof ethers.utils.TransactionDescription) {
                    return null;
                }
                return value;
            });
            const tmpCookieEncryptionKey = await NonPartitionedSessionStorage.set(
                Constants.SWAP_IFRAME_SESSION_STORAGE_KEY_PREFIX + request.swapId,
                Utf8Tools.stringToUtf8ByteArray(data),
            ) || undefined;

            resolve({
                success: true,
                eurPubKey,

                // The Hub will get access to the encryption key, but not the encrypted cookie. The server can
                // potentially get access to the encrypted cookie, but not the encryption key (the result including
                // the encryption key will be set as url fragment and thus not be sent to the server), as long as
                // the Hub is not compromised. An attacker would need to get access to the Keyguard and Hub servers.
                tmpCookieEncryptionKey,
            });
        } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
        }
    }

    run() {
        // Go to start page
        window.location.hash = SignSwap.Pages.CONFIRM_SWAP;
    }
}

SignSwap.Pages = {
    CONFIRM_SWAP: 'confirm-swap',
};
