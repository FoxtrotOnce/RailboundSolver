# Railbound WASM Bindings

This directory contains Emscripten bindings to expose the C++ solver to the website via WebAssembly.

## Files

- `wasm_bindings.cpp` – C API + Embind wrapper around `solve_level`. Accepts a JSON string and returns a JSON string.

## Input JSON format

```json
{
  "board": [[1,0,...], ...],
  "mods": [[0,0,...], ...],
  "mod_nums": [[0,0,...], ...],
  "cars": [{"pos":[y,x], "direction":"RIGHT", "num":0, "type":"NORMAL"}],
  "tracks": 10,
  "semaphores": 0,
  "options": {
    "heatmap_limit_limit": 9,
    "decoy_heatmap_limit": 15,
    "gen_type": "DFS"
  }
}
```

Alternative wrapper:

```json
{
  "level": { "board":..., "mods":..., ... },
  "options": { "gen_type":"DFS", ... }
}
```

## Output JSON format

```json
{
  "solved": true,
  "board": [[...]],
  "mods": [[...]],
  "tracks_left": 2,
  "semaphores_left": 0,
  "iterations": 12345,
  "time_elapsed": 0.042,
  "timed_out": false,
  "max_iterations_reached": false
}
```

## Building

Requires Emscripten SDK (`emcc`). Install via https://emscripten.org/docs/getting_started/downloads.html

### One-shot build

```bash
# From repo root
./cpp/wasm/build_wasm.sh
# or
npm run build:wasm --prefix website
```

### Manual emcc

```bash
emcc cpp/src/types.cpp cpp/src/level.cpp cpp/src/solver.cpp cpp/wasm/wasm_bindings.cpp \
  -I cpp/include -I cpp -I cpp/third_party \
  -O3 -std=c++20 \
  -s WASM=1 \
  -s MODULARIZE=1 -s EXPORT_NAME="createRailboundModule" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_solve_level_json","_free_string","_wasm_is_ready","_get_solver_version","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall","UTF8ToString","stringToUTF8","lengthBytesUTF8","getValue","setValue"]' \
  -s ENVIRONMENT=web,worker \
  -s WASM_ASYNC_COMPILATION=1 \
  -s INITIAL_MEMORY=16777216 \
  -o website/public/wasm/railbound.js
```

Add `-s WASM=1 -lembind` if you want Embind variant (`solveLevelJson` via `Module.solveLevelJson`).

### CMake (Emscripten toolchain)

```bash
emcmake cmake -B cpp/build-wasm -S cpp -DRAILBOUND_WASM=ON -DCMAKE_BUILD_TYPE=Release
cmake --build cpp/build-wasm
# outputs to website/public/wasm/
```

## JS usage

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

Or via Embind:

```js
const Module = await createRailboundModule();
const resultStr = Module.solveLevelJson(JSON.stringify(levelJson));
const result = JSON.parse(resultStr);
```
