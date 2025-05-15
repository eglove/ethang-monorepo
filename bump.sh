#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the absolute directory of the script
# Using readlink -f to get the canonicalized absolute pathname.
# This ensures scriptDir is always the full path, regardless of how the script is called.
scriptDir="$(cd "$(dirname "$0")" && pwd)"

# Construct the path to the eslint-config package directory
eslintConfigDirectory="$scriptDir/packages/eslint-config"

# Ensure corepack is set up.
# This command is the same in corepack-managed environments.
echo -e "${BLUE}📦 Ensuring corepack is set up...${NC}"
corepack install -g pnpm npm yarn
corepack up
pnpm i -g wrangler
pnpm up -g --latest

# Change to the eslint-config directory.
# Use '|| { ...; exit 1; }' to exit the script if the directory change fails.
echo -e "${BLUE}📁 Changing directory to ${YELLOW}$eslintConfigDirectory${NC}"
cd "$eslintConfigDirectory" || { echo -e "${RED}❌ Error: Could not change directory to $eslintConfigDirectory${NC}"; exit 1; }

echo -e "${BLUE}✨ Updating dependencies in eslint-config...${NC}"
pnpm up -i --latest

echo -e "${BLUE}🏗️ Building eslint-config...${NC}"
pnpm build

# Define update type options as a Bash array.
updateTypeOptions=("patch" "minor" "major" "none")
updateType=null

