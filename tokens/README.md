# Token Assets

This directory contains logo assets and metadata modifications for tokens on the Flow blockchain.

## Directory Structure

Each token should have its own folder, with logo files placed in format-specific subfolders:

```text
- registry/{contractIdentifier}/logo.png
- registry/{contractIdentifier}/logo.svg
- registry/{contractIdentifier}/mods.json
```

- `logo.svg` - SVG format token logo, optimized and viewboxed
- `logo.png` - PNG format token logo (256x256px recommended)
- `mods.json` - Metadata modifications for the token

For contract identifiers, use the token contract address or a unique identifier for testnet tokens.

- Mainnet tokens should use the contract address as the folder name: `registry/{contractAddress}/`
- Testnet tokens should use the `testnet:` prefix: `registry/testnet:{contractAddress}/`

## Adding a New Token

1. Prepare both SVG and PNG versions of the token logo if possible
2. The PNG should be 256x256 pixels with a transparent background
3. Name files according to the convention above
4. Place the files in their respective format subfolders
5. Ensure you have the rights to the logo before submitting
