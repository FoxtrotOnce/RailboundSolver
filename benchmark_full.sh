#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
export PATH="/c/msys64/ucrt64/bin:${PATH:-}"
BUILD="cpp/build"
EXE="cpp/build/railbound_solver.exe"

cmake --build "$BUILD" --config Release --parallel >/dev/null

# Default 60s per level, overridable: ./benchmark_full.sh 30
TIMEOUT="${1:-60}"
echo "Running FULL levels with ${TIMEOUT}s timeout per level..."
echo "EXE: $EXE"
echo "Levels: $(python -c "import json; print(len(json.load(open('levels.json'))))") total"
echo ""

"$EXE" --file levels.json --all --timeout "$TIMEOUT"
