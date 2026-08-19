/**
 * WASM Loader for Railbound C++ solver
 * - Tries to load wasm/railbound_wasm.wasm + js glue (built via emcc)
 * - Falls back to TS worker if not available
 * - Provides same solveLevel API as TS solver for levelStore
 */

import { Track, Mod, Car, CarType, Direction } from "../../../algo/classes";
import type { GridCell } from "../store/levelStore";

// Types mirroring C++ SolveResult
export interface WasmSolveResult {
  solved: boolean;
  board?: Track[][];
  mods?: Mod[][];
  tracks_left: number;
  semaphores_left: number;
  time_elapsed: number;
  iterations: number;
}

// internal module type from emcc MODULARIZE=1
type RailboundModule = {
  _wasm_set_params(a: number, b: number, c: number, d: number): void;
  _wasm_solve_flat(
    boardPtr: number, modsPtr: number, modNumsPtr: number,
    H: number, W: number, maxTracks: number, maxSemaphores: number,
    carPosYPtr: number, carPosXPtr: number, carDirPtr: number, carNumPtr: number, carTypePtr: number,
    numCars: number
  ): number;
  _wasm_is_solved(): number;
  _wasm_get_board_at(y: number, x: number): number;
  _wasm_get_mods_at(y: number, x: number): number;
  _wasm_get_tracks_left(): number;
  _wasm_get_semaphores_left(): number;
  _wasm_get_iterations_low(): number;
  _wasm_get_iterations_high(): number;
  _wasm_get_time(): number;
  _wasm_get_H(): number;
  _wasm_get_W(): number;
  _malloc(size: number): number;
  _free(ptr: number): void;
  getValue(ptr: number, type: string): number;
  setValue(ptr: number, value: number, type: string): void;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
};

let wasmModule: RailboundModule | null = null;
let wasmReady: boolean | null = null;
let wasmLoadPromise: Promise<boolean> | null = null;

// ---------------------------------------------------------------------------
// Load WASM module (lazy, cached)
// ---------------------------------------------------------------------------
export async function loadWasm(): Promise<RailboundModule | null> {
  if (wasmModule) return wasmModule;
  try {
    // Try two locations:
    // 1) Vite served wasm via public/wasm (fetch)
    // 2) Bundled JS glue at src/wasm/railbound_wasm.js (after make wasm)
    // We use dynamic import with ?url for wasm file check.

    // First check if wasm binary exists via fetch HEAD
    const wasmUrl = "/wasm/railbound_wasm.wasm";
    const head = await fetch(wasmUrl, { method: "HEAD" }).catch(() => null);
    if (!head || !head.ok) {
      console.info("[WASM] railbound_wasm.wasm not found at", wasmUrl, "– using TS fallback. Run `make wasm` in wasm/ to build.");
      wasmReady = false;
      return null;
    }

    // Try to import the JS glue (placeholder until `make wasm` is run).
    // Use vite-ignore so Vite doesn't fail the build when the glue is a stub.
    // The glue is UMD (emcc without EXPORT_ES6) or ES6 (with -sEXPORT_ES6=1),
    // so we check multiple export shapes and also global fallback.
    let factory: ((opts?: any) => Promise<RailboundModule>) | null = null;
    try {
      // @ts-ignore – placeholder file exists; real file overwrites it after `make wasm`
      const mod: any = await import(/* @vite-ignore */ "./railbound_wasm.js");
      factory = (mod.default ?? mod.createRailboundModule ?? (globalThis as any).createRailboundModule ?? (self as any)?.createRailboundModule) as any;
      // Some UMD builds attach to module.exports which Vite's import doesn't surface – try global after import
      if (!factory && typeof (globalThis as any).createRailboundModule === 'function') {
        factory = (globalThis as any).createRailboundModule;
      }
      if (factory && factory.toString().includes("WASM not built")) {
        console.info("[WASM] placeholder glue detected – will try raw wasm or fall back to TS");
        factory = null;
      }
    } catch (e) {
      console.info("[WASM] JS glue import failed:", (e as Error).message ?? e);
      // Fallback: fetch + eval UMD via Function (for non-ES6 glue)
      try {
        const resp = await fetch(new URL("./railbound_wasm.js", import.meta.url).href);
        if (resp.ok) {
          const text = await resp.text();
          if (!text.includes("WASM not built") && text.includes("createRailboundModule")) {
            const g: any = globalThis;
            const fn = new Function('globalThis', 'self', 'window', text + '\n;return typeof createRailboundModule !== "undefined" ? createRailboundModule : (typeof module !== "undefined" && module.exports ? module.exports.default ?? module.exports : null);');
            factory = fn(g, g, g) as any;
            if (factory) console.info("[WASM] loaded UMD glue via fetch+eval");
          }
        }
      } catch (e2) {
        console.info("[WASM] fetch+eval fallback also failed:", e2);
        factory = null;
      }
    }

    if (factory) {
      try {
        wasmModule = await factory({
          locateFile: (path: string, prefix: string) => {
            if (path.endsWith('.wasm')) return '/wasm/railbound_wasm.wasm';
            return prefix + path;
          },
        });
        wasmReady = true;
        console.log("[WASM] Railbound C++ module loaded (embind).");
        return wasmModule;
      } catch (e) {
        console.warn("[WASM] factory() failed, falling back to TS:", e);
        wasmReady = false;
        return null;
      }
    }

    // No JS glue but .wasm exists – only for clang standalone builds.
    // For emcc builds this path would fail (needs glue), so fallback to TS.
    // We keep a minimal check to avoid noisy "Import #0 a" error: only try raw if file is clang (tiny).
    console.info("[WASM] JS glue not usable, falling back to TS solver (run make wasm with -sEXPORT_ES6=1 for ES6 glue)");
    wasmReady = false;
    return null;
  } catch (e) {
    console.warn("[WASM] failed to load, falling back to TS solver:", e);
    wasmReady = false;
    return null;
  }
}

