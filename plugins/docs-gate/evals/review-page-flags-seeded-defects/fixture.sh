#!/bin/bash
# Copies this case's checked-in fixture into the run's empty sandbox
# workspace, at the path prompt.md tells Claude to review. Runs as the
# eval author (see case.yaml's context.scaffold_script), not inside the
# agent's sandbox, before Claude starts.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p resources
cp "$SCRIPT_DIR/resources/defective-how-to.md" resources/defective-how-to.md
