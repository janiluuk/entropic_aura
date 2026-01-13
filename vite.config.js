import { fileURLToPath, URL } from "node:url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from 'path'
import vue from "@vitejs/plugin-vue";
import dotenv from "dotenv";
import { defineConfig, loadEnv } from "vite";

dotenv.config(); // load env vars from .env

// https://vitejs.dev/config/
export default ({ mode }) => {
  // export default defineConfig(() => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const env = loadEnv(mode, process.cwd(), "");

  return defineConfig({
    plugins: [
      vue(),
      viteStaticCopy({
        targets: [
          {
            src: path.join(
              __dirname,
              "node_modules",
              "mediainfo.js",
              "dist",
              "MediaInfoModule.wasm"
            ),
            dest: "",
          },
        ],
      }),
    ],
    define: {
      "process.env": env,
      __VALUE__: `"${process.env.VALUE}"`, // wrapping in "" since it's a string
    },
    
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Proxy API requests to backend server
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
      cors: { origin: "*" },

      //    		open: true,
      //    		origin: 'http://localhost:8080/',
      headers: {
//        "Cross-Origin-Embedder-Policy": "require-corp",
//        "Cross-Origin-Opener-Policy": "same-origin",
//        "Cross-Origin-Resource-Policy": "cross-origin",
        "Access-Control-Allow-Origin": "*",
      },
    },
  });
};
