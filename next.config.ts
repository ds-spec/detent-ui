import { existsSync } from "node:fs";
import type { NextConfig } from "next";

const pro = existsSync("src/pro/index.ts") ? "./src/pro/index.ts" : "./src/locked/index.tsx";
const proServer = existsSync("src/pro/server.ts") ? "./src/pro/server.ts" : "./src/locked/server.ts";
const proRegistry = existsSync(".detent/pro-registry.json") ? "./.detent/pro-registry.json" : "./src/locked/pro-registry.json";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client', 'libsql'],
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
      { source: '/ingest/array/:path*', destination: 'https://us-assets.i.posthog.com/array/:path*' },
      { source: '/ingest/:path*', destination: 'https://us.i.posthog.com/:path*' },
    ]
  },
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
