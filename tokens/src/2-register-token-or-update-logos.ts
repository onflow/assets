import { existsSync } from "node:fs";
import { buildBlockchainContext } from "./utils";
import { registerEVMAsset, updateCustomizedDisplay } from "./utils/actions";
import { type Network, getLogoUrl, getShortlistedContractsPath, networks } from "./utils/config";
import { FlowConnector } from "./utils/flow";
import type { TokenStatus } from "./utils/types";
import type { FlowBlockchainContext } from "./utils/types";

async function checkUrlAvailability(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`[URL Check] Failed to check ${url}: ${errorMessage}`);
        return false;
    }
}

async function waitForTransaction(connector: FlowConnector, txid: string) {
    console.log(`\n[Transaction] Waiting for ${txid}...`);
    const status = await connector.onceTransactionExecuted(txid);
    console.log(
        `[Transaction] Status: ${status.status}${status.errorMessage ? ` (${status.errorMessage})` : ""}\n`,
    );
    return status;
}

async function checkBalance(ctx: FlowBlockchainContext, requiredBalance: number) {
    const balance = await ctx.wallet.connector.getAccount(ctx.wallet.address);
    console.log(`[Balance] ${ctx.wallet.address}: ${balance.balance}`);
    if (balance.balance < requiredBalance) {
        console.error(
            `[Balance] Insufficient balance: ${balance.balance}, required: ${requiredBalance}`,
        );
        throw new Error("Insufficient balance");
    }
}

async function registerToken(ctx: FlowBlockchainContext, address: string) {
    console.log(`\n[Register] Registering ${address}...`);
    const txid = await registerEVMAsset(ctx.wallet, address);
    await waitForTransaction(ctx.wallet.connector, txid);
    return txid;
}

async function updateTokenLogo(
    ctx: FlowBlockchainContext,
    cadenceAddress: string,
    cadenceContractName: string,
    logoUri: string,
) {
    console.log(`\n[Update Logo] Updating logo for ${cadenceAddress} to ${logoUri}...`);
    const txid = await updateCustomizedDisplay(
        ctx.wallet,
        cadenceAddress,
        cadenceContractName,
        logoUri,
    );
    await waitForTransaction(ctx.wallet.connector, txid);
    return txid;
}

async function main() {
    const network = process.env.NETWORK as Network;
    if (!network || !networks.includes(network)) {
        console.error(
            `Please set NETWORK environment variable to either "${networks.join('" or "')}"`,
        );
        process.exit(1);
    }

    console.log(`\n[Script] Starting process on ${network}`);

    const ctx = await buildBlockchainContext();
    const shortlistedPath = getShortlistedContractsPath(network);

    if (!existsSync(shortlistedPath)) {
        console.error(`[Script] Shortlisted contracts file not found for network: ${network}`);
        process.exit(1);
    }

    const shortlistedContracts: TokenStatus[] = require(shortlistedPath);
    console.log(`[Script] Found ${shortlistedContracts.length} contracts\n`);

    for (const contract of shortlistedContracts) {
        console.log(`[Contract] ${contract.address}`);
        console.log(
            `[Contract] Status: ${contract.registered ? "Registered" : "Not Registered"} | ${contract.bridged ? "Bridged" : "Not Bridged"}`,
        );

        try {
            if (!contract.registered || !contract.bridged) {
                // Bridging token requires 1 FLOW
                if (!contract.bridged) {
                    await checkBalance(ctx, 1);
                }
                // Register token
                await registerToken(ctx, contract.address.toLowerCase());
            }

            // Check logo URI
            const targetUri = contract.logos.svg
                ? getLogoUrl(contract.address, "svg")
                : contract.logos.png
                  ? getLogoUrl(contract.address, "png")
                  : undefined;

            if (
                targetUri !== undefined &&
                contract.onchainLogoUri?.toLowerCase() !== targetUri.toLowerCase()
            ) {
                if (!contract.cadence) {
                    console.error(`[Contract] No cadence info found for ${contract.address}`);
                    continue;
                }

                // Check URL availability
                console.log(`[URL Check] Verifying ${targetUri}...`);
                const isAvailable = await checkUrlAvailability(targetUri);
                if (!isAvailable) {
                    console.error(`[URL Check] Logo URL is not accessible: ${targetUri}`);
                    continue;
                }
                console.log("[URL Check] Logo URL is accessible\n");

                await updateTokenLogo(
                    ctx,
                    contract.cadence.address,
                    contract.cadence.contractName,
                    targetUri,
                );
            }
        } catch (error) {
            console.error(`[Contract] Failed to process ${contract.address}:`, error);
        }
    }

    console.log("\n[Script] All contracts processed");
    process.exit(0);
}

main().catch(console.error);