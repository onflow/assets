import { type Network, networkName } from "./config";
import { FlowConnector, FlowWallet } from "./flow";

import flowJSON from "../../flow.json" assert { type: "json" };
import type { FlowBlockchainContext } from "./types";

export * from "./config";
export * from "./flow";
export * from "./actions";

export function logTimeWrapper(fn: (...args: unknown[]) => Promise<unknown>) {
    return async (...args: unknown[]) => {
        console.time(`Function Call [${fn.name}]`);
        const result = await fn(...args);
        console.timeEnd(`Function Call [${fn.name}]`);
        return result;
    };
}

export async function buildBlockchainContext(
    network: Network = networkName,
): Promise<FlowBlockchainContext> {
    const connector = new FlowConnector(flowJSON, network);
    let wallet: FlowWallet | undefined = undefined;
    try {
        wallet = new FlowWallet(connector);
    } catch (_e) {
        // No need to log error here, it's probably because the wallet is not set
    }
    return { connector, wallet };
}
