# Flow Assets Repository

This repository contains logo assets for the Flow blockchain ecosystem, including tokens, environments, and decentralized applications (dApps).

## Repository Structure

```
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
├── dapps/          # Decentralized application logos
│   └── <dapp-name>/
│       ├── svg/logo.svg
│       └── png/logo.png
└── tokens/         # Token logos
    ├── <token-address>/
    │   ├── svg/logo.svg
    │   └── png/logo.png
    └── verified.json
```

## File Naming Conventions

-   Use logo.svg and logo.png for all assets.
-   Do not use kebab-case or descriptive filenames — the folder name indicates the project.
-   Each project (token, environment, or dApp) gets its own folder.

## Image Requirements

### SVG Files

-   Keep SVG files clean and optimized
-   Remove any unnecessary metadata
-   Ensure the SVG is properly viewboxed

### PNG Files

-   Resolution: 256x256 pixels recommended (minimum 128x128)
-   Format: 32-bit PNG (with transparency)
-   Background: Transparent

## Adding New Assets

1. Identify the correct category (`tokens`, `environments`, or `dapps`)
2. Create a folder using the project name (all lowercase, no special characters or spaces)
3. Place the optimized `logo.svg` and/or `logo.png` in `svg/` and `png/` subfolders
4. Ensure your images meet the requirements above
5. Submit a pull request with your additions

## License

Please ensure you have the rights to submit any logos before adding them to this repository.

## Contact

For questions or assistance, please open an issue in this repository.
