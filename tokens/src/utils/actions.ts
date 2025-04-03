import scriptGetFtContractByEVM from "../cadence/scripts/get-ft-contract-by-evm.cdc?raw";
import trxMaintainerUpdateCustomDisplay from "../cadence/transactions/maintainer-update-customized-ft-display.cdc?raw";
import trxRegisterEVMAsset from "../cadence/transactions/register-evm-asset.cdc?raw";

import type { FlowWallet } from "./flow";
import type { EVMAssetStatus } from "./types";

// Scripts actions

export async function getEVMAssets(
    flowWallet: FlowWallet,
    evmContractAddress: string,
): Promise<EVMAssetStatus | null> {
    const result = await flowWallet.executeScript(
        scriptGetFtContractByEVM,
        (arg, t) => [arg(evmContractAddress.toLowerCase(), t.String)],
        null,
    );
    return result;
}

// Transactions actions

export async function updateCustomizedDisplay(
    flowWallet: FlowWallet,
    ftAddress: string,
    ftContractName: string,
    logo: string,
): Promise<string> {
    const txid = await flowWallet.sendTransaction(trxMaintainerUpdateCustomDisplay, (arg, t) => [
        arg(ftAddress, t.Address),
        arg(ftContractName, t.String),
        arg(null, t.Optional(t.String)),
        arg(null, t.Optional(t.String)),
        arg(null, t.Optional(t.String)),
        arg(null, t.Optional(t.String)),
        arg(logo, t.Optional(t.String)),
        arg([], t.Dictionary({ key: t.String, value: t.String })),
    ]);
    return txid;
}

export async function registerEVMAsset(
    flowWallet: FlowWallet,
    evmContractAddress: string,
): Promise<string> {
    const txid = await flowWallet.sendTransaction(trxRegisterEVMAsset, (arg, t) => [
        arg(evmContractAddress.toLowerCase(), t.String),
    ]);
    return txid;
}