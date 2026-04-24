#!/usr/bin/env bash
# Install pre-commit hooks for gitleaks + detect-secrets.
# Run once per clone. Re-runs are safe (idempotent).
set -euo pipefail

if ! command -v pre-commit >/dev/null 2>&1; then
  echo "ERROR: pre-commit not installed. Install via 'pipx install pre-commit' or 'pip install --user pre-commit'." >&2
  exit 1
fi

if ! command -v detect-secrets >/dev/null 2>&1; then
  echo "NOTE: detect-secrets not found on PATH. Pre-commit will fetch it into its hook env; nothing to do." >&2
fi

pre-commit install
pre-commit install --hook-type commit-msg

# Seed an empty baseline the first time so detect-secrets has something to diff against.
if [ ! -f .secrets.baseline ]; then
  echo "Generating initial .secrets.baseline …"
  if command -v detect-secrets >/dev/null 2>&1; then
    detect-secrets scan > .secrets.baseline
  else
    echo '{}' > .secrets.baseline
    echo "WARN: wrote empty baseline; run 'detect-secrets scan > .secrets.baseline' once installed." >&2
  fi
fi

echo "pre-commit hooks installed. Run 'pre-commit run --all-files' to verify."
