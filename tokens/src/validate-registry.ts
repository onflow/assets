import { generateComment, validateRegistryChanges } from "./validation/validate-registry-changes";

async function main() {
    const folders = process.argv.slice(2);
    if (folders.length === 0) {
        console.error("No folders provided for validation");
        process.exit(1);
    }

    const registryPath = "tokens/registry";
    const results = await validateRegistryChanges(folders, registryPath);
    const comment = generateComment(results);
    console.log(comment);

    process.exit(0);
}

main().catch((error) => {
    console.error("Error during validation:", error);
    process.exit(1);
}); 