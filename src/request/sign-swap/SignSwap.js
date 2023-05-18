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
/* global PolygonUtils */
/* global PolygonConstants */
/* global PolygonContractABIs */
/* global PolygonKey */
/* global ethers */
/* global EuroConstants */
/* global EuroUtils */
/* global Identicon */
/* global TemplateTags */
/* global I18n */
/* global SignSwapApi */
/* global SwapFeesTooltip */
/* global BalanceDistributionBar */
/* global Constants */
/* global NonPartitionedSessionStorage */
/* global CONFIG */

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
        const $leftAccount = (this.$el.querySelector('.left-account'));
        /** @type {HTMLDivElement} */
        const $rightAccount = (this.$el.querySelector('.right-account'));
        /** @type {HTMLDivElement} */
        const $leftIdenticon = ($leftAccount.querySelector('.identicon'));
        /** @type {HTMLDivElement} */
        const $rightIdenticon = ($rightAccount.querySelector('.identicon'));
        /** @type {HTMLSpanElement} */
        const $leftLabel = ($leftAccount.querySelector('.label'));
        /** @type {HTMLSpanElement} */
        const $rightLabel = ($rightAccount.querySelector('.label'));
        /** @type {HTMLSpanElement} */
        const $leftNewBalance = ($leftAccount.querySelector('.new-balance'));
        /** @type {HTMLDivElement} */
        const $rightNewBalance = ($rightAccount.querySelector('.new-balance'));
        /** @type {HTMLDivElement} */
        const $swapValues = (this.$el.querySelector('.swap-values'));
        /** @type {HTMLSpanElement} */
        const $swapLeftValue = (this.$el.querySelector('#swap-left-value'));
        /** @type {HTMLSpanElement} */
        const $swapRightValue = (this.$el.querySelector('#swap-right-value'));

        // The total amount the user loses
        let swapFromValue = 0;
        switch (fundTx.type) {
            case 'NIM': swapFromValue = fundTx.transaction.value + fundTx.transaction.fee; break;
            case 'BTC': swapFromValue = fundTx.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0)
                    - (fundTx.changeOutput ? fundTx.changeOutput.value : 0); break;
            case 'USDC': swapFromValue = fundTx.description.args.amount
                .add(fundTx.description.args.fee).toNumber(); break;
            case 'EUR': swapFromValue = fundTx.amount + fundTx.fee; break;
            default: throw new Errors.KeyguardError('Invalid asset');
        }

        // The total amount the user receives
        let swapToValue = 0;
        switch (redeemTx.type) {
            case 'NIM': swapToValue = redeemTx.transaction.value; break;
            case 'BTC': swapToValue = redeemTx.output.value; break;
            case 'USDC': swapToValue = redeemTx.amount; break;
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
            this._unitsToCoins(leftAsset, leftAmount),
            leftAsset === 'USDC' ? 2 : this._assetDecimals(leftAsset),
            leftAsset === 'EUR' || leftAsset === 'USDC' ? 2 : 0,
        );

        $swapRightValue.textContent = NumberFormatting.formatNumber(
            this._unitsToCoins(rightAsset, rightAmount),
            rightAsset === 'USDC' ? 2 : this._assetDecimals(rightAsset),
            rightAsset === 'EUR' || rightAsset === 'USDC' ? 2 : 0,
        );

        $swapValues.classList.add(`${fundTx.type.toLowerCase()}-to-${redeemTx.type.toLowerCase()}`);

        /** @type {'NIM' | 'BTC' | 'USDC' | 'EUR'} */
        let exchangeBaseAsset;
        // If EUR is part of the swap, the other currency is the base asset
        if (fundTx.type === 'EUR') exchangeBaseAsset = redeemTx.type;
        else if (redeemTx.type === 'EUR') exchangeBaseAsset = fundTx.type;
        // If the layout is 'slider', the left asset is the base asset
        else if (request.layout === SignSwapApi.Layouts.SLIDER) exchangeBaseAsset = leftAsset;
        else exchangeBaseAsset = fundTx.type;

        const exchangeOtherAsset = exchangeBaseAsset === fundTx.type ? redeemTx.type : fundTx.type;

        // Exchange rate
        /** @type {number} */
        let exchangeBaseValue;
        switch (exchangeBaseAsset) {
            case 'NIM':
                exchangeBaseValue = fundTx.type === 'NIM'
                    // When the user funds NIM, the service receives the HTLC balance - their network fee.
                    ? fundTx.transaction.value - request.fundFees.redeeming
                    : redeemTx.type === 'NIM'
                        // When the user redeems NIM, the service lost the HTLC balance + their network fee.
                        // The transaction value is "HTLC balance - tx fee", therefore the "HTLC balance"
                        // is the transaction value + tx fee.
                        ? redeemTx.transaction.value + redeemTx.transaction.fee + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
                break;
            case 'BTC':
                exchangeBaseValue = fundTx.type === 'BTC'
                    // When the user funds BTC, the service receives the HTLC balance - their network fee.
                    ? fundTx.recipientOutput.value - request.fundFees.redeeming
                    : redeemTx.type === 'BTC'
                        // When the user redeems BTC, the service lost the HTLC balance + their network fee.
                        // The HTLC balance is represented by the redeeming tx input value.
                        ? redeemTx.input.witnessUtxo.value + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
                break;
            case 'USDC':
                exchangeBaseValue = fundTx.type === 'USDC'
                    // When the user funds USDC, the service receives the HTLC balance - their network fee.
                    ? fundTx.description.args.amount.toNumber() - request.fundFees.redeeming
                    : redeemTx.type === 'USDC'
                        // When the user redeems USDC, the service lost the HTLC balance + their network fee.
                        // The transaction value is "HTLC balance - tx fee", therefore the "HTLC balance"
                        // is the transaction value + tx fee.
                        ? redeemTx.amount + redeemTx.description.args.fee.toNumber() + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
                break;
            case 'EUR':
                exchangeBaseValue = fundTx.type === 'EUR'
                    ? fundTx.amount - request.fundFees.redeeming
                    : redeemTx.type === 'EUR'
                        ? redeemTx.amount + request.redeemFees.processing + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
                break;
            default:
                throw new Errors.KeyguardError('UNEXPECTED: Unsupported exchange rate base asset');
        }

        /** @type {number} */
        let exchangeOtherValue;
        switch (exchangeOtherAsset) {
            case 'NIM':
                exchangeOtherValue = fundTx.type === 'NIM'
                    // When the user funds NIM, the service receives the HTLC balance - their network fee.
                    ? fundTx.transaction.value - request.fundFees.redeeming
                    : redeemTx.type === 'NIM'
                        // When the user redeems NIM, the service lost the HTLC balance + their network fee.
                        // The transaction value is "HTLC balance - tx fee", therefore the "HTLC balance"
                        // is the transaction value + tx fee.
                        ? redeemTx.transaction.value + redeemTx.transaction.fee + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
                break;
            case 'BTC':
                exchangeOtherValue = fundTx.type === 'BTC'
                    // When the user funds BTC, the service receives the HTLC balance - their network fee.
                    ? fundTx.recipientOutput.value - request.fundFees.redeeming
                    : redeemTx.type === 'BTC'
                        // When the user redeems BTC, the service lost the HTLC balance + their network fee.
                        // The HTLC balance is represented by the redeeming tx input value.
                        ? redeemTx.input.witnessUtxo.value + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
                break;
            case 'USDC':
                exchangeOtherValue = fundTx.type === 'USDC'
                    // When the user funds USDC, the service receives the HTLC balance - their network fee.
                    ? fundTx.description.args.amount.toNumber() - request.fundFees.redeeming
                    : redeemTx.type === 'USDC'
                        // When the user redeems USDC, the service lost the HTLC balance + their network fee.
                        // The transaction value is "HTLC balance - tx fee", therefore the "HTLC balance"
                        // is the transaction value + tx fee.
                        ? redeemTx.amount + redeemTx.description.args.fee.toNumber() + request.redeemFees.funding
                        : 0; // Should never happen, if parsing works correctly
                break;
            case 'EUR':
                exchangeOtherValue = fundTx.type === 'EUR'
                    ? fundTx.amount - request.fundFees.redeeming
                    : redeemTx.type === 'EUR'
                        ? redeemTx.amount + request.redeemFees.processing + request.redeemFees.funding
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

        // Make sure to show enough decimals
        const exchangeRateDigitsLength = exchangeRate
            .toFixed(this._assetDecimals(exchangeOtherAsset) + 1)
            .split('.')[0]
            .replace('0', '')
            .length;
        const exchangeRateDecimals = Math.max(
            0,
            this._assetDecimals(exchangeOtherAsset) - exchangeRateDigitsLength,
        );
        const exchangeRateString = `1 ${exchangeBaseAsset} = ${NumberFormatting.formatNumber(
            exchangeRate,
            exchangeRateDecimals,
            exchangeOtherAsset === 'EUR' ? this._assetDecimals(exchangeOtherAsset) : 0,
        )} ${exchangeOtherAsset}`;

        /** @type {HTMLDivElement} */
        const $topRow = (this.$el.querySelector('.nq-notice'));
        $topRow.appendChild(
            new SwapFeesTooltip(
                request,
                fundTx.type === exchangeBaseAsset ? exchangeBaseValue : exchangeOtherValue,
                fundTx.type === exchangeBaseAsset ? exchangeOtherValue : exchangeBaseValue,
                exchangeRateString,
            ).$el,
        );

        if (request.layout === SignSwapApi.Layouts.STANDARD) {
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
            } else if (request.fund.type === 'USDC') {
                $leftIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/usdc.svg"></img>`;
                $leftLabel.textContent = I18n.translatePhrase('usd-coin');
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
            } else if (request.redeem.type === 'USDC') {
                $rightIdenticon.innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/usdc.svg"></img>`;
                $rightLabel.textContent = I18n.translatePhrase('usd-coin');
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

            /** @type {HTMLDivElement} */
            const $balanceDistributionBar = (this.$el.querySelector('.balance-distribution-bar'));
            /** @type {HTMLSpanElement} */
            const $swapLeftValueFiat = (this.$el.querySelector('#swap-left-value-fiat'));
            /** @type {HTMLSpanElement} */
            const $swapRightValueFiat = (this.$el.querySelector('#swap-right-value-fiat'));
            /** @type {HTMLSpanElement} */
            const $swapLeftSymbol = (this.$el.querySelector('#swap-left-symbol'));
            /** @type {HTMLSpanElement} */
            const $swapRightSymbol = (this.$el.querySelector('#swap-right-symbol'));

            $swapLeftSymbol.classList.add(`${leftAsset.toLowerCase()}-symbol`);
            $swapRightSymbol.classList.add(`${rightAsset.toLowerCase()}-symbol`);

            if (leftAsset === 'NIM' || rightAsset === 'NIM') {
                const swapNimAddress = fundTx.type === 'NIM'
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
                (leftAsset === 'BTC' ? $leftLabel : $rightLabel).textContent = I18n.translatePhrase('bitcoin');
            }

            if (leftAsset === 'USDC' || rightAsset === 'USDC') {
                (leftAsset === 'USDC' ? $leftIdenticon : $rightIdenticon)
                    .innerHTML = TemplateTags.hasVars(0)`<img src="../../assets/icons/usdc.svg"></img>`;
                (leftAsset === 'USDC' ? $leftLabel : $rightLabel).textContent = I18n.translatePhrase('usd-coin');
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
                this._unitsToCoins(leftAsset, leftAmount) * leftFiatRate,
                request.fiatCurrency,
            );
            $swapRightValueFiat.textContent = NumberFormatting.formatCurrency(
                this._unitsToCoins(rightAsset, rightAmount) * rightFiatRate,
                request.fiatCurrency,
            );

            /** @typedef {{address: string, balance: number, active: boolean, newBalance: number}} Segment */

            /** @type {Segment[] | undefined} */
            let leftSegments;
            /** @type {Segment[] | undefined} */
            let rightSegments;

            if (leftAsset === 'NIM' || rightAsset === 'NIM') {
                const activeAddress = fundTx.type === 'NIM'
                    ? fundTx.transaction.sender.toUserFriendlyAddress()
                    : redeemTx.type === 'NIM'
                        ? redeemTx.transaction.recipient.toUserFriendlyAddress()
                        : ''; // Should never happen, if parsing works correctly

                const activeAddressInfo = request.nimiqAddresses.find(ai => ai.address === activeAddress);
                if (!activeAddressInfo) {
                    throw new Errors.KeyguardError('UNEXPECTED: Address info of swap NIM address not found');
                }

                const amount = leftAsset === 'NIM' ? leftAmount : rightAmount;

                const newBalance = activeAddressInfo.balance + (amount * (fundTx.type === 'NIM' ? -1 : 1));
                const newBalanceFormatted = NumberFormatting.formatNumber(this._unitsToCoins('NIM', newBalance), 0, 0);

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
                const newBalanceFormatted = NumberFormatting.formatNumber(this._unitsToCoins('BTC', newBalance), 8, 0);

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

            if (leftAsset === 'USDC' || rightAsset === 'USDC') {
                const amount = leftAsset === 'USDC' ? leftAmount : rightAmount;

                const newBalance = request.polygonAddresses[0].balance + (amount * (fundTx.type === 'USDC' ? -1 : 1));
                const newBalanceFormatted = NumberFormatting.formatNumber(this._unitsToCoins('USDC', newBalance), 2, 2);

                if (leftAsset === 'USDC') {
                    $leftNewBalance.textContent = `${newBalanceFormatted} USDC`;
                    $leftAccount.classList.add('usdc');
                } else if (rightAsset === 'USDC') {
                    $rightNewBalance.textContent = `${newBalanceFormatted} USDC`;
                    $rightAccount.classList.add('usdc');
                }

                /** @type {Segment[]} */
                const segments = [{
                    address: 'usdc',
                    balance: request.polygonAddresses[0].balance,
                    active: true,
                    newBalance,
                }];

                if (leftAsset === 'USDC') leftSegments = segments;
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
        /** @type {HTMLFormElement} */
        const $passwordBox = (document.querySelector('#password-box'));
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
     * @param {'NIM' | 'BTC' | 'USDC' | 'EUR'} asset
     * @param {number} units
     * @returns {number}
     */
    _unitsToCoins(asset, units) {
        switch (asset) {
            case 'NIM': return Nimiq.Policy.lunasToCoins(units);
            case 'BTC': return BitcoinUtils.satoshisToCoins(units);
            case 'USDC': return PolygonUtils.centsToCoins(units);
            case 'EUR': return EuroUtils.centsToCoins(units);
            default: throw new Error(`Invalid asset ${asset}`);
        }
    }

    /**
     * @param {'NIM' | 'BTC' | 'USDC' | 'EUR'} asset
     * @returns {number}
     */
    _assetDecimals(asset) {
        switch (asset) {
            case 'NIM': return Math.log10(Nimiq.Policy.LUNAS_PER_COIN);
            case 'BTC': return Math.log10(BitcoinConstants.SATOSHIS_PER_COIN);
            case 'USDC': return Math.log10(PolygonConstants.CENTS_PER_COINS);
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

        const bitcoinKey = new BitcoinKey(key);
        const polygonKey = new PolygonKey(key);

        /** @type {{nim: string, btc: string[], usdc: string, eur: string, btc_refund?: string}} */
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

        if (request.fund.type === 'USDC') {
            if (request.fund.description.name === 'openWithApproval') {
                // Sign approval
                const usdcContract = new ethers.Contract(
                    CONFIG.USDC_CONTRACT_ADDRESS,
                    PolygonContractABIs.USDC_CONTRACT_ABI,
                );

                const functionSignature = usdcContract.interface.encodeFunctionData(
                    'approve',
                    [CONFIG.USDC_HTLC_CONTRACT_ADDRESS, request.fund.description.args.approval],
                );

                // TODO: Make the domain parameters configurable in the request?
                const domain = {
                    name: 'USD Coin (PoS)', // This is currently the same for testnet and mainnet
                    version: '1', // This is currently the same for testnet and mainnet
                    verifyingContract: CONFIG.USDC_CONTRACT_ADDRESS,
                    salt: ethers.utils.hexZeroPad(ethers.utils.hexlify(CONFIG.POLYGON_CHAIN_ID), 32),
                };

                const types = {
                    MetaTransaction: [
                        { name: 'nonce', type: 'uint256' },
                        { name: 'from', type: 'address' },
                        { name: 'functionSignature', type: 'bytes' },
                    ],
                };

                const message = {
                    // Has been validated to be defined when function called is `openWithApproval`
                    nonce: /** @type {{ tokenNonce: number }} */ (request.fund.approval).tokenNonce,
                    from: request.fund.request.from,
                    functionSignature,
                };

                const signature = await polygonKey.signTypedData(
                    request.fund.keyPath,
                    domain,
                    types,
                    message,
                );

                const signerAddress = ethers.utils.verifyTypedData(domain, types, message, signature);
                if (signerAddress !== request.fund.request.from) {
                    reject(new Errors.CoreError('Failed to sign approval'));
                    return;
                }

                const sigR = signature.slice(0, 66); // 0x prefix plus 32 bytes = 66 characters
                const sigS = `0x${signature.slice(66, 130)}`; // 32 bytes = 64 characters
                const sigV = parseInt(signature.slice(130, 132), 16); // last byte = 2 characters

                const htlcContract = new ethers.Contract(
                    CONFIG.USDC_HTLC_CONTRACT_ADDRESS,
                    PolygonContractABIs.USDC_HTLC_CONTRACT_ABI,
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
            privateKeys.usdc = wallet.privateKey;
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

        if (request.redeem.type === 'USDC') {
            const wallet = polygonKey.deriveKeyPair(request.redeem.keyPath);
            privateKeys.usdc = wallet.privateKey;
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
            reject(error);
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
