import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
    ],
    resolve: {
        alias: {
            '@': '/src',  // Your existing alias
        },
    },
    server: {
        hmr: false,  // Disabled as before
        port: 5173,
    },
    logLevel: 'info',  // Increased logging for debugging updates
});