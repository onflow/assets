import { networkName } from "./config";
import { FlowConnector, FlowWallet, type NetworkType } from "./flow";

import flowJSON from "../../flow.json" assert { type: "json" };
import type { Context, FlowBlockchainContext } from "./types";

export * from "./config";

export function logTimeWrapper(fn: (...args: unknown[]) => Promise<unknown>) {
    return async (...args: unknown[]) => {
        console.time(`Function Call [${fn.name}]`);
        const result = await fn(...args);
        console.timeEnd(`Function Call [${fn.name}]`);
        return result;
    };
}

export async function buildBlockchainContext(): Promise<FlowBlockchainContext> {
    const connecter = new FlowConnector(flowJSON, networkName as NetworkType);
    const wallet = new FlowWallet(connecter);

    return { wallet };
}
