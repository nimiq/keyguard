import * as _NimiqGaslessCore from '@nimiq/gasless-sdk/dist/core/index';

declare global {
    const NimiqGaslessCore: typeof _NimiqGaslessCore;

    type GaslessChainPins = _NimiqGaslessCore.ChainPins;
    type GaslessTransferIntent = _NimiqGaslessCore.TransferIntent;
    type GaslessTransferRequest = _NimiqGaslessCore.TransferRequest;
}
