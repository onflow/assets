import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildBlockchainContext, getEVMAssets } from "../utils";
import type { FlowBlockchainContext, ValidationResult } from "../utils/types";

const ALLOWED_FILES = [".gitkeep", "logo.png", "logo.svg", "mods.json"];

function isValidFolderName(folderName: string): boolean {
    // Check if it's a valid EVM address or testnet:address format
    const evmAddressRegex = /^(?:testnet:)?0x[a-fA-F0-9]{40}$/;
    return evmAddressRegex.test(folderName);
}

function validateFolderContents(folderPath: string): string[] {
    const errors: string[] = [];
    const files = readdirSync(folderPath);

    // Check for disallowed files
    // ignore .DS_Store
    const disallowedFiles = files.filter(
        (file) => !ALLOWED_FILES.includes(file) && file !== ".DS_Store",
    );
    if (disallowedFiles.length > 0) {
        errors.push(`Contains disallowed files: ${disallowedFiles.join(", ")}`);
    }

    // Check for logo files
    const hasLogo = files.some((file) => file === "logo.png" || file === "logo.svg");
    if (!hasLogo) {
        errors.push("Missing logo file (logo.png or logo.svg)");
    }

    return errors;
}

async function validateEVMAsset(
    ctx: FlowBlockchainContext,
    address: string,
): Promise<{ isValid: boolean; isBridged?: boolean }> {
    try {
        const result = await getEVMAssets(ctx.connector, address);
        if (result === null) {
            return { isValid: false };
        }
        return { isValid: true, isBridged: result.isBridged };
    } catch (error) {
        console.error(`Error validating EVM asset ${address}:`, error);
        return { isValid: false };
    }
}

export async function validateRegistryChanges(
    changedFolders: string[],
    registryPath: string,
): Promise<ValidationResult[]> {
    const ctx = await buildBlockchainContext();
    const results: ValidationResult[] = [];

    for (const folder of changedFolders) {
        const folderPath = join(registryPath, folder);
        const result: ValidationResult = {
            folder,
            isValid: true,
            errors: [],
            isTestnet: folder.startsWith("testnet:"),
        };

        // Check folder name format
        if (!isValidFolderName(folder)) {
            result.isValid = false;
            result.errors.push("Invalid folder name format");
            results.push(result);
            continue;
        }

        // Check folder contents
        if (!existsSync(folderPath)) {
            result.isValid = false;
            result.errors.push("Folder does not exist");
            results.push(result);
            continue;
        }

        const contentErrors = validateFolderContents(folderPath);
        if (contentErrors.length > 0) {
            result.isValid = false;
            result.errors.push(...contentErrors);
            results.push(result);
            continue;
        }

        // Validate EVM asset
        const address = folder.startsWith("testnet:") ? folder.split(":")[1] : folder;
        if (!address) {
            result.isValid = false;
            result.errors.push("Invalid address format");
            results.push(result);
            continue;
        }

        const { isValid, isBridged } = await validateEVMAsset(ctx, address);
        if (!isValid) {
            result.isValid = false;
            result.errors.push("Invalid or non-existent EVM asset");
        } else {
            result.isBridged = isBridged;
        }

        results.push(result);
    }

    return results;
}

export function generateComment(results: ValidationResult[]): string {
    const validFolders = results.filter((r) => r.isValid);
    const invalidFolders = results.filter((r) => !r.isValid);

    let comment = "## Registry Changes Validation Report\n\n";

    if (validFolders.length > 0) {
        comment += "### ✅ Valid Changes\n\n";
        for (const result of validFolders) {
            comment += `- ${result.folder}\n`;
            if (!result.isTestnet && result.isBridged === false) {
                comment += `  - ⚠️ This token needs to be bridged. Please send 1 FLOW to ${process.env.MAINNET_FLOW_ADDRESS} and provide the transaction hash.\n`;
            }
        }
        comment += "\n";
    }

    if (invalidFolders.length > 0) {
        comment += "### ❌ Invalid Changes\n\n";
        for (const result of invalidFolders) {
            comment += `- ${result.folder}\n`;
            for (const error of result.errors) {
                comment += `  - ${error}\n`;
            }
        }
    }

    return comment;
} 