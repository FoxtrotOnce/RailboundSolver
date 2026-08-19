/**
 * WASM loader for railbound C++ solver
 * Handles loading / caching the Emscripten module compiled to public/wasm/railbound.{js,wasm}
 */

// Emscripten modularized factory: createRailboundModule(opts?): Promise<Module>
type EmscriptenModuleFactory = (opts?: Record<string, unknown>) => Promise<WasmModule>;
type EmscriptenModuleOpts = { locateFile?: (path: string, prefix: string) => string };

export interface WasmModule {
  cwrap(ident: string, returnType: string | null, argTypes: string[]): (...args: unknown[]) => unknown;
  ccall(ident: string, returnType: string | null, argTypes: string[], args: unknown[]): unknown;
  UTF8ToString(ptr: number): string;
  stringToUTF8(str: string, outPtr: number, maxBytesToWrite: number): void;
  lengthBytesUTF8(str: string): number;
  _malloc(size: number): number;
  _free(ptr: number): void;
  // Optional embind
  solveLevelJson?: (jsonStr: string) => string;
  getSolverVersion?: () => string;
  wasmIsReady?: () => boolean;
  setVisualizeCallback?: (cb: (data: unknown) => void) => void;
  clearVisualizeCallback?: () => void;
  setVisualizeRate?: (ms: number) => void;
}

let cachedModule: WasmModule | null = null;
let loadingPromise: Promise<WasmModule> | null = null;
let lastError: string | null = null;

function getWasmUrl(): string {
  // Vite serves public/ at root. So public/wasm/railbound.js -> /wasm/railbound.js
  // Allow override via env.
  const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_WASM_URL as string | undefined;
  if (envUrl) return envUrl;
  return "/wasm/railbound.js";
}

async function loadScriptAsModule(url: string): Promise<EmscriptenModuleFactory> {
  // Public/wasm glue is a classic script (MODULARIZE=1 without EXPORT_ES6),
  // not an ES module. Using dynamic import() makes Vite request "/wasm/railbound.js?import"
  // which returns 500. So we directly use script tag for /wasm/* assets.
  // Keep this simple: public assets -> script tag only.
  if (url.startsWith("/wasm/")) {
    return await loadViaScriptTag(url);
  }
  try {
    const mod = await import(/* @vite-ignore */ url);
    const factory = (mod.default ?? mod.createRailboundModule) as EmscriptenModuleFactory | undefined;
    if (factory) return factory;
    throw new Error("No ESM factory export");
  } catch {
    return await loadViaScriptTag(url);
  }
}

function loadViaScriptTag(url: string): Promise<EmscriptenModuleFactory> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("No document available to load WASM glue script"));
      return;
    }
    const existing = document.querySelector(`script[data-wasm="${url}"]`) as HTMLScriptElement | null;
    if (existing && (window as unknown as { createRailboundModule?: EmscriptenModuleFactory }).createRailboundModule) {
      resolve((window as unknown as { createRailboundModule: EmscriptenModuleFactory }).createRailboundModule);
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.dataset.wasm = url;
    script.onload = () => {
      const factory = (window as unknown as { createRailboundModule?: EmscriptenModuleFactory }).createRailboundModule;
      if (factory) resolve(factory);
      else reject(new Error(`WASM glue script loaded but createRailboundModule not found (url=${url})`));
    };
    script.onerror = () => reject(new Error(`Failed to load WASM glue script: ${url}`));
    document.head.appendChild(script);
  });
}

