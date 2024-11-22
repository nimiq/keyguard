/* global runKeyguard */
/* global SwapIFrameApi */

runKeyguard(SwapIFrameApi, {
    loadNimiq: true,
    whitelist: [
        'signSwapTransactions',
    ],
});
