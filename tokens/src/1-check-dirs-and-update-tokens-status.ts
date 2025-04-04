import { promises as fs } from "node:fs";
import path from "node:path";

import { buildBlockchainContext } from "./utils";
import { getEVMAssets } from "./utils/actions";
import { type Network, SHORTLIST_DIR, getShortlistedContractsPath, networks } from "./utils/config";
import type { FlowBlockchainContext, TokenStatus } from "./utils/types";
import { customizableFields } from "./utils/types";

const EVM_ADDRESS_REGEX = /^(?:testnet:)?0x[a-fA-F0-9]{40}$/;

async function checkDirectory(
    ctx: FlowBlockchainContext,
    dirPath: string,
): Promise<TokenStatus | null> {
    const dirName = path.basename(dirPath);

    if (!EVM_ADDRESS_REGEX.test(dirName)) {
      // Check if directory name matches EVM address pattern
      console.log(`❌ Skipping ${dirName} - invalid EVM address format`);
      return null;
    }

    // Check for logo files
    const files = await fs.readdir(dirPath);
    const hasPng = files.includes("logo.png");
    const hasSvg = files.includes("logo.svg");

    // Check for mods.json and validate its fields
    let hasValidMods = false;
    if (files.includes("mods.json")) {
      try {
        const modsContent = await fs.readFile(path.join(dirPath, "mods.json"), "utf-8");
        const mods = JSON.parse(modsContent);

        // Check if at least one required field is present and valid
        hasValidMods = customizableFields.some(
          (field) => typeof mods[field] === "string" && mods[field].trim() !== "",
        );
      } catch (error) {
        console.error(`Error reading/parsing mods.json in ${dirPath}:`, error);
      }
    }

    // Extract EVM address (remove testnet: prefix if exists) but keep original case
    const evmAddress = dirName.startsWith("testnet:") ? dirName.slice(8) : dirName;

    // Query chain status with lowercase address
    const evmAssetStatus = await getEVMAssets(ctx.wallet, evmAddress.toLowerCase());

    if (!evmAssetStatus) {
      console.log(`⚠️ ${evmAddress} - No chain status found`);
      return {
        address: evmAddress,
        logos: {
          png: hasPng,
          svg: hasSvg,
        },
        mods: hasValidMods,
      };
    }

    const status = {
      address: evmAddress,
      registered: evmAssetStatus.isRegistered,
      bridged: evmAssetStatus.isBridged,
      logos: {
        png: hasPng,
        svg: hasSvg,
      },
      mods: hasValidMods,
      cadence: evmAssetStatus.bridgedAddress
        ? {
            address: evmAssetStatus.bridgedAddress,
            contractName: evmAssetStatus.bridgedContractName || "",
          }
        : undefined,
      onchainLogoUri: evmAssetStatus.display?.logos?.items[0]?.file?.url,
    };

    const logoStatus = `${hasPng ? "🖼️" : "❌"}${hasSvg ? "📐" : "❌"}`;
    const modsStatus = hasValidMods ? "📝" : "❌";
    console.log(
      `✅ ${evmAddress} - Registered:${status.registered} Bridged:${status.bridged} ${logoStatus} ${modsStatus}`,
    );

    return status;
}

async function main() {
    const network = process.env.NETWORK as Network;
    if (!network || !networks.includes(network)) {
        console.error(
            `Please set NETWORK environment variable to either "${networks.join('" or "')}"`,
        );
        process.exit(1);
    }

    console.log(`\n🔍 Starting token status check for ${network.toUpperCase()}`);
    console.log(`📁 Output: ${getShortlistedContractsPath(network)}\n`);

    const tokens: TokenStatus[] = [];
    const ctx = await buildBlockchainContext();

    try {
        const dirs = await fs.readdir(SHORTLIST_DIR);
        console.log(`📂 Found ${dirs.length} directories to process\n`);

        for (const dir of dirs) {
          const dirPath = path.join(SHORTLIST_DIR, dir);
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
            } else {
              console.log(`⏩ Skipping ${dir} - network mismatch`);
            }
          }
        }

        // Write results to the appropriate file
        console.log(`\n💾 Writing ${tokens.length} token statuses to output file`);
        await fs.writeFile(getShortlistedContractsPath(network), JSON.stringify(tokens, null, 2));

        console.log("\n✨ Token status check completed successfully");
        console.log(`📊 Total tokens processed: ${tokens.length}\n`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error checking token status:", error);
        process.exit(1);
    }
}

main().catch(console.error);
