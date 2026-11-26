#!/bin/bash
# Fetch micropython-steami-lib at the tag pinned in micropython.json, for code examples
# Used by prebuild script to provide source files for remark-code-file plugin

set -e

REPO_URL="https://github.com/steamicc/micropython-steami-lib.git"
TARGET_DIR=".external/micropython-steami-lib"
TAG=$(node -p "require('./micropython.json').version")

if [ -d "$TARGET_DIR/.git" ]; then
  if [ "$(git -C "$TARGET_DIR" describe --tags --exact-match 2>/dev/null || true)" = "$TAG" ]; then
    echo "micropython-steami-lib already at $TAG"
  else
    echo "Moving micropython-steami-lib to $TAG..."
    git -C "$TARGET_DIR" fetch --depth 1 --quiet origin "refs/tags/$TAG:refs/tags/$TAG"
    git -C "$TARGET_DIR" -c advice.detachedHead=false checkout --quiet "$TAG"
  fi
else
  echo "Cloning micropython-steami-lib $TAG..."
  mkdir -p "$(dirname "$TARGET_DIR")"
  git clone --depth 1 --quiet --branch "$TAG" "$REPO_URL" "$TARGET_DIR"
fi

echo "micropython-steami-lib ready at $TARGET_DIR ($TAG)"
