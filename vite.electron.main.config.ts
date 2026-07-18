import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  build: {
    outDir: "dist-electron",
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "electron/main.ts"),
      formats: ["cjs"],
      fileName: () => "main.js",
    },
    rollupOptions: {
      external: [
        "electron",
        /^node:/,
        "dgram",
        "os",
        "crypto",
        "path",
        "fs",
      ],
      output: { dir: "dist-electron" },
    },
  },
});
