/**
 * Solver abstraction layer
 * Defines unified interface for both TypeScript and WASM (C++) solvers
 */

import type { GridCell, LevelData } from "../store/levelStore";
import type { Hyperparameters } from "../store/guiStore";
import { Track, Mod, CarType, Direction } from "../../../algo/classes";

export type SolverId = "typescript" | "wasm";

export interface SolverInfo {
  id: SolverId;
  label: string;
  shortLabel: string;
  description: string;
  badge: string;
  color: string;
}

export const SOLVERS: Record<SolverId, SolverInfo> = {
  typescript: {
    id: "typescript",
    label: "TypeScript Solver",
    shortLabel: "TS",
    description: "Original TypeScript algorithm (runs in Worker). Easy to debug, step-by-step visualization.",
    badge: "JS",
    color: "bg-yellow-500",
  },
  wasm: {
    id: "wasm",
    label: "C++ Solver (WASM)",
    shortLabel: "WASM",
    description: "C++ solver compiled to WebAssembly — 20-30x faster, optimized Flat heap & lookup tables.",
    badge: "WASM",
    color: "bg-purple-500",
  },
};

export interface SolverProgress {
  board: Track[][];
  mods: Mod[][];
  cars: unknown[];
  iterations: number;
  time_elapsed: number;
}

export interface SolverSolution {
  board?: Track[][];
  mods?: Mod[][];
  tracks_left: number;
  semaphores_left: number;
  iterations: number;
  time_elapsed: number;
  solved: boolean;
  timed_out?: boolean;
}

export interface SolverAdapter {
  readonly id: SolverId;
  readonly info: SolverInfo;
  isAvailable(): Promise<boolean>;
  solve(
    levelData: LevelData,
    hyperparameters: Hyperparameters,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverSolution>;
  terminate(): void;
  isRunning(): boolean;
}

/**
 * Convert LevelData (GridCell[][]) to the JSON format expected by both solvers.
 * Mirrors algo/main.ts json_level_type and C++ Level::from_json.
 */
export function levelDataToJson(levelData: LevelData): {
  board: number[][];
  mods: number[][];
  mod_nums: number[][];
  cars: { pos: number[]; direction: string; num: number; type: string }[];
  tracks: number;
  semaphores: number;
} {
  const H = levelData.grid.length;
  const W = levelData.grid[0]?.length ?? 0;
  const board: number[][] = Array.from({ length: H }, () => Array(W).fill(0));
  const mods: number[][] = Array.from({ length: H }, () => Array(W).fill(0));
  const mod_nums: number[][] = Array.from({ length: H }, () => Array(W).fill(0));
  const cars: { pos: number[]; direction: string; num: number; type: string }[] = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cell: GridCell = levelData.grid[y][x];
      board[y][x] = cell.track.value;
      mods[y][x] = cell.mod.value;
      mod_nums[y][x] = cell.mod_num;
      if (cell.car) {
        const c = cell.car;
        cars.push({
          pos: [c.pos[0], c.pos[1]],
          direction: directionToString(c.direction.value),
          num: c.num,
          type: c.type.name,
        });
      }
    }
  }

  return {
    board,
    mods,
    mod_nums,
    cars,
    tracks: levelData.max_tracks,
    semaphores: levelData.max_semaphores,
  };
}

function directionToString(v: number): string {
  switch (v) {
    case -2: return "CRASH";
    case -1: return "UNKNOWN";
    case 0: return "LEFT";
    case 1: return "RIGHT";
    case 2: return "DOWN";
    case 3: return "UP";
    default: return "UNKNOWN";
  }
}

/**
 * Convert solver's returned board/mods (Track[][] numbers) to GridCell[][]
 * for rendering.
 */
export function solutionToGrid(
  levelData: LevelData,
  solution: SolverSolution
): GridCell[][] | undefined {
  if (!solution.board || !solution.mods) return undefined;
  const H = solution.board.length;
  const W = solution.board[0].length;
  const grid: GridCell[][] = [];
  for (let y = 0; y < H; y++) {
    grid.push([]);
    for (let x = 0; x < W; x++) {
      const orig = levelData.grid[y][x];
      const car = orig.car
        ? new (orig.car.constructor as any)(
            [orig.car.pos[0], orig.car.pos[1]],
            Direction.get(orig.car.direction.value),
            orig.car.num,
            CarType.get(orig.car.type.name)
          )
        : undefined;
      // solution.board[y][x] may be Track object or raw number depending on solver
      const trackVal = typeof solution.board[y][x] === "number"
        ? (solution.board[y][x] as unknown as number)
        : (solution.board[y][x] as unknown as Track).value;
      const modVal = typeof solution.mods[y][x] === "number"
        ? (solution.mods[y][x] as unknown as number)
        : (solution.mods[y][x] as unknown as Mod).value;
      grid[y].push({
        car,
        track: Track.get(trackVal),
        mod: Mod.get(modVal),
        mod_num: orig.mod_num,
      });
    }
  }
  return grid;
}
