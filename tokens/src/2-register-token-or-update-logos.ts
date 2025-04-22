import { existsSync } from "node:fs";
import { buildBlockchainContext } from "./utils";
import { getEVMAssets, registerEVMAsset, updateCustomizedDisplay } from "./utils/actions";
import { type Network, getLogoUrl, getShortlistedContractsPath, networks } from "./utils/config";
import type { FlowConnector } from "./utils/flow";
import type { TokenStatus } from "./utils/types";
import type { FlowBlockchainContext } from "./utils/types";

async function checkUrlAvailability(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Failed to check ${url}: ${errorMessage}`);
        return false;
    }
}

async function waitForTransaction(connector: FlowConnector, txid: string) {
    console.log(`\n⏳ Waiting for transaction ${txid}...`);
    const status = await connector.onceTransactionExecuted(txid);
    console.log(
        `📝 Transaction status: ${status.status}${status.errorMessage ? ` (${status.errorMessage})` : ""}\n`,
    );
    return status;
}

async function checkBalance(ctx: FlowBlockchainContext, requiredBalance: number) {
    const walletAddress = ctx.wallet?.address;
    if (!walletAddress) {
        throw new Error("No wallet address found");
    }
    const balance = await ctx.connector.getAccount(walletAddress);
    console.log(`💰 Balance: ${balance.balance} FLOW`);
    if (balance.balance < requiredBalance) {
        console.error(
            `❌ Insufficient balance: ${balance.balance} FLOW, required: ${requiredBalance} FLOW`,
        );
        throw new Error("Insufficient balance");
    }
}

async function registerToken(ctx: FlowBlockchainContext, address: string) {
    if (!ctx.wallet) {
        throw new Error("No wallet found");
    }
    console.log(`\n📝 Registering ${address}...`);
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
    if (!ctx.wallet) {
        throw new Error("No wallet found");
    }
    console.log(`\n🖼️ Updating logo for ${cadenceAddress} to ${logoUri}...`);
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

    console.log(`\n🔍 Starting token registration process on ${network.toUpperCase()}`);

    const ctx = await buildBlockchainContext();
    const shortlistedPath = getShortlistedContractsPath(network);

    if (!existsSync(shortlistedPath)) {
        console.error(`❌ Shortlisted contracts file not found for network: ${network}`);
        process.exit(1);
    }

    const shortlistedContracts: TokenStatus[] = require(shortlistedPath);
    console.log(`📂 Found ${shortlistedContracts.length} contracts to process\n`);

    for (const contract of shortlistedContracts) {
        console.log(`\n📝 Processing ${contract.address}`);
        console.log(`📊 Status: Registered:${contract.registered} Bridged:${contract.bridged}`);

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
                ? getLogoUrl(network, contract.address, "svg")
                : contract.logos.png
                  ? getLogoUrl(network, contract.address, "png")
                  : undefined;

            if (
                targetUri !== undefined &&
                contract.onchainLogoUri?.toLowerCase() !== targetUri.toLowerCase()
            ) {
                // Query chain status with lowercase address
                const updatedEVMStatus = await getEVMAssets(
                    ctx.connector,
                    contract.address.toLowerCase(),
                );
                const cadenceAddress =
                    updatedEVMStatus?.bridgedAddress ?? contract.cadence?.address;
                const cadenceContractName =
                    updatedEVMStatus?.bridgedContractName ?? contract.cadence?.contractName;

                if (!cadenceAddress || !cadenceContractName) {
                    console.error(`❌ No cadence info found for ${contract.address}`);
                    continue;
                }

                // Check URL availability
                console.log(`🔍 Verifying logo URL: ${targetUri}`);
                const isAvailable = await checkUrlAvailability(targetUri);
                if (!isAvailable) {
                    console.error(`❌ Logo URL is not accessible: ${targetUri}`);
                    continue;
                }
                console.log("✅ Logo URL is accessible\n");

                await updateTokenLogo(ctx, cadenceAddress, cadenceContractName, targetUri);
            }
        } catch (error) {
            console.error(`❌ Failed to process ${contract.address}:`, error);
        }
    }

    console.log("\n✨ All contracts processed successfully");
    process.exit(0);
}

main().catch(console.error);