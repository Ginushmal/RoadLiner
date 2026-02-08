import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve: {
    alias: {
      "react-dom/server": "react-dom/server.node",
    },
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
