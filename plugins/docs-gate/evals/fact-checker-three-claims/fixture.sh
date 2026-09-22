#!/bin/bash
# See review-page-flags-seeded-defects/fixture.sh for what this does and why.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p resources/source
cp "$SCRIPT_DIR/resources/claims-page.md" resources/claims-page.md
cp "$SCRIPT_DIR/resources/source/api-reference.md" resources/source/api-reference.md
