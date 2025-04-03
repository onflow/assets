import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBlockchainContext } from "./utils";
import { registerEVMAsset, updateCustomizedDisplay } from "./utils/actions";
import { FlowConnector } from "./utils/flow";
import type { TokenStatus } from "./utils/types";
import type { FlowBlockchainContext } from "./utils/types";

// Get the directory name of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/onflow/assets/main";

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
    const NETWORK = process.env.NETWORK;
    if (!NETWORK || !["mainnet", "testnet"].includes(NETWORK)) {
        console.error('Please set NETWORK environment variable to either "mainnet" or "testnet"');
        process.exit(1);
    }

    console.log(`\n[Script] Starting process on ${NETWORK}`);

    const ctx = await buildBlockchainContext();
    const shortlistedPath = join(
        __dirname,
        "..",
        "outputs",
        NETWORK as "mainnet" | "testnet",
        "shortlisted-contracts.json",
    );

    if (!existsSync(shortlistedPath)) {
        console.error(`[Script] Shortlisted contracts file not found for network: ${NETWORK}`);
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
                await registerToken(ctx, contract.address.toLowerCase());
            }

            // Check logo URI
            const logoBasePath = `tokens/logos/${contract.address}`;
            const expectedSvgUri = `${GITHUB_RAW_BASE}/${logoBasePath}/logo.svg`;
            const expectedPngUri = `${GITHUB_RAW_BASE}/${logoBasePath}/logo.png`;

            // Prioritize SVG, fallback to PNG if not available
            const targetUri = contract.logos.svg ? expectedSvgUri : expectedPngUri;

            if (contract.onchainLogoUri?.toLowerCase() !== targetUri.toLowerCase()) {
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
}

main().catch(console.error);