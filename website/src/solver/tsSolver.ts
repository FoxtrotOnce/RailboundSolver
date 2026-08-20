/**
 * TypeScript solver adapter
 * Wraps the existing algo/main.ts Worker (DFS/BFS heatmap solver in JS)
 */

import type { SolverAdapter, SolverProgress, SolverSolution, SolverInfo } from "./types";
import { SOLVERS } from "./types";
import type { LevelData } from "../store/levelStore";
import type { Hyperparameters } from "../store/guiStore";
import { Track, Mod } from "../../../algo/classes";

// Vite worker import for TS solver
import TsWorker from "../../../algo/main.ts?worker";

type TsWorkerMessage = {
  done: boolean;
  visualize_data?: {
    board: Track[][];
    mods: Mod[][];
    cars: unknown[];
    iterations: number;
    time_elapsed: number;
  };
  solution?: {
    board: Track[][] | undefined;
    mods: Mod[][] | undefined;
    tracks_left: number;
    semaphores_left: number;
    time_elapsed: number;
    iterations: number;
  };
};

export class TsSolverAdapter implements SolverAdapter {
  readonly id = "typescript" as const;
  readonly info: SolverInfo = SOLVERS.typescript;

  private worker: Worker | null = null;
  private running = false;

  async isAvailable(): Promise<boolean> {
    return true; // Always available (pure JS)
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

    return new Promise<SolverSolution>((resolve, reject) => {
      const worker = new TsWorker();
      this.worker = worker;
      this.running = true;

      // Need to reconstruct level payload for worker.
      // algo/main.ts expects { level: {grid, max_tracks, max_semaphores}, parameters: hyperparameters }
      // But solve_level in algo/main.ts also accepts json style; the worker path in levelStore.ts
      // sends { level: permLevelData, parameters: hyperparameters } and visualizes.
      // We replicate that worker protocol here.

      const payload = {
        level: levelData,
        parameters: hyperparameters,
      };

      worker.onmessage = (e: MessageEvent<TsWorkerMessage>) => {
        if (e.data.done) {
          const sol = e.data.solution!;
          this.running = false;
          this.worker = null;

          if (sol.board === undefined || sol.mods === undefined) {
            resolve({
              solved: false,
              board: undefined,
              mods: undefined,
              tracks_left: 0,
              semaphores_left: 0,
              iterations: sol.iterations,
              time_elapsed: sol.time_elapsed,
            });
          } else {
            resolve({
              solved: true,
              board: sol.board as unknown as Track[][],
              mods: sol.mods as unknown as Mod[][],
              tracks_left: sol.tracks_left,
              semaphores_left: sol.semaphores_left,
              iterations: sol.iterations,
              time_elapsed: sol.time_elapsed,
            });
          }
          worker.terminate();
        } else if (e.data.visualize_data !== undefined) {
          const vd = e.data.visualize_data;
          if (onProgress) {
            onProgress({
              board: vd.board as unknown as Track[][],
              mods: vd.mods as unknown as Mod[][],
              cars: vd.cars,
              iterations: vd.iterations,
              time_elapsed: vd.time_elapsed,
            });
          }
          // Continue: request next chunk. Mirrors levelStore logic.
          // Only auto-continue if not paused externally (handled by caller via terminate).
          // Here we mimic: postMessage with visualize_rate
          worker.postMessage({ visualize_rate: hyperparameters.visualize_rate });
        } else {
          // Intermediate ack: worker asks for next visualize_rate
          worker.postMessage({ visualize_rate: hyperparameters.visualize_rate });
        }
      };

      worker.onerror = (ev) => {
        this.running = false;
        this.worker = null;
        reject(new Error(`TS Worker error: ${ (ev as ErrorEvent).message ?? ev}`));
      };

      // Kick off
      worker.postMessage(payload);

      // Safety: if worker doesn't respond in e.g. 10 minutes, we still resolve via timeout handled elsewhere
    });
  }
}
