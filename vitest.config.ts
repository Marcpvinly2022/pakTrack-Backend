import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // loadEnv.js MUST come first: it loads .env.test (override) before
    // setup.js imports config/database.js, which reads the DB URL at import time.
    setupFiles: ["./src/tests/loadEnv.js", "./src/tests/setup.js"],
    
    // Disables parallel file execution so database clearing hooks don't fight each other
    fileParallelism: false, 
    hookTimeout: 30000,
  },
});
