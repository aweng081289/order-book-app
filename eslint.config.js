import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfig([
    {
        name: 'app/files-to-lint',
        files: ['**/*.{js,mjs,jsx,vue}'],
    },

    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },

    {
        ignores: [
            "tailwind.config.js",     // Ignore Tailwind config to fix 'module' error
            "postcss.config.js",      // If you have this
            "vite.config.js",         // Optional: Ignore Vite config
            "dist/",                  // Ignore build output
            "node_modules/"           // Standard ignore
        ]
    },

    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    skipFormatting,
])