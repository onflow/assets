# Flow Assets Repository

This repository contains logo assets for the Flow blockchain ecosystem, including tokens, environments, and decentralized applications (dApps).

## How to add a new token?

Refer to [Token Assets Guide](tokens/README.md) for detailed instructions on adding a new token.

## Repository Structure

```text
assets/
├── environments/   # Flow environment logos
│   ├── flow/
│   │   ├── svg/logo.svg
│   │   └── png/logo.png
│   ├── cadence/
│   │   ├── svg/logo.svg
│   │   └── png/logo.png
│   └── evm/
│       ├── svg/logo.svg
│       └── png/logo.png
├── dapps/         # Decentralized application logos
│   └── <dapp-name>/
│       ├── svg/logo.svg
│       └── png/logo.png
└── tokens/
    ├── registry/               # Token registry, to be used and registered in the Flow TokenList
    │   └── <contract-address>/ # For testnet token use `testnet:<contract-address>`
    │       ├── logo.svg
    │       └── logo.png
    │       └── mods.json
    ├── outputs/                # Generated token list
    │   └── <network>/
    │       └── token-list.json
    └── src/                    # Source code of scripts
```

## File Naming Conventions

- Use logo.svg and logo.png for all assets.
- Do not use kebab-case or descriptive filenames — the folder name indicates the project.
- Each project (token, environment, or dApp) gets its own folder.

## Image Requirements

### SVG Files

- Keep SVG files clean and optimized
- Remove any unnecessary metadata
- Ensure the SVG is properly viewboxed

### PNG Files

- Resolution: 256x256 pixels recommended (minimum 128x128)
- Format: 32-bit PNG (with transparency)
- Background: Transparent

## License

Please ensure you have the rights to submit any logos before adding them to this repository.

## Contact

For questions or assistance, please open an issue in this repository.