export async function loadWasmModule(): Promise<WasmModule> {
  if (cachedModule) return cachedModule;
  if (loadingPromise) return loadingPromise;

  const url = getWasmUrl();

  loadingPromise = (async () => {
    // Check wasm binary exists (HEAD request)
    try {
      const wasmBinUrl = url.replace(/\.js$/, ".wasm");
      const head = await fetch(wasmBinUrl, { method: "HEAD" });
      if (!head.ok) {
        throw new Error(`WASM binary not found at ${wasmBinUrl} (status ${head.status}). Did you run build_wasm.sh?`);
      }
    } catch (e) {
      // If HEAD fails due to CORS or dev server, we'll try anyway and let emscripten report
      console.warn("[wasmLoader] WASM HEAD check failed (continuing):", e);
    }

    const factory = await loadScriptAsModule(url);
    // Pass locateFile to ensure .wasm is fetched from /wasm/ even if glue thinks it's at root
    const opts: EmscriptenModuleOpts = {
      locateFile: (path: string) => {
        if (path.endsWith(".wasm")) return "/wasm/" + path.split("/").pop()!;
        return path;
      },
    };
    let mod: WasmModule;
    try {
      // Try with opts first (Emscripten factory accepts Module overrides)
      mod = await (factory as unknown as (o: EmscriptenModuleOpts) => Promise<WasmModule>)(opts);
    } catch {
      // Fallback to no-opts call (placeholder or older glue)
      mod = await factory();
    }
    cachedModule = mod as WasmModule;
    lastError = null;
    console.log("[wasmLoader] WASM module loaded", mod);
    return cachedModule;
  })();

  try {
    return await loadingPromise;
  } catch (e) {
    lastError = (e as Error).message ?? String(e);
    loadingPromise = null;
    throw e;
  }
}

export function isWasmAvailable(): boolean {
  return cachedModule !== null;
}

export function getWasmLoadError(): string | null {
  return lastError;
}

export async function checkWasmAvailability(): Promise<boolean> {
  try {
    // Quick check: does /wasm/railbound.wasm exist?
    const url = getWasmUrl().replace(/\.js$/, ".wasm");
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

export function resetWasmCache(): void {
  cachedModule = null;
  loadingPromise = null;
  lastError = null;
}

/**
 * Call the WASM solver's solve_level_json C function via cwrap.
 * Returns the raw JSON string (still needs JSON.parse).
 */
export async function callWasmSolveJson(inputJson: string): Promise<string> {
  const mod = await loadWasmModule();

  // Prefer embind if available
  if (mod.solveLevelJson) {
    return mod.solveLevelJson(inputJson);
  }

  const solve = mod.cwrap("solve_level_json", "number", ["string"]) as (s: string) => number;
  const free = mod.cwrap("free_string", null, ["number"]) as (ptr: number) => void;

  const ptr = solve(inputJson);
  if (!ptr) throw new Error("WASM solve_level_json returned null");
  const result = mod.UTF8ToString(ptr);
  free(ptr);
  return result;
}

/**
 * Call WASM with progress callback (for main-thread fallback).
 * Sets the global visualize callback before solving and clears after.
 * Note: In main thread this still blocks UI, so progress won't be visible until solve ends.
 * Prefer Worker path for real-time visualization.
 */
export async function callWasmSolveJsonWithProgress(
  inputJson: string,
  onProgress: (data: unknown) => void
): Promise<string> {
  const mod = await loadWasmModule();
  const hasViz = typeof mod.setVisualizeCallback === "function";
  if (hasViz) {
    try {
      // Try to set rate from input
      let rate = 100;
      try {
        const parsed = JSON.parse(inputJson);
        rate = parsed.options?.visualize_rate ?? parsed.visualize_rate ?? 100;
      } catch {}
      if (typeof mod.setVisualizeRate === "function") {
        try { mod.setVisualizeRate!(rate); } catch {}
      }
      mod.setVisualizeCallback!(onProgress);
    } catch (e) {
      console.warn("[wasmLoader] setVisualizeCallback failed", e);
    }
  }
  try {
    if (mod.solveLevelJson) {
      return mod.solveLevelJson(inputJson);
    }
    const solve = mod.cwrap("solve_level_json", "number", ["string"]) as (s: string) => number;
    const free = mod.cwrap("free_string", null, ["number"]) as (ptr: number) => void;
    const ptr = solve(inputJson);
    if (!ptr) throw new Error("WASM solve_level_json returned null");
    const result = mod.UTF8ToString(ptr);
    free(ptr);
    return result;
  } finally {
    if (hasViz) {
      try { (mod as unknown as { clearVisualizeCallback?: () => void }).clearVisualizeCallback?.(); } catch {}
    }
  }
}
