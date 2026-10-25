import { existsSync } from "node:fs";
import type { NextConfig } from "next";

// Detent Pro is its own private repository, checked out at src/pro. Without it, `@pro` resolves
// to src/locked and every Pro preview builds as a locked stand-in.
const pro = existsSync("src/pro/index.ts") ? "./src/pro/index.ts" : "./src/locked/index.tsx";
// Pro's routes, for the server: the live demos' AI SDK handlers. Locked, each answers 404.
const proServer = existsSync("src/pro/server.ts") ? "./src/pro/server.ts" : "./src/locked/server.ts";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    resolveAlias: {
      "@pro": pro,
      "@pro-server": proServer,
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
