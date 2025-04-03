import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import {
    type Network,
    endpoints,
    getShortlistedContractsPath,
    getTokenListPath,
    networks,
} from "./utils/config";
import type { TokenList, TokenStatus } from "./utils/types";

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
            console.log(`No shortlisted contracts found for ${network}`);
            return [];
        }
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
        console.error(`Failed to read shortlisted contracts for ${network}`, e);
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
        console.error(`Failed to query token list for ${network}`, e);
        return undefined;
    }
};

const writeJSONFile = async (data: TokenList, network: Network): Promise<void> => {
    if (data.tokens.length === 0) {
        console.log(`No tokens found for ${network} after filtering.`);
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
        console.log(`Failed to read ${filename}`, e);
    }

    if (originList && JSON.stringify(data.tokens) === JSON.stringify(originList.tokens)) {
        // check diff
        console.log(`No change for ${filename}`);
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
    console.log(`Wrote ${filename}`);
};

async function main() {
    for (const network of networks) {
        // Load shortlisted contracts
        const shortlistedContracts = loadShortlistedContracts(network);
        const shortlistedAddresses = new Set(
            shortlistedContracts.map((contract) => contract.address.toLowerCase()),
        );

        // Query token list
        const tokenList = await queryTokenList(network);
        if (!tokenList) {
            console.error(`Failed to query token list for ${network}`);
            continue;
        }

        // Filter tokens based on shortlisted addresses
        tokenList.tokens = tokenList.tokens.filter((token) =>
            shortlistedAddresses.has(token.address.toLowerCase()),
        );

        // Write filtered token list
        await writeJSONFile(tokenList, network);
    }
}

main().catch(console.error);
