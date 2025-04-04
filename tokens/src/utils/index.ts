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
    const connecter = new FlowConnector(flowJSON, network);
    const wallet = new FlowWallet(connecter);

    return { wallet };
}
