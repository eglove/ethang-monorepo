import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from 'path';
import { readdirSync } from 'fs';

const routesDir = resolve(import.meta.dirname, 'src/routes');

const entries = readdirSync(routesDir)
    .filter(file => file.endsWith('.tsx'))
    .reduce((acc: Record<string, string>, file) => {
      const name = file.replace(/\.(tsx)$/, '');
      acc[name] = resolve(routesDir, file);
      return acc;
    }, {});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite({}), react()],
  build: {
    rollupOptions: {
      input: entries,
    }
  }
});
