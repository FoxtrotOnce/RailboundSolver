# WebAssembly solver — Integration guide

The website currently supports **two solvers** that can be selected from the sidebar:

| Solver | Badge | Description | Advantages |
|---|---|---|---|
| **TypeScript Solver** | `TS` | The original algorithm ported from JS, running in a `Worker` (`algo/main.ts`) | Easy to debug, step-by-step visualization, pause/step support |
| **C++ Solver (WASM)** | `WASM` | C++ solver compiled to WebAssembly with Emscripten | **20–30×** faster, uses a flat heap and lookup tables, optimized for large levels |

Users select a solver before pressing **Solve**. Running status, iterations, and elapsed time are stored separately for each solver so they can be compared.

## Architecture

```
cpp/
  include/railbound/*.hpp      # types, level, solver
  src/*.cpp                    # solver engine
  wasm/
    wasm_bindings.cpp          # C API + Embind wrapper (JSON in/out)
    build_wasm.sh / .ps1       # build scripts
    README.md
website/
  public/wasm/
    railbound.js               # Emscripten glue (MODULARIZE=1, EXPORT_NAME=createRailboundModule)
    railbound.wasm             # WASM binary (created after building)
  src/
    solver/
      types.ts                 # SolverId, SolverAdapter interface, SOLVERS metadata, levelDataToJson
      tsSolver.ts              # TS Worker adapter
      wasmSolver.ts            # WASM adapter (main thread + Worker)
      wasmLoader.ts            # Emscripten Module loading/caching
      registry.ts              # solverRegistry singleton
    workers/
      wasmSolver.worker.ts     # WASM Worker (importScripts fallback)
    store/
      guiStore.ts              # selectedSolver, wasmAvailable, solverStats
      levelStore.ts            # solveLevel() dual path (TS vs WASM), terminateWorker, pause/step
    components/
      SolverSelector.tsx       # solver selection UI (two cards), badge
      GridButtons.tsx          # Solve/Pause/Stop + selected/running solver badge
      ProgressBar.tsx          # iterations + solver label + latest stats
      SolvedPopup.tsx          # used solver + TS vs WASM comparison when both have run
  vite.config.ts               # worker.format=es, assetsInclude wasm
```

### Solve flow

1. `guiStore.selectedSolver` determines the solver.
2. `levelStore.solveLevel()` gets the adapter from `solverRegistry.get(selectedSolver)`.
3. **WASM path**: checks `adapter.isAvailable()` (`HEAD /wasm/railbound.wasm` plus glue loading). If unavailable, it falls back to TS and switches the UI automatically.
   - Calls `adapter.solve(levelData, hyperparams, onProgress)` → `wasmLoader.callWasmSolveJson` → `Module.cwrap("solve_level_json")` or `Module.solveLevelJson` (Embind).
   - Input JSON: `{board, mods, mod_nums, cars, tracks, semaphores, options}`. Output JSON: `{solved, board, mods, tracks_left, ...}`.
   - Runs in `wasmSolver.worker.ts` to avoid blocking the UI; if the Worker fails, it falls back to the main thread.
4. **TS path**: creates a `new Worker()` from `algo/main.ts?worker`, sends `{level, parameters}`, and receives streaming `visualize_data` plus `done/solution`. Pause/step are supported through `visualize_rate`.
5. The result is converted to `GridCell[][]` (`Track.get`/`Mod.get`) and stored in `permLevelData.solution`. `solverStats` stores `time`/`iterations` for the comparison popup.

## Building WASM

### Requirements

- Emscripten SDK 3.1+ (`emcc`)
- CMake 3.20+ (optional, for `emcmake`)

Install Emscripten:

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh   # Linux/macOS / Git Bash
emsdk_env.bat           # Windows
emcc --version
```

### Quick build (recommended)

```bash
# From the repository root
./cpp/wasm/build_wasm.sh          # Release O3
./cpp/wasm/build_wasm.sh --debug  # Debug O0+g

# Windows PowerShell
.\cpp\wasm\build_wasm.ps1
.\cpp\wasm\build_wasm.ps1 -Debug

# Or via npm (from website/)
npm run build:wasm
npm run build:wasm:debug
npm run build:wasm:ps       # Windows
```

Output: `website/public/wasm/railbound.js` + `railbound.wasm` (copied automatically).

### Manual build with emcc

```bash
emcc cpp/src/types.cpp cpp/src/level.cpp cpp/src/solver.cpp cpp/wasm/wasm_bindings.cpp \
  -I cpp/include -I cpp -I cpp/third_party \
  -O3 -std=c++20 \
  -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME="createRailboundModule" \
  -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS='["_solve_level_json","_free_string","_wasm_is_ready","_get_solver_version","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall","UTF8ToString","stringToUTF8","lengthBytesUTF8"]' \
  -s ENVIRONMENT=web,worker -s WASM_ASYNC_COMPILATION=1 \
  -o website/public/wasm/railbound.js
