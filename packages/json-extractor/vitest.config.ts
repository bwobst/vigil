import { defineConfig } from "vitest/config";

export default defineConfig({
  clearScreen: false,
  test: {
    globals: true,
    environment: "node",
  },
});
