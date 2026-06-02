import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import purgecss from 'vite-plugin-purgecss';

export default defineConfig({
  root: 'src',
  publicDir: false,
  plugins: [
    purgecss({
      content: ['./src/**/*.html', './src/**/*.js'],
      safelist: {
        standard: [
          /^hl-/,
          /^pill-/,
          /^ac-/,
          /^ob-/,
          /^badge/,
          /^hidden$/,
          /^active$/,
          /^loading$/,
          /^ok$/,
          /^err$/,
        ],
        variables: [/^--/],
      },
    }),
    viteSingleFile(),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
});
