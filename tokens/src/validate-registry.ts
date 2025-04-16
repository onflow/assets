import { writeFileSync } from "node:fs";
import { join } from "node:path";
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

  // Save valid results as artifacts
  const validResults = results.filter((r) => r.isValid);
  if (validResults.length > 0) {
    const artifactsDir = process.env.GITHUB_WORKSPACE || ".";
    const artifactsPath = join(artifactsDir, "validated-folders.json");
    writeFileSync(artifactsPath, JSON.stringify(validResults, null, 2));
  }

  // Output the comment for GitHub comment
  console.log(comment);

  // Exit with error if any validation failed
  const hasErrors = results.some((r) => !r.isValid);
  process.exit(hasErrors ? 1 : 0);
}

main().catch((error) => {
  console.error("Error during validation:", error);
  process.exit(1);
}); 