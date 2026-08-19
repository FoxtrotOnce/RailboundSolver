// Placeholder – overwritten by `wasm/build.sh --wasm` / `make wasm`
// This file exists so `vite build` succeeds before WASM is compiled.
// The loader in solverWasm.ts will detect the placeholder and fall back to the TS solver.
export default async function createRailboundModule() {
  throw new Error("WASM not built – run `make wasm` in wasm/ or `wasm/build.sh --wasm`");
}
export const createRailboundModuleNamed = createRailboundModule;
console.warn("[WASM] placeholder railbound_wasm.js loaded – WASM not built yet. Using TS fallback.");