export function isWasmReady(): boolean | null {
  return wasmReady;
}

export async function ensureWasm(): Promise<boolean> {
  if (wasmReady !== null) return wasmReady;
  if (wasmLoadPromise) return wasmLoadPromise;
  wasmLoadPromise = loadWasm().then(m => !!m);
  return wasmLoadPromise;
}

// ---------------------------------------------------------------------------
// Solve via WASM – mirrors solve_level in algo/main.ts
// Accepts same GridCell[][] shape as levelStore
// ---------------------------------------------------------------------------
export async function solveLevelWasm(
  grid: GridCell[][],
  maxTracks: number,
  maxSemaphores: number,
  hyperparams: { heatmap_limit_limit: number; decoy_heatmap_limit: number; gen_type: "DFS" | "BFS"; visualize_rate: number },
  onVisualize?: (board: Track[][], mods: Mod[][], cars: Car[], iter: number, elapsed: number) => void,
  abortSignal?: AbortSignal
): Promise<WasmSolveResult> {
  const mod = await loadWasm();
  if (!mod) throw new Error("WASM not available");

  const H = grid.length;
  const W = grid[0].length;

  // Flatten
  const boardFlat = new Int32Array(H * W);
  const modsFlat = new Int32Array(H * W);
  const modNumsFlat = new Int32Array(H * W);
  const cars: Car[] = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cell = grid[y][x];
      boardFlat[y * W + x] = cell.track.value;
      modsFlat[y * W + x] = cell.mod.value;
      modNumsFlat[y * W + x] = cell.mod_num;
      if (cell.car) cars.push(cell.car);
    }
  }

  const numCars = cars.length;
  const carPosY = new Int32Array(numCars);
  const carPosX = new Int32Array(numCars);
  const carDir = new Int32Array(numCars);
  const carNum = new Int32Array(numCars);
  const carType = new Int32Array(numCars);
  for (let i = 0; i < numCars; i++) {
    carPosY[i] = cars[i].pos[0];
    carPosX[i] = cars[i].pos[1];
    carDir[i] = cars[i].direction.value;
    carNum[i] = cars[i].num;
    carType[i] = cars[i].type === CarType.NORMAL ? 1 : cars[i].type === CarType.DECOY ? 2 : cars[i].type === CarType.NUMERAL ? 3 : 0;
  }

  // set params
  const genTypeInt = hyperparams.gen_type === "BFS" ? 1 : 0;
  mod._wasm_set_params(hyperparams.heatmap_limit_limit, hyperparams.decoy_heatmap_limit, genTypeInt, hyperparams.visualize_rate);

  // Abort check
  if (abortSignal?.aborted) throw new DOMException("Aborted", "AbortError");

  // Allocate wasm memory
  const bytes = (arr: Int32Array) => arr.byteLength;
  const boardPtr = mod._malloc(bytes(boardFlat));
  const modsPtr = mod._malloc(bytes(modsFlat));
  const modNumsPtr = mod._malloc(bytes(modNumsFlat));
  const posYPtr = mod._malloc(bytes(carPosY));
  const posXPtr = mod._malloc(bytes(carPosX));
  const dirPtr = mod._malloc(bytes(carDir));
  const numPtr = mod._malloc(bytes(carNum));
  const typePtr = mod._malloc(bytes(carType));

  const heap32 = () => new Int32Array(mod.HEAP32.buffer);
  // Copy – use HEAP32 view (need to refresh after malloc may grow)
  const copyToHeap = (ptr: number, src: Int32Array) => {
    const heap = new Int32Array(mod.HEAP32.buffer);
    heap.set(src, ptr >> 2);
  };
  copyToHeap(boardPtr, boardFlat);
  copyToHeap(modsPtr, modsFlat);
  copyToHeap(modNumsPtr, modNumsFlat);
  copyToHeap(posYPtr, carPosY);
  copyToHeap(posXPtr, carPosX);
  copyToHeap(dirPtr, carDir);
  copyToHeap(numPtr, carNum);
  copyToHeap(typePtr, carType);

  // Solve – synchronous (fast). For visualization we could use wasm_solve_with_callback but that requires Worker.
  // Here we just call the flat solver; onVisualize will be called once with final board if provided.
  let solvedInt = 0;
  try {
    solvedInt = mod._wasm_solve_flat(boardPtr, modsPtr, modNumsPtr, H, W, maxTracks, maxSemaphores, posYPtr, posXPtr, dirPtr, numPtr, typePtr, numCars);
  } finally {
    mod._free(boardPtr);
    mod._free(modsPtr);
    mod._free(modNumsPtr);
    mod._free(posYPtr);
    mod._free(posXPtr);
    mod._free(dirPtr);
    mod._free(numPtr);
    mod._free(typePtr);
  }

  const solved = solvedInt === 1;
  const tracks_left = mod._wasm_get_tracks_left();
  const semaphores_left = mod._wasm_get_semaphores_left();
  const iterLow = mod._wasm_get_iterations_low();
  const iterHigh = mod._wasm_get_iterations_high();
  const iterations = iterLow + iterHigh * 4294967296;
  const time_elapsed = mod._wasm_get_time();

  let board: Track[][] | undefined;
  let mods: Mod[][] | undefined;
  if (solved) {
    board = [];
    mods = [];
    for (let y = 0; y < H; y++) {
      board.push([]);
      mods.push([]);
      for (let x = 0; x < W; x++) {
        board[y].push(Track.get(mod._wasm_get_board_at(y, x)));
        mods[y].push(Mod.get(mod._wasm_get_mods_at(y, x)));
      }
    }
    if (onVisualize) {
      // Reconstruct cars for callback (no movement, just original)
      onVisualize(board, mods, cars, iterations, time_elapsed);
    }
  }

  return {
    solved,
    board,
    mods,
    tracks_left,
    semaphores_left,
    time_elapsed,
    iterations,
  };
}

