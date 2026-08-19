import type { SolverAdapter, SolverId } from "./types";
import { TsSolverAdapter } from "./tsSolver";
import { WasmSolverAdapter } from "./wasmSolver";

export class SolverRegistry {
  private adapters: Map<SolverId, SolverAdapter> = new Map();
  private initialized = false;

  constructor() {
    this.adapters.set("typescript", new TsSolverAdapter());
    this.adapters.set("wasm", new WasmSolverAdapter({ useWorker: true }));
  }

  get(id: SolverId): SolverAdapter {
    const a = this.adapters.get(id);
    if (!a) throw new Error(`Unknown solver: ${id}`);
    return a;
  }

  getAll(): SolverAdapter[] {
    return Array.from(this.adapters.values());
  }

  getAvailableIds(): SolverId[] {
    return Array.from(this.adapters.keys());
  }

  terminateAll(): void {
    for (const a of this.adapters.values()) a.terminate();
  }
}

export const solverRegistry = new SolverRegistry();
