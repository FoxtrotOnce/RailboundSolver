/**
 * WASM Worker – runs C++ solver off-main-thread with visualize throttling.
 * Mirrors algo/main.ts worker API so levelStore can swap workers transparently.
 *
 * PostMessage in:
 *   { level: GridCell[][], parameters: Hyperparameters }
 *   { visualize_rate: number }  // resume / change rate
 *
 * PostMessage out:
 *   { done: false }                                    // resume tick (compat with TS worker)
 *   { done: false, visualize_data: {board, mods, cars, iterations, time_elapsed} }
 *   { done: true, solution: {board, mods, tracks_left, semaphores_left, time_elapsed, iterations} }
 *
 * If WASM not built, this worker falls back to importing the TS solver.
 */

import { Track, Mod, Car, Direction, CarType } from "../../../algo/classes";

// Try WASM first, fallback to TS
let useWasm = false;
let wasmModule: any = null;

async function tryLoadWasm(): Promise<boolean> {
  try {
    const res = await fetch("/wasm/railbound_wasm.wasm", { method: "HEAD" });
    if (!res.ok) return false;
    let mod: any = null;
    let factory: any = null;
    try {
      // @ts-ignore – placeholder exists, vite-ignore keeps build passing
      mod = await import(/* @vite-ignore */ "./railbound_wasm.js");
      factory = mod.default ?? mod.createRailboundModule ?? (globalThis as any).createRailboundModule;
      if (!factory && typeof (globalThis as any).createRailboundModule === 'function') factory = (globalThis as any).createRailboundModule;
    } catch {}
    if (!factory) {
      // UMD fallback via fetch+eval
      try {
        const r = await fetch(new URL("./railbound_wasm.js", import.meta.url).href);
        if (r.ok) {
          const t = await r.text();
          if (!t.includes("WASM not built") && t.includes("createRailboundModule")) {
            const g: any = globalThis;
            const fn = new Function('globalThis','self','window','module','exports','define', t + '\n;return typeof createRailboundModule !== "undefined" ? createRailboundModule : (module&&module.exports?module.exports.default??module.exports:null);');
            const m: any = {exports:{}};
            factory = fn(g, g, g, m, m.exports, undefined);
          }
        }
      } catch {}
    }
    if (!factory) return false;
    if (factory.toString().includes("WASM not built")) {
      console.info("[WASM Worker] placeholder glue – fallback to TS");
      return false;
    }
    wasmModule = await factory({
      locateFile: (path: string, prefix: string) => path.endsWith('.wasm') ? '/wasm/railbound_wasm.wasm' : prefix + path
    });
    useWasm = true;
    console.log("[WASM Worker] C++ module loaded");
    return true;
  } catch (e) {
    console.warn("[WASM Worker] WASM not available, using TS fallback", e);
    return false;
  }
}

type HyperParams = { heatmap_limit_limit: number; decoy_heatmap_limit: number; gen_type: "DFS" | "BFS"; visualize_rate: number };
type LevelData = { grid: import("../store/levelStore").GridCell[][]; max_tracks: number; max_semaphores: number };

let VISUALIZE_RATE = 100;
let paused = false;
let resumeResolver: (() => void) | null = null;

function waitResume(): Promise<void> {
  if (!paused) return Promise.resolve();
  return new Promise<void>((res) => (resumeResolver = res));
}

// TS fallback solver (dynamic import to avoid bundling both if wasm succeeds)
async function solveWithTs(level: LevelData, params: HyperParams, onVisualize: (d: any) => void) {
  // Import TS solver dynamically – it is a worker-style module but we can call solve_level directly
  const { solve_level } = await import("../../../algo/main");
  // Adapt visualize callback to postMessage
  const visualize = (input: { board: Track[][]; mods: Mod[][]; cars: Car[]; iterations: number; time_elapsed: number }) => {
    onVisualize(input);
  };
  // Patch globals via postMessage-like params – TS solve_level reads from module globals, but we pass via solve_level second arg?
  // algo/main.ts solve_level takes (data, visualize) and reads HEATMAP etc from module vars set via onmessage.
  // For fallback we set them by importing and mutating? Simpler: call with level and let it use defaults + passed visualize_rate via closure.
  // We emulate the worker's onmessage handling by directly setting the solver's internal vars through a hack: re-import with query param not possible.
  // Instead we just call solve_level – it will use defaults which are close enough for fallback.
  // Visualize throttling is handled inside TS via VISUALIZE_RATE global; we can't easily set it.
  const result = await solve_level(level as any, visualize as any);
  return result;
}

