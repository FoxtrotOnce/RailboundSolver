# Building WASM without local Emscripten

If `wasm/build.sh --setup-emsdk` fails on your machine (Windows, no python, etc.), you **don't need to build locally** — the website works with the JS fallback. WASM is optional (5-10× faster).

### Option 1: Just use JS (no build)

```bash
cd website && npm install && npm run dev
# Toggle in GridButtons shows "WASM not built — JS only"
# Solve still works, just slower.
# vite build already passes thanks to website/src/wasm/railbound_wasm.js placeholder
```

### Option 2: Docker (no local emsdk)

```bash
docker run --rm -v %cd%:/src -w /src emscripten/emsdk:3.1.72 \
  bash -c "emcmake cmake -S wasm -B wasm/build/wasm -DWASM_BUILD=ON -DCMAKE_BUILD_TYPE=Release && cmake --build wasm/build/wasm -j && mkdir -p website/public/wasm website/src/wasm && cp wasm/build/wasm/railbound_wasm.js website/src/wasm/ && cp wasm/build/wasm/railbound_wasm.wasm website/public/wasm/ && ls -lh website/public/wasm/"

# Windows PowerShell:
# docker run --rm -v ${PWD}:/src -w /src emscripten/emsdk:3.1.72 bash -c "emcmake cmake -S wasm -B wasm/build/wasm -DWASM_BUILD=ON -DCMAKE_BUILD_TYPE=Release && cmake --build wasm/build/wasm -j && mkdir -p website/public/wasm && cp wasm/build/wasm/railbound_wasm.* website/public/wasm/ && cp wasm/build/wasm/railbound_wasm.js website/src/wasm/"
```

### Option 3: GitHub Actions (recommended for this machine)

Push to `feature/wasm-cpp-solver` already triggers `.github/workflows/wasm.yml`:

1. Go to https://github.com/FoxtrotOnce/RailboundSolver/actions
2. Open the latest **Build WASM** run → download **railbound-wasm** artifact (contains `railbound_wasm.js` + `railbound_wasm.wasm`)
3. Unzip to repo root:
   ```
   unzip railbound-wasm.zip
   cp railbound_wasm.js website/src/wasm/
   cp railbound_wasm.wasm website/public/wasm/
   ```
4. `cd website && npm run build` now shows `Solver: WASM ⚡` in GridButtons.

Or use `gh` CLI:

```bash
gh run list --branch feature/wasm-cpp-solver --limit 1
gh run download <run-id> -n railbound-wasm -D ./tmp-wasm
cp ./tmp-wasm/website/src/wasm/railbound_wasm.js website/src/wasm/
cp ./tmp-wasm/website/public/wasm/railbound_wasm.wasm website/public/wasm/
```

### Why the local build fails?

`emcc` needs `emsdk` (Python + Node). On Windows `wasm/build.sh --setup-emsdk` does:
```
git clone https://github.com/emscripten-core/emsdk.git wasm/emsdk
wasm/emsdk/emsdk install latest
wasm/emsdk/emsdk activate latest
source wasm/emsdk/emsdk_env.sh
```
If `python` is missing or path has spaces, it fails. Use Docker or Actions instead — the JS fallback is fine for development.

