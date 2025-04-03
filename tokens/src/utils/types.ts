import type { ArgsFn } from "@onflow/fcl-core/types/exec/args";
import type { Account } from "@onflow/typedefs";
import type { FlowWallet } from "./flow";

export type Authz = (account: Account) => Promise<object> | object;

export interface IFlowScriptExecutor {
    /**
     * Execute a script
     * @param code Cadence code
     * @param args Cadence arguments
     */
    executeScript<T>(code: string, args: ArgsFn, defaultValue: T): Promise<T>;
}

/**
 * Signer interface
 */
export interface IFlowSigner {
    /**
     * Send a transaction
     */
    sendTransaction(code: string, args: ArgsFn, authz?: Authz): Promise<string>;

    /**
     * Build authorization
     */
    buildAuthorization(accountIndex?: number, privateKey?: string): Authz;
}

export interface Context extends Record<string, unknown> {}

export interface FlowBlockchainContext extends Context {
	wallet: FlowWallet;
}

export interface EVMAssetStatus {
    evmAddress: string;
    isNFT: boolean;
    isRegistered: boolean;
    isBridged: boolean;
    bridgedAddress: string | null;
    bridgedContractName: string | null;
}

export interface TokenStatus {
    address: string;
    registered?: boolean;
    bridged?: boolean;
    logos: {
        png: boolean;
        svg: boolean;
    };
    cadence?: {
        address: string;
        contractName: string;
    };
}
