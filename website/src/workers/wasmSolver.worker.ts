/**
 * WASM Solver Worker
 * Loads the Emscripten module inside a Worker context and exposes a simple
 * message protocol for the main thread.
 *
 * Protocol:
 *   Main -> Worker: { type: 'solve', payload: JSON.stringify(input) }
 *   Worker -> Main: { type: 'done', payload: JSON.stringify(output) }
 *   Worker -> Main: { type: 'error', payload: string }
 *   Worker -> Main: { type: 'progress', progress: {...} } (future: if C++ supports streaming)
 */

// The worker needs to import the wasm loader. Since we're in a Worker, document is not available,
// so we need a worker-specific loader path.

type WasmModule = {
  cwrap: (ident: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown;
  UTF8ToString: (ptr: number) => string;
  solveLevelJson?: (s: string) => string;
  setVisualizeCallback?: (cb: (data: unknown) => void) => void;
  clearVisualizeCallback?: () => void;
  setVisualizeRate?: (ms: number) => void;
};

declare const self: DedicatedWorkerGlobalScope;

let wasmModule: WasmModule | null = null;
let loadingPromise: Promise<WasmModule> | null = null;

async function getWasmModule(): Promise<WasmModule> {
  if (wasmModule) return wasmModule;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // In a Worker, we can use importScripts for the Emscripten glue.
    // The glue script is at /wasm/railbound.js (served from public/wasm).
    const glueUrl = "/wasm/railbound.js";

    // Try to import the glue via importScripts (classic worker)
    // Emscripten MODULARIZE=1 exports a factory via createRailboundModule
    try {
      // Use fetch + eval fallback if importScripts not allowed due to CORS
      // @ts-ignore
      if (typeof importScripts === "function") {
        // @ts-ignore
        importScripts(glueUrl);
        const factory = (self as unknown as { createRailboundModule?: (opts?: unknown) => Promise<WasmModule> }).createRailboundModule;
        if (!factory) throw new Error("createRailboundModule not found after importScripts");
        const opts = {
          locateFile: (path: string) => path.endsWith(".wasm") ? "/wasm/" + path.split("/").pop()! : path,
        };
        let mod: WasmModule;
        try { mod = await (factory as unknown as (o: unknown) => Promise<WasmModule>)(opts); }
        catch { mod = await factory(); }
        wasmModule = mod;
        return mod;
      } else {
        throw new Error("importScripts not available");
      }
    } catch (e) {
      // Fallback: dynamic import via fetch (if worker supports ESM)
      // Not all workers are ESM; we try to fetch and create via function
      const res = await fetch(glueUrl);
      if (!res.ok) throw new Error(`Failed to fetch WASM glue: ${glueUrl} (${res.status})`);
      const text = await res.text();
      // Evaluate in worker scope
      // eslint-disable-next-line no-eval
      (0, eval)(text);
      const factory = (self as unknown as { createRailboundModule?: (opts?: unknown) => Promise<WasmModule> }).createRailboundModule;
      if (!factory) throw new Error("createRailboundModule not found after fetch-eval");
      const opts = {
        locateFile: (path: string) => path.endsWith(".wasm") ? "/wasm/" + path.split("/").pop()! : path,
      };
      let mod: WasmModule;
      try { mod = await (factory as unknown as (o: unknown) => Promise<WasmModule>)(opts); }
      catch { mod = await factory(); }
      wasmModule = mod;
      return mod;
    }
  })();

  return loadingPromise;
}

self.onmessage = async (e: MessageEvent<{ type: string; payload?: string }>) => {
  const msg = e.data;
  if (msg.type === "solve") {
    const inputStr = msg.payload as string;
    try {
      const mod = await getWasmModule();

      // Try to set up visualization: parse visualize_rate from input if present
      let visualizeRate = 100;
      try {
        const parsed = JSON.parse(inputStr);
        const opts = parsed.options ?? parsed.parameters ?? {};
        if (typeof opts.visualize_rate === "number") visualizeRate = opts.visualize_rate;
        else if (typeof parsed.visualize_rate === "number") visualizeRate = parsed.visualize_rate;
      } catch {}

      // Set up progress callback if module supports it
      const hasViz = typeof mod.setVisualizeCallback === "function";
      if (hasViz) {
        try {
          if (typeof mod.setVisualizeRate === "function") mod.setVisualizeRate!(visualizeRate);
        } catch {}
        // Create JS callback that forwards to main thread
        const vizCb = (data: unknown) => {
          // data is { board, mods, cars, iterations, time_elapsed }
          // Forward as progress message; main thread will update rendered grid
          try {
            // Send both payload and progress for compatibility
            self.postMessage({ type: "progress", payload: data, progress: data });
          } catch {}
        };
        try {
          mod.setVisualizeCallback!(vizCb);
        } catch (err) {
          console.warn("[WASM Worker] setVisualizeCallback failed", err);
        }
      }

      let outputStr: string;
      try {
        if (mod.solveLevelJson) {
          outputStr = mod.solveLevelJson(inputStr);
        } else {
          const solve = mod.cwrap("solve_level_json", "number", ["string"]) as (s: string) => number;
          const free = mod.cwrap("free_string", null, ["number"]) as (ptr: number) => void;
          const ptr = solve(inputStr);
          if (!ptr) throw new Error("WASM solve returned null");
          outputStr = mod.UTF8ToString(ptr);
          free(ptr);
        }
      } finally {
        // Clear callback after solve (important to not leak)
        if (hasViz) {
          try {
            if (typeof mod.clearVisualizeCallback === "function") mod.clearVisualizeCallback!();
            else if (typeof mod.setVisualizeCallback === "function") {
              // Clear by setting undefined if clear not available
              try { (mod as unknown as { setVisualizeCallback: (v: unknown) => void }).setVisualizeCallback(undefined as unknown as () => void); } catch {}
            }
          } catch {}
        }
      }

      // Validate JSON before sending
      JSON.parse(outputStr);

      self.postMessage({ type: "done", payload: outputStr });
    } catch (err) {
      const msgErr = err instanceof Error ? err.message : String(err);
      // Check if WASM not built -> provide helpful message
      if (msgErr.includes("Failed to fetch") || msgErr.includes("createRailboundModule") || msgErr.includes("not found")) {
        self.postMessage({
          type: "error",
          payload: `WASM module not available. Build it with: ./cpp/wasm/build_wasm.sh or .\\cpp\\wasm\\build_wasm.ps1. Details: ${msgErr}`,
        });
      } else {
        self.postMessage({ type: "error", payload: msgErr });
      }
    }
  } else if (msg.type === "ping") {
    try {
      await getWasmModule();
      self.postMessage({ type: "pong", payload: "ready" });
    } catch (err) {
      self.postMessage({ type: "error", payload: String(err) });
    }
  }
};

// Signal that worker is ready
self.postMessage({ type: "ready" });
