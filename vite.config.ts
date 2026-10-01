import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command, mode }) => {
  // Server routes read DATABASE_URL from process.env; in dev it comes from .env.local.
  const env = loadEnv(mode, process.cwd(), "");
  process.env["DATABASE_URL"] ??= env["DATABASE_URL"];

  return {
    server: { port: 8080 },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // Route TanStack Start's server entry through src/server.ts (our SSR error wrapper).
        server: { entry: "server" },
        // Keep server-only modules out of the client bundle.
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      // Nitro produces the deployable server bundle (.output/) at build time; Node by default.
      ...(command === "build" ? [nitro()] : []),
      viteReact(),
    ],
  };
});
