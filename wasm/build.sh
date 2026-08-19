#!/usr/bin/env bash
set -e

# RailboundSolver – WASM build helper
# Usage:
#   ./build.sh --setup-emsdk   # clones emsdk, installs latest
#   ./build.sh --native        # build native test
#   ./build.sh --wasm          # build wasm via emsdk (requires setup)
#   ./build.sh --all           # native + wasm
#   ./build.sh --clean

ROOT="$(cd "$(dirname "$0")" && pwd)"
EMSDK_DIR="$ROOT/emsdk"

setup_emsdk() {
  if [ -d "$EMSDK_DIR" ]; then
    echo "emsdk already at $EMSDK_DIR – updating"
    git -C "$EMSDK_DIR" pull || true
  else
    echo "Cloning emsdk to $EMSDK_DIR ..."
    git clone https://github.com/emscripten-core/emsdk.git "$EMSDK_DIR"
  fi
  "$EMSDK_DIR/emsdk" install latest
  "$EMSDK_DIR/emsdk" activate latest
  echo ""
  echo "emsdk installed. Activate with: source $EMSDK_DIR/emsdk_env.sh"
}

build_native() {
  echo "== Building native solver =="
  mkdir -p "$ROOT/build/native"
  cmake -S "$ROOT" -B "$ROOT/build/native" -DNATIVE_TEST=ON -DWASM_BUILD=OFF -DCMAKE_BUILD_TYPE=Release
  cmake --build "$ROOT/build/native" -j
  echo "Native binaries at $ROOT/build/native/"
  ls -lh "$ROOT/build/native/solver_test" "$ROOT/build/native/bench" 2>/dev/null || true
}

build_wasm() {
  if ! command -v emcc >/dev/null 2>&1; then
    if [ -f "$EMSDK_DIR/emsdk_env.sh" ]; then
      echo "Sourcing emsdk_env.sh ..."
      # shellcheck disable=SC1090
      source "$EMSDK_DIR/emsdk_env.sh"
    else
      echo "emcc not found and emsdk not set up."
      echo "Run: $0 --setup-emsdk"
      exit 1
    fi
  fi
  echo "emcc: $(which emcc) – $(emcc --version | head -1)"
  echo "== Building WASM =="
  mkdir -p "$ROOT/build/wasm"
  emcmake cmake -S "$ROOT" -B "$ROOT/build/wasm" -DWASM_BUILD=ON -DNATIVE_TEST=OFF -DCMAKE_BUILD_TYPE=Release
  cmake --build "$ROOT/build/wasm" -j
  echo "Copying to website/..."
  mkdir -p "$ROOT/../website/public/wasm" "$ROOT/../website/src/wasm"
  cp "$ROOT/build/wasm/railbound_wasm.js" "$ROOT/../website/src/wasm/railbound_wasm.js" 2>/dev/null || cp "$ROOT/build/wasm/railbound_wasm.js" "$ROOT/../website/src/wasm/"
  cp "$ROOT/build/wasm/railbound_wasm.wasm" "$ROOT/../website/public/wasm/railbound_wasm.wasm" 2>/dev/null || cp "$ROOT/build/wasm/"*.wasm "$ROOT/../website/public/wasm/" 2>/dev/null || true
  ls -lh "$ROOT/build/wasm/"*.js "$ROOT/build/wasm/"*.wasm 2>/dev/null || true
  echo "WASM built -> website/public/wasm/ and website/src/wasm/"
}

case "${1:---help}" in
  --setup-emsdk) setup_emsdk ;;
  --native)      build_native ;;
  --wasm)        build_wasm ;;
  --all)         build_native; build_wasm ;;
  --clean)       rm -rf "$ROOT/build"; echo "cleaned" ;;
  --help|-h|*)   echo "Usage: $0 [--setup-emsdk|--native|--wasm|--all|--clean]";;
esac