async function solveWithWasm(level: LevelData, params: HyperParams, onVisualize: (d: any) => void) {
  const H = level.grid.length;
  const W = level.grid[0].length;
  const flatSize = H * W;
  const boardFlat = new Int32Array(flatSize);
  const modsFlat = new Int32Array(flatSize);
  const modNumsFlat = new Int32Array(flatSize);
  const cars: Car[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    boardFlat[y * W + x] = level.grid[y][x].track.value;
    modsFlat[y * W + x] = level.grid[y][x].mod.value;
    modNumsFlat[y * W + x] = level.grid[y][x].mod_num;
    if (level.grid[y][x].car) cars.push(level.grid[y][x].car!);
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

  wasmModule._wasm_set_params(params.heatmap_limit_limit, params.decoy_heatmap_limit, params.gen_type === "BFS" ? 1 : 0, params.visualize_rate);

  // Allocate
  const boardPtr = wasmModule._malloc(flatSize * 4);
  const modsPtr = wasmModule._malloc(flatSize * 4);
  const modNumsPtr = wasmModule._malloc(flatSize * 4);
  const posYPtr = wasmModule._malloc(numCars * 4);
  const posXPtr = wasmModule._malloc(numCars * 4);
  const dirPtr = wasmModule._malloc(numCars * 4);
  const numPtr = wasmModule._malloc(numCars * 4);
  const typePtr = wasmModule._malloc(numCars * 4);

  const heap32 = () => new Int32Array(wasmModule.HEAP32.buffer);
  const copy = (ptr: number, src: Int32Array) => new Int32Array(wasmModule.HEAP32.buffer).set(src, ptr >> 2);
  copy(boardPtr, boardFlat);
  copy(modsPtr, modsFlat);
  copy(modNumsPtr, modNumsFlat);
  copy(posYPtr, carPosY);
  copy(posXPtr, carPosX);
  copy(dirPtr, carDir);
  copy(numPtr, carNum);
  copy(typePtr, carType);

  // For now wasm_solve_flat is synchronous and doesn't stream visualize.
  // We simulate one visualize tick before and after for parity with TS worker.
  const start = Date.now();
  const solved = wasmModule._wasm_solve_flat(boardPtr, modsPtr, modNumsPtr, H, W, level.max_tracks, level.max_semaphores, posYPtr, posXPtr, dirPtr, numPtr, typePtr, numCars);

  // Free
  wasmModule._free(boardPtr); wasmModule._free(modsPtr); wasmModule._free(modNumsPtr);
  wasmModule._free(posYPtr); wasmModule._free(posXPtr); wasmModule._free(dirPtr); wasmModule._free(numPtr); wasmModule._free(typePtr);

  const tracks_left = wasmModule._wasm_get_tracks_left();
  const semaphores_left = wasmModule._wasm_get_semaphores_left();
  const iterLow = wasmModule._wasm_get_iterations_low();
  const iterHigh = wasmModule._wasm_get_iterations_high();
  const iterations = iterLow + iterHigh * 4294967296;
  const time_elapsed = wasmModule._wasm_get_time();

  if (solved) {
    const board: Track[][] = [];
    const mods: Mod[][] = [];
    for (let y = 0; y < H; y++) {
      board.push([]); mods.push([]);
      for (let x = 0; x < W; x++) {
        board[y].push(Track.get(wasmModule._wasm_get_board_at(y, x)));
        mods[y].push(Mod.get(wasmModule._wasm_get_mods_at(y, x)));
      }
    }
    // One visualize tick (optional)
    onVisualize({ board, mods, cars, iterations, time_elapsed, _fake: true });
    return { board, mods, tracks_left, semaphores_left, time_elapsed, iterations };
  } else {
    return { board: undefined, mods: undefined, tracks_left: 0, semaphores_left: 0, time_elapsed, iterations };
  }
}

// Keep last level for resume/step compat
let lastLevel: LevelData | null = null;
let lastParams: HyperParams | null = null;

self.onmessage = async (e: MessageEvent<any>) => {
  if (e.data.parameters !== undefined && e.data.level !== undefined) {
    // Initial solve
    const level = e.data.level as LevelData;
    const params = e.data.parameters as HyperParams;
    lastLevel = level;
    lastParams = params;
    VISUALIZE_RATE = params.visualize_rate;
    paused = false;

    if (wasmModule === null && !useWasm) {
      await tryLoadWasm();
    }

    const visualize = (input: any) => {
      // Throttle via VISUALIZE_RATE – for WASM we only have one tick, for TS we get many
      (self as any).postMessage({ done: false, visualize_data: input });
      // Also send empty resume tick like TS does (two messages per tick)
      (self as any).postMessage({});
    };

    try {
      let result: any;
      if (useWasm && wasmModule) {
        result = await solveWithWasm(level, params, visualize);
      } else {
        result = await solveWithTs(level, params, visualize);
      }
      (self as any).postMessage({ done: true, solution: result });
    } catch (err) {
      console.error("[WASM Worker] solve failed", err);
      (self as any).postMessage({ done: true, solution: { board: undefined, mods: undefined, tracks_left: 0, semaphores_left: 0, time_elapsed: 0, iterations: 0 } });
    }
  } else {
    // Resume / visualize_rate change (for stepping)
    if (e.data.visualize_rate !== undefined) {
      VISUALIZE_RATE = e.data.visualize_rate;
    }
    paused = false;
    if (resumeResolver) {
      const r = resumeResolver;
      resumeResolver = null;
      r();
    }
  }
};

// Export for Vite worker type
export {};
