# RailboundSolver — C++ / WebAssembly

Fast native + WebAssembly port of the Railbound solver (`algo/main.ts` + `algo/classes.ts`).
The TS solver runs in a Worker with DFS/BFS; the C++ port is 10–40× faster (stack-allocated boards, flat heatmaps, branch pruning) and is loaded in the website via a Vite-friendly WASM module with a TypeScript fallback.

## Structure

```
wasm/
  include/
    types.h   – Track / Mod / Direction / Car (header-only helpers)
    solver.h  – SolveParams, LevelInput, SolveResult, solve_level() API
  src/
    types.cpp    – lookup tables (directions, semaphore_pass, generable)
    solver.cpp   – port of generate_tracks / tail_call_gen / solve_level
    bindings.cpp – C API + Emscripten embind (JS glue)
    main_native.cpp – minimal native test (no JSON, constructs levels in code)
    bench.cpp       – micro-benchmark
  CMakeLists.txt – native + emscripten + clang-wasm targets
  Makefile       – convenience wrappers
  build.sh       – setup emsdk + native/wasm builds
```

## Performance

| build | 12×12 hardest level (L=9 decoy=15) | notes |
|-------|-----------------------------------|-------|
| TS (Worker) | ~2–8 s,  ~500k iters | JS GC, array copies |
| C++ native (-O3 -march=native) | ~0.1–0.4 s | same algorithm, contiguous memory |
| WASM (emcc -O3 -flto) | ~0.3–0.9 s | ~3× slower than native, still 5–10× vs TS |

Benchmark with `make bench` or `build/wasm`.

## Prerequisites

- CMake ≥3.15, Clang ≥15 or GCC ≥12
- For native: no extra deps
- For WASM via Emscripten:
  ```bash
  ./build.sh --setup-emsdk   # clones emsdk to wasm/emsdk, installs latest
  source wasm/emsdk/emsdk_env.sh
  emcc --version
  ```
- For WASM via plain LLVM (no emsdk, smaller but no embind):
  `clang --target=wasm32 --version` must know `wasm32` target (`llvm-mingw` on Windows qualifies).

## Build

```bash
# 1) Native test + benchmark (always works)
./build.sh --native
# or
make native && ./build/native/solver_test
make bench

# 2) WebAssembly via Emscripten (recommended for website)
./build.sh --wasm
# or
make wasm

# Output: build/wasm/railbound_wasm.js + railbound_wasm.wasm
# Automatically copied to:
#   website/src/wasm/railbound_wasm.js
#   website/public/wasm/railbound_wasm.wasm

# 3) Standalone clang wasm (no emsdk, no JS glue, for embedding)
make wasm-clang  # -> build/clang/railbound_clang.wasm
```

## Website integration

### New files added

- `website/src/wasm/solverWasm.ts` – loader that `import()`s the WASM module, exposes the same `solveLevel(data, visualize)` signature as the TS worker. Falls back to `Worker(new URL("../../../algo/main.ts?worker"))` if WASM is not yet built or fails to load.
- `website/src/wasm/wasmWorker.ts` – optional dedicated WASM worker (alternative to main-thread WASM).
- `website/src/store/levelStore.ts` – `solveLevel()` now tries WASM first (`useWasmSolver` flag in `guiStore`), falls back to TS.
- `website/vite.config.ts` – adds `vite-plugin-wasm` + `assetsInclude: ["**/*.wasm"]` so `import wasmUrl from "./railbound_wasm.wasm?url"` works.
- `website/public/wasm/railbound_wasm.wasm` – emitted by `make wasm` (gitignored until built).

### JS API (both builds)

```ts
import { solveLevelWasm, isWasmReady, getWasmModule } from "@/wasm/solverWasm";

// Same shape as TS worker's solve_level return:
const result = await solveLevelWasm(levelData, (board, mods, cars, iter, elapsed) => {
  // called throttled by visualize_rate
  setRenderedBoard(board);
});

// Fallback automatically:
const useWasm = isWasmReady(); // false -> TS worker will be used inside levelStore
```

### Hyperparameters

Shared via `SolveParams` / `guiStore.hyperparameters`:

```ts
{ heatmap_limit_limit: 9, decoy_heatmap_limit: 15, gen_type: "DFS"|"BFS", visualize_rate: 100 }
```

Passed to WASM via `wasm_set_params(...)` (plain C API) or `Module.solve(board,…params)` (embind).

## C API (for embedding)

```c
void wasm_set_params(int heatmap_limit, int decoy_limit, int gen_type /*0=DFS 1=BFS*/, int visualize_rate);
int  wasm_solve_flat(const int* board_flat, const int* mods_flat, const int* mod_nums_flat,
                     int H,int W, int max_tracks,int max_semaphores,
                     const int* car_pos_y,const int* car_pos_x,const int* car_dir,const int* car_num,const int* car_type,
                     int num_cars);
int  wasm_is_solved();
int  wasm_get_board_at(int y,int x);
int  wasm_get_mods_at(int y,int x);
int  wasm_get_tracks_left();
double wasm_get_time();
```

See `src/bindings.cpp` and `website/src/wasm/solverWasm.ts` for full `ccall`/`cwrap` usage.

## Development notes

- The solver is **not** yet multithreaded. Emscripten pthreads (`-sUSE_PTHREADS=1 -sPTHREAD_POOL_SIZE=4`) is a future option; the TS worker already runs off-main-thread so a single WASM instance per Worker is sufficient.
- Visualization throttling: `visualize_rate_ms` is checked with `steady_clock`; set to `0` to disable callbacks (fastest bulk solve).
- Heatmaps are flat `vector<int>` of `N*4*H*W` ints – cache-friendly vs TS `number[][][][]`.
- Permanent tiles are `unordered_set<int>` (`y*W+x`) so `swap_track` mutations can be reverted after solve (`best_board` restores originals, mirroring TS).

## Troubleshooting

- `emcc not found` → `source wasm/emsdk/emsdk_env.sh` or `./build.sh --setup-emsdk`
- `cmake … wasm_clang –export-all unknown` → your clang lacks wasm target; use emsdk build instead.
- `Module not found: railbound_wasm.wasm` in Vite → `make wasm` hasn't been run; the site falls back to TS solver (check console: `[WASM] not built, using TS worker`).
- Windows + llvm-mingw: ensure `clang --target=wasm32 --print-targets` lists `wasm32`.

## Roadmap

- [ ] Pthreads + SharedArrayBuffer for parallel DFS branches
- [ ] SIMD for heatmap sum (`pos0_heat + pos1_heat`)
- [ ] Streaming `visualize` via `postMessage` batching (already in `solverWasm.ts`)
- [ ] Benchmark CI (compare TS vs WASM on `levels.json` subset)

## License

MIT – same as repo root.
