#!/bin/bash
# Fetch or update micropython-steami-lib for code examples
# Used by prebuild script to provide source files for remark-code-import

set -e

REPO_URL="https://github.com/steamicc/micropython-steami-lib.git"
TARGET_DIR=".external/micropython-steami-lib"

if [ -d "$TARGET_DIR/.git" ]; then
  echo "Updating micropython-steami-lib..."
  git -C "$TARGET_DIR" pull --quiet
else
  echo "Cloning micropython-steami-lib..."
  mkdir -p "$(dirname "$TARGET_DIR")"
  git clone --depth 1 --quiet "$REPO_URL" "$TARGET_DIR"
fi

echo "micropython-steami-lib ready at $TARGET_DIR"
