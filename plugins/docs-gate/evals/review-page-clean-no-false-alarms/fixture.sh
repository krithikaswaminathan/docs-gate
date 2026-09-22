#!/bin/bash
# See review-page-flags-seeded-defects/fixture.sh for what this does and why.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p resources
cp "$SCRIPT_DIR/resources/clean-tutorial.md" resources/clean-tutorial.md
