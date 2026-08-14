#!/usr/bin/env bash
# Keeps every agent rules file identical to CLAUDE.md.
set -e
for f in AGENTS.md .cursorrules .windsurfrules .github/copilot-instructions.md; do
  mkdir -p "$(dirname "$f")"
  cp CLAUDE.md "$f"
  sed -i '1s/.*/# WAWUAfrica Web — agent rules/' "$f"
done
echo "Synced agent rules to: AGENTS.md .cursorrules .windsurfrules .github/copilot-instructions.md"