// Helper to convert WasmSolveResult to levelStore's solution shape
export function toLevelStoreSolution(
  res: WasmSolveResult,
  grid: GridCell[][],
  maxTracks: number,
  maxSemaphores: number
): { grid?: GridCell[][]; tracks_left: number; semaphores_left: number; iterations: number; time_elapsed: number } {
  if (!res.solved || !res.board || !res.mods) {
    return { tracks_left: 0, semaphores_left: 0, iterations: res.iterations, time_elapsed: res.time_elapsed };
  }
  const out: GridCell[][] = [];
  for (let y = 0; y < grid.length; y++) {
    out.push([]);
    for (let x = 0; x < grid[0].length; x++) {
      out[y].push({
        car: grid[y][x].car ? new Car([grid[y][x].car!.pos[0], grid[y][x].car!.pos[1]], Direction.get(grid[y][x].car!.direction.value), grid[y][x].car!.num, CarType.get(grid[y][x].car!.type.name)) : undefined,
        track: res.board[y][x],
        mod: res.mods[y][x],
        mod_num: grid[y][x].mod_num,
      });
    }
  }
  return {
    grid: out,
    tracks_left: res.tracks_left,
    semaphores_left: res.semaphores_left,
    iterations: res.iterations,
    time_elapsed: res.time_elapsed,
  };
}
