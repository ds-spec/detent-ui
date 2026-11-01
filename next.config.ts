import { existsSync } from "node:fs";
import type { NextConfig } from "next";

// Detent Pro is its own private repository, checked out at src/pro. Without it, `@pro` resolves
// to src/locked and every Pro preview builds as a locked stand-in.
const pro = existsSync("src/pro/index.ts") ? "./src/pro/index.ts" : "./src/locked/index.tsx";
// Pro's routes, for the server: the live demos' AI SDK handlers. Locked, each answers 404.
const proServer = existsSync("src/pro/server.ts") ? "./src/pro/server.ts" : "./src/locked/server.ts";
// The Pro registry, built before the site by scripts/build-pro-registry.mjs. Without it, an empty one.
const proRegistry = existsSync(".detent/pro-registry.json") ? "./.detent/pro-registry.json" : "./src/locked/pro-registry.json";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client', 'libsql'],
  // Pieces that were replaced keep their old address working.
  async redirects() {
    return [
      { source: '/components/stats', destination: '/components/metric', permanent: true },
      { source: '/components/cropper', destination: '/components', permanent: true },
      { source: '/blocks/feature-story', destination: '/blocks', permanent: true },
      { source: '/blocks/prompt-playground', destination: '/blocks', permanent: true },
      ...['feedback', 'codeblock', 'donut', 'photobar', 'hold', 'kanban', 'answer', 'scaffold', 'ask', 'images', 'signature', 'video', 'presence', 'checklist', 'secret', 'reveal', 'approval', 'chips', 'retry', 'typing', 'bars', 'waffle', 'run', 'context', 'thread', 'toolcall', 'docchat', 'time', 'versions', 'thinking', 'toasts', 'tags', 'rename', 'waitlist', 'files', 'tree', 'composer', 'meter', 'inbox', 'voice', 'undo'].map((id) => ({ source: `/components/${id}`, destination: '/components', permanent: true })),
    ]
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    resolveAlias: {
      "@pro": pro,
      "@pro-server": proServer,
      "@pro-registry": proRegistry,
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
