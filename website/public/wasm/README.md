# WASM artifacts

This directory will contain the compiled C++ solver after building with Emscripten.

Expected files after build:
- `railbound.js` — Emscripten glue code (MODULARIZE=1, EXPORT_NAME=createRailboundModule)
- `railbound.wasm` — WebAssembly binary

## Build

From repo root:

```bash
# Linux/macOS / Git Bash
./cpp/wasm/build_wasm.sh

# Windows PowerShell
.\cpp\wasm\build_wasm.ps1

# Or via npm
npm run build:wasm        # in website/
npm run build:wasm:debug  # debug build
```

Then `npm run dev --prefix website` will automatically serve `/wasm/railbound.*`.

## Mock / fallback

If `railbound.wasm` is not present, the website will:
1. Detect absence via `HEAD /wasm/railbound.wasm`
2. Disable the WASM solver option in the UI and show a tooltip "WASM has not been built — run ./cpp/wasm/build_wasm.sh"
3. Fall back to the TypeScript solver automatically if WASM is selected but unavailable.

No manual deletion is needed. The placeholder files below (`railbound.js` stub) exist only to prevent 404 noise in dev; they will be overwritten by the real build.