```

Add `--bind -s EXPORT_ES6=1` if Embind + ESM is needed.

### Build through CMake (optional)

```bash
emcmake cmake -B cpp/build-wasm -S cpp -DRAILBOUND_WASM=ON -DCMAKE_BUILD_TYPE=Release
cmake --build cpp/build-wasm
# Automatically copied to website/public/wasm/
```

## Using it in the website

1. Build WASM (if it has not been built): `./cpp/wasm/build_wasm.sh`
2. Start the dev server:

```bash
npm run dev --prefix website
# Open http://localhost:5173
```

3. Open the **Solver Engine** sidebar (the ⚙️ icon) and select **TypeScript** or **C++ (WASM)**.
   - If `railbound.wasm` has not been built, the WASM card is dimmed and shows build instructions; it cannot be selected.
4. Configure a level and press **Solve**. ProgressBar and GridButtons show the `TS`/`WASM` badge and current status.
5. When solving finishes, **SolvedPopup** shows the result and the used solver badge. If both solvers have run, the popup also shows an iterations/time comparison table.
6. **Pause/Step** only affect TS (WASM is synchronous; Step runs the full solve).

## Fallbacks and errors

- If WASM is selected but its file is missing, `checkWasmAvailability()` (`HEAD`) returns false. The UI disables WASM, `solveLevel()` falls back to TS, and `selectedSolver` is changed back to `typescript` with a warning logged.
- If the glue JS fails, `wasmLoader.loadWasmModule()` throws. The adapter catches the error and returns `solved:false, error`; the popup shows “No Solution” with the error message in `time_elapsed`.
- The `public/wasm/railbound.js` placeholder stub prevents a 404 before a real build. It returns `wasmIsReady()=false` and a JSON error from `solveLevelJson`. A real build overwrites it.

## WASM API (JSON)

Input (sent to `solve_level_json`):

```json
{
  "board": [[1,0], [2,0]],
  "mods": [[0,0], [0,0]],
  "mod_nums": [[0,0], [0,0]],
  "cars": [{"pos":[0,1], "direction":"RIGHT", "num":0, "type":"NORMAL"}],
  "tracks": 10,
  "semaphores": 0,
  "options": {"heatmap_limit_limit":9, "decoy_heatmap_limit":15, "gen_type":"DFS"}
}
```

Or the wrapper `{ "level": {...}, "options": {...} }`.

Output:

```json
{
  "solved": true,
  "board": [[1,3], [2,0]],
  "mods": [[0,0], [0,0]],
  "tracks_left": 2,
  "semaphores_left": 0,
  "iterations": 12345,
  "time_elapsed": 0.042,
  "timed_out": false,
  "max_iterations_reached": false
}
```

Call it from JS with cwrap:

```js
import createRailboundModule from '/wasm/railbound.js';
const Module = await createRailboundModule();
const solve = Module.cwrap('solve_level_json', 'number', ['string']);
const free = Module.cwrap('free_string', null, ['number']);
const ptr = solve(JSON.stringify(levelJson));
const resultStr = Module.UTF8ToString(ptr);
free(ptr);
const result = JSON.parse(resultStr);
```

Or with Embind: `Module.solveLevelJson(jsonStr)`.

## Performance

- C++ uses inline `Small*Vec` types, copy-on-write `SharedPtr` heatmaps, and flat 4D buffers — **20–30×** faster than JS on the 23-level benchmark (see `cpp/src/main.cpp --benchmark`).
- WASM preserves these optimizations and only adds a small JS↔WASM string-copy overhead compared with the search itself.
- Recommended: use WASM for large levels (≥10 tracks) and TS for small levels when visualization is useful.

## Troubleshooting

- `emcc: command not found` → install emsdk and run `source ./emsdk_env.sh`.
- `wasm binary not found` → run the build again, ensure `website/public/wasm/railbound.wasm` exists, and hard-reload (Ctrl+F5).
- `createRailboundModule not found` → the glue JS did not load; check the Network tab for a 200 response from `/wasm/railbound.js`.
- CORS/COEP error → COEP/COOP is not required because SharedArrayBuffer is not used. If `require-corp` headers are enabled, disable them in `vite.config.ts`.
- Step does not work with WASM → expected behavior; WASM solve is synchronous and does not support step-by-step execution.

## Extending

- Add a third solver: create a new adapter implementing `SolverAdapter`, register it in `registry.ts`, and add a `SOLVERS` entry.
- Stream WASM progress: add a `VisualizeCallback` through `EM_JS` and post each chunk (not currently needed because WASM is fast).
- Automatic comparison: the “Compare Both” button runs TS and then WASM on the same level and displays the table.
