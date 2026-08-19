/**
 * WASM solver adapter
 * Uses Emscripten-compiled C++ solver via wasmLoader. Runs in main thread
 * or optionally in a Web Worker (wasmSolver.worker.ts) to avoid blocking.
 */

import type { SolverAdapter, SolverProgress, SolverSolution, SolverInfo } from "./types";
import { SOLVERS, levelDataToJson } from "./types";
import type { LevelData } from "../store/levelStore";
import type { Hyperparameters } from "../store/guiStore";
import { Track, Mod } from "../../../algo/classes";
import { callWasmSolveJson, checkWasmAvailability, loadWasmModule } from "./wasmLoader";

// Optional: run WASM in a worker to keep UI responsive even for long solves.
// We attempt to use a Worker if available; otherwise fall back to main thread.
import WasmWorker from "../workers/wasmSolver.worker.ts?worker";

export class WasmSolverAdapter implements SolverAdapter {
  readonly id = "wasm" as const;
  readonly info: SolverInfo = SOLVERS.wasm;

  private worker: Worker | null = null;
  private running = false;
  private useWorker = true;

  constructor(opts?: { useWorker?: boolean }) {
    this.useWorker = opts?.useWorker ?? true;
  }

  async isAvailable(): Promise<boolean> {
    // Check if wasm binary exists
    const ok = await checkWasmAvailability();
    if (!ok) return false;
    // Try to actually load the module (will fail if glue JS missing)
    try {
      await loadWasmModule();
      return true;
    } catch {
      return false;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.running = false;
  }

  async solve(
    levelData: LevelData,
    hyperparameters: Hyperparameters,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverSolution> {
    this.terminate();
    this.running = true;

    const jsonPayload = levelDataToJson(levelData);
    const input = {
      ...jsonPayload,
      options: {
        heatmap_limit_limit: hyperparameters.heatmap_limit_limit,
        decoy_heatmap_limit: hyperparameters.decoy_heatmap_limit,
        gen_type: hyperparameters.gen_type,
        visualize_rate: hyperparameters.visualize_rate,
      },
      visualize_rate: hyperparameters.visualize_rate,
    };
    const inputStr = JSON.stringify(input);

    // WASM solver is synchronous (no incremental visualization).
    // We emit a fake progress at start and rely on final result.
    // For better UX, we optionally run in a Worker so UI stays responsive.

    if (this.useWorker && typeof Worker !== "undefined") {
      return await this.solveInWorker(inputStr, levelData, onProgress);
    } else {
      return await this.solveInMainThread(inputStr, onProgress);
    }
  }

  private async solveInMainThread(
    inputStr: string,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverSolution> {
    // For main thread, try to set up visualization via wasmLoader if onProgress provided
    // This will still block UI, but progress will be captured in Worker path primarily.
    // We attempt to use callWasmSolveJsonWithProgress if available.
    try {
      // Dynamically import to avoid circular
      const { callWasmSolveJsonWithProgress } = await import("./wasmLoader");
      if (onProgress && typeof callWasmSolveJsonWithProgress === "function") {
        const outputStr = await callWasmSolveJsonWithProgress(inputStr, onProgress as unknown as (data: unknown) => void);
        const out = JSON.parse(outputStr);
        this.running = false;
        if (out.error) throw new Error(`WASM solver error: ${out.error}`);
        if (!out.solved || out.board == null || out.mods == null) {
          return {
            solved: false,
            board: undefined,
            mods: undefined,
            tracks_left: out.tracks_left ?? 0,
            semaphores_left: out.semaphores_left ?? 0,
            iterations: out.iterations ?? 0,
            time_elapsed: out.time_elapsed ?? 0,
            timed_out: out.timed_out ?? false,
          };
        }
        const board: Track[][] = (out.board as number[][]).map((row) => row.map((v) => Track.get(v)));
        const mods: Mod[][] = (out.mods as number[][]).map((row) => row.map((v) => Mod.get(v)));
        return {
          solved: true,
          board,
          mods,
          tracks_left: out.tracks_left,
          semaphores_left: out.semaphores_left,
          iterations: out.iterations,
          time_elapsed: out.time_elapsed,
          timed_out: out.timed_out ?? false,
        };
      }
    } catch {}
    // Fallback to original without progress
    if (onProgress) {
      await new Promise((r) => setTimeout(r, 0));
    }
    try {
      const outputStr = await callWasmSolveJson(inputStr);
      const out = JSON.parse(outputStr);

      this.running = false;

      if (out.error) {
        throw new Error(`WASM solver error: ${out.error}`);
      }

      if (!out.solved || out.board == null || out.mods == null) {
        return {
          solved: false,
          board: undefined,
          mods: undefined,
          tracks_left: out.tracks_left ?? 0,
          semaphores_left: out.semaphores_left ?? 0,
          iterations: out.iterations ?? 0,
          time_elapsed: out.time_elapsed ?? 0,
          timed_out: out.timed_out ?? false,
        };
      }

      // Convert raw numbers to Track/Mod objects for consistency with TS solver
      const board: Track[][] = (out.board as number[][]).map((row) =>
        row.map((v) => Track.get(v))
      );
      const mods: Mod[][] = (out.mods as number[][]).map((row) =>
        row.map((v) => Mod.get(v))
      );

      return {
        solved: true,
        board,
        mods,
        tracks_left: out.tracks_left,
        semaphores_left: out.semaphores_left,
        iterations: out.iterations,
        time_elapsed: out.time_elapsed,
        timed_out: out.timed_out ?? false,
      };
    } catch (e) {
      this.running = false;
      throw e;
    }
  }

  private solveInWorker(
    inputStr: string,
    levelData: LevelData,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverSolution> {
    return new Promise((resolve, reject) => {
      const worker = new WasmWorker();
      this.worker = worker;

      // Worker protocol: post { type: 'solve', payload: inputStr }
      // Worker responds with { type: 'progress', ... } or { type: 'done', payload: outputStr }
      const timeoutMs = 60000; // fallback timeout; caller may have its own
      let timeoutId: number | null = null;

      const cleanup = () => {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        if (this.worker === worker) {
          this.worker = null;
        }
        this.running = false;
      };

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data as { type: string; payload?: unknown; progress?: unknown };
        if (msg.type === "progress" && onProgress) {
          const progData = (msg.progress ?? msg.payload) as SolverProgress;
          // Convert WASM progress (board as number[][]) to expected format if needed
          // onProgress in levelStore handles both Track[][] and number[][]
          onProgress(progData);
        } else if (msg.type === "done") {
          cleanup();
          worker.terminate();
          try {
            const out = JSON.parse(msg.payload as string);
            if (out.error) {
              reject(new Error(`WASM worker error: ${out.error}`));
              return;
            }
            if (!out.solved || out.board == null) {
              resolve({
                solved: false,
                board: undefined,
                mods: undefined,
                tracks_left: out.tracks_left ?? 0,
                semaphores_left: out.semaphores_left ?? 0,
                iterations: out.iterations ?? 0,
                time_elapsed: out.time_elapsed ?? 0,
                timed_out: out.timed_out ?? false,
              });
              return;
            }
            const board: Track[][] = (out.board as number[][]).map((row) =>
              row.map((v) => Track.get(v))
            );
            const mods: Mod[][] = (out.mods as number[][]).map((row) =>
              row.map((v) => Mod.get(v))
            );
            resolve({
              solved: true,
              board,
              mods,
              tracks_left: out.tracks_left,
              semaphores_left: out.semaphores_left,
              iterations: out.iterations,
              time_elapsed: out.time_elapsed,
              timed_out: out.timed_out ?? false,
            });
          } catch (err) {
            reject(err);
          }
        } else if (msg.type === "error") {
          cleanup();
          worker.terminate();
          reject(new Error(String(msg.payload)));
        }
      };

      worker.onerror = (ev) => {
        cleanup();
        worker.terminate();
        // Fallback to main thread on worker failure
        console.warn("[WasmSolver] Worker failed, falling back to main thread", ev);
        this.solveInMainThread(inputStr, onProgress).then(resolve).catch(reject);
      };

      // Optional timeout to detect hung worker
      // timeoutId = window.setTimeout(() => {
      //   cleanup();
      //   worker.terminate();
      //   reject(new Error("WASM solver timeout"));
      // }, timeoutMs);

      worker.postMessage({ type: "solve", payload: inputStr });
    });
  }
}
