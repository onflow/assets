import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Get the directory name of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const networks = ["mainnet", "testnet"] as const;

export type Network = (typeof networks)[number];

export const networkName = process.env.NETWORK || "testnet";

export const endpoints: Record<Network, string> = {
    mainnet: "https://token-list.fixes.world/api",
    testnet: "https://testnet-token-list.fixes.world/api",
};

// File paths
export const ROOT_DIR = join(__dirname, "..", "..");
export const OUTPUTS_DIR = join(ROOT_DIR, "outputs");
export const LOGOS_DIR = join(ROOT_DIR, "logos");

export const getNetworkOutputPath = (network: Network) => join(OUTPUTS_DIR, network);
export const getShortlistedContractsPath = (network: Network) =>
    join(getNetworkOutputPath(network), "shortlisted-contracts.json");
export const getTokenListPath = (network: Network) =>
    join(getNetworkOutputPath(network), "token-list.json");

// URLs
export const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/onflow/assets/main";
export const getLogoBasePath = (address: string) => `tokens/logos/${address}`;
export const getLogoUrl = (address: string, format: "svg" | "png") =>
    `${GITHUB_RAW_BASE}/${getLogoBasePath(address)}/logo.${format}`;
