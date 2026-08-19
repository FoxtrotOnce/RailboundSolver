import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    format: "es",
  },
  assetsInclude: ["**/*.wasm"],
  // WASM MIME is handled by Vite automatically for public/wasm/*.
  // No COEP/COOP needed unless using SharedArrayBuffer / threads (not used here).
  optimizeDeps: {
    exclude: ["wasm"],
  },
});
