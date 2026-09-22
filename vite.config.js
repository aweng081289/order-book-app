import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import marketInsightsHandler from './api/market-insights.js';
import marketNewsHandler from './api/market-news.js';

const localApiHandlers = new Map([
    ['/api/market-news', marketNewsHandler],
    ['/api/market-insights', marketInsightsHandler],
]);

function localApiPlugin(environment) {
    return {
        name: 'local-vercel-api-functions',
        configureServer(server) {
            server.middlewares.use(async (request, response, next) => {
                const url = new URL(request.url, 'http://localhost');
                const handler = localApiHandlers.get(url.pathname);
                if (!handler) return next();

                Object.assign(process.env, environment);
                request.query = Object.fromEntries(url.searchParams);
                try {
                    request.body = await readJsonBody(request);
                    response.status = code => {
                        response.statusCode = code;
                        return response;
                    };
                    response.json = payload => {
                        response.setHeader('Content-Type', 'application/json; charset=utf-8');
                        response.end(JSON.stringify(payload));
                        return response;
                    };
                    await handler(request, response);
                } catch (error) {
                    console.error('Local API handler failed:', error);
                    if (!response.headersSent) {
                        response.statusCode = 500;
                        response.setHeader('Content-Type', 'application/json; charset=utf-8');
                    }
                    if (!response.writableEnded) response.end(JSON.stringify({ error: 'Local API request failed' }));
                }
            });
        },
    };
}

function readJsonBody(request) {
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return Promise.resolve(undefined);
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => {
            body += chunk;
            if (body.length > 1_000_000) reject(new Error('Request body is too large'));
        });
        request.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch {
                reject(new Error('Request body is not valid JSON'));
            }
        });
        request.on('error', reject);
    });
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [vue(), localApiPlugin(loadEnv(mode, process.cwd(), ''))],
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
}));
