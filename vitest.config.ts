import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 🟩 CRITICAL FIX: Tell Vitest to load your setup file automatically before any test runs
    setupFiles: ["./src/tests/setup.js"],
    
    // Disables parallel file execution so database clearing hooks don't fight each other
    fileParallelism: false, 
    hookTimeout: 30000,
  },
});
