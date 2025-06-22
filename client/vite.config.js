import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(),
        svgr({
            svgrOptions: {
                icon: true,
                svgo: true,
                svgoConfig: {
                    plugins: [
                        { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
                        'removeXMLNS'
                    ],
                },
            },
        }),
    ],
    optimizeDeps: {
        exclude: [
            '@radix-ui/react-*',
            'vaul',
            'cmdk',
            'embla-carousel-react'
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@assets': path.resolve(__dirname, './src/assets'),
            '@lib': path.resolve(__dirname, './src/lib'),
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
