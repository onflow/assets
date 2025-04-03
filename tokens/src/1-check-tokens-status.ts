import { promises as fs } from "node:fs";
import path from "node:path";

import { buildBlockchainContext } from "./utils";
import { getEVMAssets } from "./utils/actions";
import { LOGOS_DIR, type Network, getShortlistedContractsPath, networks } from "./utils/config";
import type { FlowBlockchainContext, TokenStatus } from "./utils/types";

const EVM_ADDRESS_REGEX = /^(?:testnet:)?0x[a-fA-F0-9]{40}$/;

async function checkDirectory(
    ctx: FlowBlockchainContext,
    dirPath: string,
): Promise<TokenStatus | null> {
    const dirName = path.basename(dirPath);

    // Check if directory name matches EVM address pattern
    if (!EVM_ADDRESS_REGEX.test(dirName)) {
        return null;
    }

    // Check for logo files
    const files = await fs.readdir(dirPath);
    const hasPng = files.includes("logo.png");
    const hasSvg = files.includes("logo.svg");

    // Extract EVM address (remove testnet: prefix if exists) but keep original case
    const evmAddress = dirName.startsWith("testnet:") ? dirName.slice(8) : dirName;

    // Query chain status with lowercase address
    const evmAssetStatus = await getEVMAssets(ctx.wallet, evmAddress.toLowerCase());

    if (!evmAssetStatus) {
        return {
            address: evmAddress, // Store original case for file path
            logos: {
                png: hasPng,
                svg: hasSvg,
            },
        };
    }

    return {
        address: evmAddress, // Store original case for file path
        registered: evmAssetStatus.isRegistered,
        bridged: evmAssetStatus.isBridged,
        logos: {
            png: hasPng,
            svg: hasSvg,
        },
        cadence: evmAssetStatus.bridgedAddress
            ? {
                  address: evmAssetStatus.bridgedAddress,
                  contractName: evmAssetStatus.bridgedContractName || "",
              }
            : undefined,
        onchainLogoUri: evmAssetStatus.display?.logos?.items[0]?.file?.url,
    };
}

async function main() {
    const network = process.env.NETWORK as Network;
    if (!network || !networks.includes(network)) {
        console.error(
            `Please set NETWORK environment variable to either "${networks.join('" or "')}"`,
        );
        process.exit(1);
    }

    const outputFile = getShortlistedContractsPath(network);

    const tokens: TokenStatus[] = [];
    const ctx = await buildBlockchainContext();

    try {
        const dirs = await fs.readdir(LOGOS_DIR);

        for (const dir of dirs) {
            const dirPath = path.join(LOGOS_DIR, dir);
            const stat = await fs.stat(dirPath);

            if (stat.isDirectory()) {
                const isTestnetDir = dir.startsWith("testnet:");
                // Only process directories that match the current network
                if (
                    (network === "mainnet" && !isTestnetDir) ||
                    (network === "testnet" && isTestnetDir)
                ) {
                    const status = await checkDirectory(ctx, dirPath);
                    if (status) {
                        tokens.push(status);
                    }
                }
            }
        }

        // Write results to the appropriate file
        await fs.writeFile(outputFile, JSON.stringify(tokens, null, 2));

        console.log(`Token status check completed successfully for ${network}`);
        console.log(`Tokens found: ${tokens.length}`);
        process.exit(0);
    } catch (error) {
        console.error("Error checking token status:", error);
        process.exit(1);
    }
}

main().catch(console.error);
