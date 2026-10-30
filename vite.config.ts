import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import vinext from "vinext";
import { staticAssetsAdapter } from "@vinext/cloudflare/cache/static-assets-adapter";
import { cloudflare } from "@cloudflare/vite-plugin";

const ogInWorker = {
  name: "detent:og-in-worker",
  enforce: "pre" as const,
  load(id: string) {
    if (id.split("?")[0].endsWith("/src/site/og.tsx")) return readFileSync("src/site/og-worker.ts", "utf8");
  },
};

export default defineConfig({
  plugins: [
    ogInWorker,
    vinext({ prerender: true, cache: { cdn: staticAssetsAdapter() } }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
