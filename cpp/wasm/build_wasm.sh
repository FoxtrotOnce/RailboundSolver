#!/usr/bin/env bash
set -euo pipefail

# Build WASM solver for website
# Requires emcc (Emscripten SDK) in PATH.
# Usage: ./cpp/wasm/build_wasm.sh [--debug]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CPP_DIR="$REPO_ROOT/cpp"
OUT_DIR="$REPO_ROOT/website/public/wasm"
MODE="Release"

if [[ "${1:-}" == "--debug" ]]; then
  OPT="-O0 -g"
  MODE="Debug"
else
  OPT="-O3"
fi

if ! command -v emcc &> /dev/null; then
  echo "Error: emcc not found. Install Emscripten SDK:"
  echo "  https://emscripten.org/docs/getting_started/downloads.html"
  echo "  git clone https://github.com/emscripten-core/emsdk.git"
  echo "  ./emsdk install latest && ./emsdk activate latest && source ./emsdk_env.sh"
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Building Railbound WASM ($MODE) -> $OUT_DIR/railbound.{js,wasm}"
echo "  Emscripten: $(emcc --version | head -n1)"

# Common sources
SOURCES=(
  "$CPP_DIR/src/types.cpp"
  "$CPP_DIR/src/level.cpp"
  "$CPP_DIR/src/solver.cpp"
  "$CPP_DIR/wasm/wasm_bindings.cpp"
)

INCLUDES=(
  "-I$CPP_DIR/include"
  "-I$CPP_DIR"
  "-I$CPP_DIR/third_party"
)

# Use em++ for C++ linking (or emcc with -sDEFAULT_TO_CXX)
EMXX="em++"
if ! command -v em++ &> /dev/null; then EMXX="emcc"; fi
$EMXX "${SOURCES[@]}" "${INCLUDES[@]}" \
  $OPT -std=c++20 --bind \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createRailboundModule" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=16777216 \
  -s STACK_SIZE=1048576 \
  -s EXPORTED_FUNCTIONS='["_solve_level_json","_free_string","_wasm_is_ready","_get_solver_version","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall","UTF8ToString","stringToUTF8","lengthBytesUTF8","getValue","setValue","UTF8ArrayToString"]' \
  -s ENVIRONMENT=web,worker \
  -s WASM_ASYNC_COMPILATION=1 \
  -s SINGLE_FILE=0 \
  -o "$OUT_DIR/railbound.js"

echo "Done. Outputs:"
ls -lh "$OUT_DIR/railbound.js" "$OUT_DIR/railbound.wasm"

# Also generate embind variant (optional) if requested
if [[ "${1:-}" == "--with-embind" || "${2:-}" == "--with-embind" ]]; then
  echo "Building embind variant..."
  $EMXX "${SOURCES[@]}" "${INCLUDES[@]}" \
    $OPT -std=c++20 --bind \
    -s WASM=1 \
    -s MODULARIZE=1 -s EXPORT_NAME="createRailboundModuleEmbind" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT=web,worker \
    -o "$OUT_DIR/railbound_embind.js"
  ls -lh "$OUT_DIR/railbound_embind.js" "$OUT_DIR/railbound_embind.wasm"
fi

echo ""
echo "To use in website dev server, ensure vite serves /wasm/railbound.{js,wasm} from public/wasm/"
echo "Then: npm run dev --prefix website"
