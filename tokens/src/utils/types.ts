import type { ArgsFn } from "@onflow/fcl-core/types/exec/args";
import type { Account } from "@onflow/typedefs";
import type { FlowConnector, FlowWallet } from "./flow";

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
    connector: FlowConnector;
    wallet?: FlowWallet;
}

interface URLDef {
    url: string;
}

export interface FTDisplay {
    name: string;
    symbol: string;
    description: string;
    externalURL?: URLDef;
    logos?: {
        items: Array<{
            file: URLDef;
            mediaType: string;
        }>;
    };
    socials?: Record<string, URLDef>;
}

export interface EVMAssetStatus {
    evmAddress: string;
    isRegistered: boolean;
    isBridged: boolean;
    bridgedAddress: string | null;
    bridgedContractName: string | null;
    display: FTDisplay | null;
}

export interface TokenStatus {
    address: string;
    registered?: boolean;
    bridged?: boolean;
    logos: {
        png: boolean;
        svg: boolean;
    };
    mods: boolean;
    cadence?: {
        address: string;
        contractName: string;
    };
    onchainLogoUri?: string;
}

export const customizableFields = ["symbol", "name", "description"] as const;

export type CustomizableTokenFields = {
    [K in (typeof customizableFields)[number]]: string;
};

export interface Token extends CustomizableTokenFields {
    address: string;
    decimals: number;
    logoURI: string;
    flowIdentifier: string;
    flowAddress: string;
    contractName: string;
    [key: string]: unknown;
}

export interface TokenList {
    tokens: Token[];
    totalAmount: number;
    version: {
        major: number;
        minor: number;
        patch: number;
    };
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    folder: string;
    isTestnet: boolean;
    isBridged?: boolean;
}