import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBlockchainContext } from "./utils";
import { registerEVMAsset, updateCustomizedDisplay } from "./utils/actions";
import type { TokenStatus } from "./utils/types";

// Get the directory name of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/onflow/assets/main";

async function main() {
    const NETWORK = process.env.NETWORK;
    if (!NETWORK || !["mainnet", "testnet"].includes(NETWORK)) {
        console.error('Please set NETWORK environment variable to either "mainnet" or "testnet"');
        process.exit(1);
    }

    const ctx = await buildBlockchainContext();
    const shortlistedPath = join(
        __dirname,
        "..",
        "outputs",
        NETWORK as "mainnet" | "testnet",
        "shortlisted-contracts.json",
    );

    if (!existsSync(shortlistedPath)) {
        console.error(`Shortlisted contracts file not found for network: ${NETWORK}`);
        process.exit(1);
    }

    const shortlistedContracts: TokenStatus[] = require(shortlistedPath);

    for (const contract of shortlistedContracts) {
        console.log(`Processing contract: ${contract.address}`);

        // 检查是否已注册和桥接
        if (!contract.registered || !contract.bridged) {
            console.log(`Registering EVM asset: ${contract.address}`);
            try {
                const txid = await registerEVMAsset(ctx.wallet, contract.address);
                console.log(`Registration transaction sent: ${txid}`);
            } catch (error) {
                console.error(`Failed to register EVM asset: ${error}`);
                continue;
            }
        }

        // 检查logo URI
        const evmAddressLower = contract.address.toLowerCase();
        const logoBasePath = `tokens/logos/${evmAddressLower}`;
        const expectedSvgUri = `${GITHUB_RAW_BASE}/${logoBasePath}/logo.svg`;
        const expectedPngUri = `${GITHUB_RAW_BASE}/${logoBasePath}/logo.png`;

        // 优先使用SVG，如果没有则使用PNG
        const targetUri = contract.logos.svg ? expectedSvgUri : expectedPngUri;

        if (contract.onchainLogoUri !== targetUri) {
            console.log(`Updating logo URI for ${contract.address}`);
            console.log(`From: ${contract.onchainLogoUri}`);
            console.log(`To: ${targetUri}`);

            if (!contract.cadence) {
                console.error(`No cadence info found for contract: ${contract.address}`);
                continue;
            }

            try {
                const txid = await updateCustomizedDisplay(
                    ctx.wallet,
                    contract.cadence.address,
                    contract.cadence.contractName,
                    targetUri,
                );
                console.log(`Logo update transaction sent: ${txid}`);
            } catch (error) {
                console.error(`Failed to update logo URI: ${error}`);
            }
        }
    }
}

main().catch(console.error);