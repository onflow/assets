import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Get the directory name of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const networks = ["mainnet", "testnet"] as const;

export type Network = (typeof networks)[number];

export const networkName: Network = (process.env.NETWORK as Network) || "testnet";

export const endpoints: Record<Network, string> = {
    mainnet: "https://token-list.fixes.world/api",
    testnet: "https://testnet-token-list.fixes.world/api",
};

// File paths
export const ROOT_DIR = join(__dirname, "..", "..");
export const OUTPUTS_DIR = join(ROOT_DIR, "outputs");
export const REGISTRY_DIR = join(ROOT_DIR, "registry");

export const getNetworkOutputPath = (network: Network) => join(OUTPUTS_DIR, network);
export const getShortlistedContractsPath = (network: Network) =>
    join(getNetworkOutputPath(network), "shortlisted-contracts.json");
export const getTokenListPath = (network: Network) =>
    join(getNetworkOutputPath(network), "token-list.json");
export const getModsPath = (network: Network, address: string) =>
    join(ROOT_DIR, getLogoBasePath(getFolderName(network, address)), "mods.json");

// URLs
export const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/onflow/assets/main";
export const getLogoBasePath = (address: string) => `tokens/registry/${address}`;
export const getLogoUrl = (network: Network, address: string, format: "svg" | "png") =>
    `${GITHUB_RAW_BASE}/${getLogoBasePath(getFolderName(network, address))}/logo.${format}`;

export const getFolderName = (network: Network, address: string) =>
    network === "testnet" ? `testnet:${address}` : address;
