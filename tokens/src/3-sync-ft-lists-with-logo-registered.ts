import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import {
    type Network,
    endpoints,
    getModsPath,
    getShortlistedContractsPath,
    getTokenListPath,
    networks,
} from "./utils/config";
import type { CustomizableTokenFields, TokenList, TokenStatus } from "./utils/types";
import { customizableFields } from "./utils/types";

const ensureDirectoryExists = (filePath: string) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const loadShortlistedContracts = (network: Network): TokenStatus[] => {
    try {
        const filePath = getShortlistedContractsPath(network);
        if (!fs.existsSync(filePath)) {
            console.log(`📂 No shortlisted contracts found for ${network}`);
            return [];
        }
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
        console.error(`❌ Failed to read shortlisted contracts for ${network}`, e);
        return [];
    }
};

const queryTokenList = async (network: Network): Promise<TokenList | undefined> => {
    const url = `${endpoints[network]}/token-list?evm=true`;
    try {
        const response = await fetch(url);
        const data = (await response.json()) as TokenList;
        if (data.tokens !== undefined) {
            return data;
        }
        return undefined;
    } catch (e) {
        console.error(`❌ Failed to query token list for ${network}`, e);
        return undefined;
    }
};

const loadModsFile = (network: Network, address: string): CustomizableTokenFields | undefined => {
    const modsPath = getModsPath(network, address);

    try {
        console.log(`📝 Loading mods for ${address} on ${network}`);
        if (!fs.existsSync(modsPath)) {
            return undefined;
        }

        const modsData = JSON.parse(fs.readFileSync(modsPath, "utf8"));

        // Ensure only customizable fields are included
        const filteredMods: CustomizableTokenFields = {} as CustomizableTokenFields;
        for (const field of customizableFields) {
            if (modsData[field] !== undefined) {
                filteredMods[field] = modsData[field];
            }
        }

        console.log(`✅ Mods applied to ${address}: ${JSON.stringify(filteredMods)}`);
        return filteredMods;
    } catch (e) {
        console.error(`❌ Failed to load mods file for ${address} on ${network}`, e);
        return undefined;
    }
};

const writeJSONFile = async (data: TokenList, network: Network): Promise<void> => {
    if (data.tokens.length === 0) {
        console.log(`📂 No tokens found for ${network} after filtering.`);
        return;
    }

    const filename = getTokenListPath(network);
    ensureDirectoryExists(filename);

    let originList: TokenList | undefined;
    try {
        if (fs.existsSync(filename)) {
            originList = JSON.parse(fs.readFileSync(filename, "utf8")) as TokenList;
        }
    } catch (e) {
        console.log(`❌ Failed to read ${filename}`, e);
    }

    if (originList && JSON.stringify(data.tokens) === JSON.stringify(originList.tokens)) {
        console.log(`📂 No changes for ${network}`);
        return;
    }

    // update version
    let newTokenAdded = true;
    let oldTokenDeleted = false;
    if (originList) {
        const origTokens = originList.tokens.map((token) => {
            return `${token.address}-${token.contractName}`;
        });
        const origTokensSet = new Set(origTokens);
        const newTokens = data.tokens.map((token) => {
            return `${token.address}-${token.contractName}`;
        });
        const newTokensSet = new Set(newTokens);
        newTokenAdded = newTokensSet.size > origTokensSet.size;
        oldTokenDeleted = origTokensSet.size > newTokensSet.size;
    }

    if (oldTokenDeleted) {
        data.version.major = (originList ?? data).version.major + 1;
        data.version.minor = 0;
        data.version.patch = 0;
    } else if (newTokenAdded) {
        data.version.minor = (originList ?? data).version.minor + 1;
        data.version.patch = 0;
    } else {
        data.version.patch = (originList ?? data).version.patch + 1;
    }

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(
        `💾 Wrote token list for ${network} (v${data.version.major}.${data.version.minor}.${data.version.patch})`,
    );
};

async function main() {
    console.log("\n🔍 Starting token list sync process\n");

    for (const network of networks) {
        console.log(`\n📝 Processing ${network.toUpperCase()}`);

        // Load shortlisted contracts
        const shortlistedContracts = loadShortlistedContracts(network);
        const shortlistedAddresses = new Set(
            shortlistedContracts.map((contract) => contract.address.toLowerCase()),
        );
        console.log(`📂 Found ${shortlistedContracts.length} shortlisted contracts`);

        // Query token list
        const tokenList = await queryTokenList(network);
        if (!tokenList) {
            console.error(`❌ Failed to query token list for ${network}`);
            continue;
        }

        // First filter tokens based on shortlisted addresses
        const filteredTokens = tokenList.tokens.filter((token) =>
            shortlistedAddresses.has(token.address.toLowerCase()),
        );
        console.log(`📊 Filtered to ${filteredTokens.length} tokens`);

        // Then apply mods to filtered tokens
        const tokensWithMods = filteredTokens.map((token) => {
            const address = token.address.toLowerCase();
            const contract = shortlistedContracts.find((c) => c.address.toLowerCase() === address);

            if (contract?.mods) {
                // Only the contract.address is the address with correct capitalization
                const mods = loadModsFile(network, contract.address);
                if (mods) {
                    return { ...token, ...mods };
                }
            }

            return token;
        });

        tokenList.tokens = tokensWithMods;

        // Write filtered token list
        await writeJSONFile(tokenList, network);
    }

    console.log("\n✨ Token list sync completed successfully");
    process.exit(0);
}

main().catch(console.error);