# Interactive selection for the Semver update type.
while [ "$updateType" == "null" ]; do
    echo -e "${BLUE}❓ Choose Semver update type:${NC}"
    # Iterate through the array with index and value.
    for i in "${!updateTypeOptions[@]}"; do
        # Print options starting from 1.
        echo -e "$((i+1)). ${updateTypeOptions[$i]}"
    done
    read -p "Enter number (1-${#updateTypeOptions[@]}): " selection

    # Validate the input.
    if [[ "$selection" =~ ^[1-${#updateTypeOptions[@]}]$ ]]; then
        # Assign the selected value from the array.
        updateType="${updateTypeOptions[$((selection-1))]}"
    else
        echo -e "${RED}⚠️ Invalid selection. Please try again.${NC}"
    fi
done

# Perform update, build, and publish if updateType is not 'none'.
if [ "$updateType" != "none" ]; then
    # Get current version from npm registry using curl and jq.
    # jq is required to parse the JSON response. Make sure it's installed.
    echo -e "${BLUE}🔍 Fetching current version from npm registry...${NC}"
    currentVersion=$(curl -s "https://registry.npmjs.org/@ethang/eslint-config" | jq -r '."dist-tags".latest')

    # Check if fetching the version was successful.
    if [ -z "$currentVersion" ] || [ "$currentVersion" == "null" ]; then
        echo -e "${RED}❌ Error: Could not fetch current version from npm registry. Please ensure jq is installed.${NC}"
        exit 1
    fi
    echo -e "${BLUE}Current version: ${YELLOW}$currentVersion${NC}"


    echo -e "${BLUE}⬆️ Updating version to ${YELLOW}$updateType${NC}"
    pnpm version "$updateType"

    echo -e "${BLUE}🏗️ Building package...${NC}"
    pnpm build

    # Change to the dist directory for publishing.
    echo -e "${BLUE}📁 Changing directory to ${YELLOW}$eslintConfigDirectory/dist${NC}"
    cd "$eslintConfigDirectory/dist" || { echo -e "${RED}❌ Error: Could not change directory to $eslintConfigDirectory/dist${NC}"; exit 1; }

    echo -e "${BLUE}📤 Publishing package...${NC}"
    pnpm publish --no-git-checks

    # Wait for registry to update.
    registryUpdated=false
    attempts=1
    echo -e "${BLUE}⏳ Waiting for registry to update...${NC}"
    while [ "$registryUpdated" == "false" ]; do
        echo -e "${BLUE}Attempt ${YELLOW}$attempts${NC}..."
        attempts=$((attempts+1))

        # Fetch the latest version again.
        latestVersion=$(curl -s "https://registry.npmjs.org/@ethang/eslint-config" | jq -r '."dist-tags".latest')

        # Check if the latest version is different from the original current version.
        if [ "$latestVersion" != "$currentVersion" ] && [ "$latestVersion" != "null" ] && [ -n "$latestVersion" ]; then
            registryUpdated=true
            echo -e "${GREEN}✅ Registry updated! New version: ${YELLOW}$latestVersion${NC}"
        else
            echo -e "${YELLOW}Registry not updated yet. Waiting 5 seconds...${NC}"
            sleep 5
        fi
    done
fi

# Return to root directory and run final commands.
echo -e "${BLUE}🔙 Returning to root directory: ${YELLOW}$scriptDir${NC} for final commands...${NC}"
cd "$scriptDir" || { echo -e "${RED}❌ Error: Could not change directory to $scriptDir${NC}"; exit 1; }

# Add a check to print the current directory
echo -e "${BLUE}Current directory after returning: $(pwd)${NC}"

# Get apps, packages, and templates directories.
# Using find to list directories and tr to join them into a space-separated string.
apps=$(find "$scriptDir/apps" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | tr '\n' ' ')
packages=$(find "$scriptDir/packages" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | tr '\n' ' ')
templates=$(find "$scriptDir/templates" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | tr '\n' ' ')

# Function to update wrangler types.
# Takes prefix and a list of directories as arguments.
update_wrangler_types() {
    local prefix="$1"
    # Shift the first argument ($prefix) and assign the rest to the directories array.
    shift
    local -a directories=("$@")

    for directory in "${directories[@]}"; do
        local dirPath="$scriptDir/$prefix/$directory"
        # Check if the directory exists.
        if [ -d "$dirPath" ]; then
            echo -e "${BLUE}⚙️ Processing ${YELLOW}$dirPath${NC}..."
            # Store the current directory to return later.
            current_dir=$(pwd)
            # Change to the target directory.
            cd "$dirPath" || { echo -e "${RED}❌ Error: Could not change directory to $dirPath${NC}"; continue; }

            # Check if wrangler.jsonc exists in the current directory.
            if [ -f "wrangler.jsonc" ]; then
                echo -e "${BLUE}📅 Updating wrangler.jsonc in ${YELLOW}$directory${NC}..."
                # Update the compatibility_date using jq.
                # This requires jq to be installed.
                # Read the JSON, update the key, and write it back.
                # shellcheck disable=SC2046
                jq '."compatibility_date" = "'$(date +%Y-%m-%d)'"' wrangler.jsonc > wrangler.jsonc.tmp && mv wrangler.jsonc.tmp wrangler.jsonc

                # Ensure prettier is installed or available via pnpm dlx.
                echo -e "${BLUE}💅 Formatting wrangler.jsonc with prettier...${NC}"
                pnpm dlx prettier --write --trailing-comma none wrangler.jsonc
            fi
            # Return to the directory where the function was called from.
            cd "$current_dir" || { echo -e "${RED}❌ Error: Could not return to $current_dir${NC}"; exit 1; }
        fi
    done
}

# Update wrangler types in apps, packages, and templates directories.
echo -e "${BLUE}☁️ Updating wrangler types...${NC}"
# Pass the prefix and the space-separated directory names (which Bash expands into separate arguments for the array).
update_wrangler_types "apps" $apps
update_wrangler_types "packages" $packages
update_wrangler_types "templates" $templates

# Return to root directory and run final commands.
echo -e "${BLUE}🔙 Returning to root directory: ${YELLOW}$scriptDir${NC} for final commands...${NC}"
cd "$scriptDir" || { echo -e "${RED}❌ Error: Could not change directory to $scriptDir${NC}"; exit 1; }

echo -e "${BLUE}☁️ Updating CloudFlare types...${NC}"
pnpm -r cf-typegen
echo -e "${BLUE}🏗️ Building monorepo...${NC}"
pnpm build
echo -e "${BLUE}🧪 Running tests...${NC}"
pnpm test
echo -e "${BLUE}🧹 Running linter...${NC}"
pnpm lint
echo -e "${BLUE}🌳 Pruning dependencies...${NC}"
pnpm dedupe
pnpm store prune

echo -e "${GREEN}🎉 Bump process completed successfully!${NC}"
