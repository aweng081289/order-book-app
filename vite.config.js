import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': '/src',  // Your existing alias
        },
    },
    server: {
        hmr: false,  // Disabled as before
        port: 5173,
    },
    test: {
        environment: 'jsdom',
        restoreMocks: true,
    },
    logLevel: 'info',  // Increased logging for debugging updates
});
