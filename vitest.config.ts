import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    server: {
      deps: {
        // Load the built bundles with Node's own loader, as consumers do,
        // instead of transforming them through Vite. Match the bundle files
        // only: a bare /dist/ would also match a checkout under a "dist" folder
        // and externalize the TypeScript sources.
        external: [/[\\/]dist[\\/]validate\.(?:mjs|cjs|umd\.js)$/]
      }
    }
  }
});
