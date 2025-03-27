# Contributing to Flow Assets Repository

Thank you for your interest in contributing to the Flow Assets Repository! This guide will help you understand how to properly add new assets to our collection.

## General Guidelines

1. **File Quality**: Ensure all files are high quality and properly optimized
2. **Ownership**: Only submit logos for which you have permission or rights
3. **Accuracy**: Logos should accurately represent the token, environment, or dApp
4. **Formats**: Provide both SVG and PNG formats when possible

## Adding New Assets

### Step 1: Fork and Clone

1. Fork this repository
2. Clone your fork to your local machine
3. Create a new branch for your additions

### Step 2: Prepare Your Files

#### For Tokens:

-   Place SVG files in `/assets/tokens/svg/`
-   Place PNG files in `/assets/tokens/png/`
-   Use lowercase token symbol for filenames (e.g., `flow.svg`, `usdc.png`)

#### For Environments:

-   Identify the correct environment category (flow, cadence, evm)
-   Place SVG files in the appropriate `/assets/environments/<category>/svg/` directory
-   Place PNG files in the appropriate `/assets/environments/<category>/png/` directory
-   Use descriptive names (e.g., `flow-logo.svg`, `cadence-icon.png`)

#### For dApps:

-   Place SVG files in `/assets/dapps/svg/`
-   Place PNG files in `/assets/dapps/png/`
-   Use kebab-case for filenames (e.g., `my-dapp-name.svg`)
-   Include a text file with dApp information (see dApps README)

### Step 3: Submit Your Contribution

1. Commit your changes
2. Push to your fork
3. Open a pull request
4. In your pull request description, include:
    - What you're adding
    - Source of the logos
    - Confirmation that you have permission to submit these assets

## Image Requirements

### SVG Requirements

-   Clean, optimized SVG code
-   No unnecessary metadata
-   Properly viewboxed
-   No embedded raster images

### PNG Requirements

-   256x256 pixels recommended (minimum 128x128)
-   32-bit PNG with transparency
-   Clean transparent background
-   No compression artifacts

## Need Help?

If you have any questions about contributing, please open an issue in the repository, and we'll be happy to assist you.
