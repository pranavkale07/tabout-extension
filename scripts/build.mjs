#!/usr/bin/env node
/**
 * Build orchestrator for the TabOut extension.
 *
 * Each entry (content script, page script, popup, options) is bundled as a
 * self-contained classic IIFE script so it can be loaded directly by an MV3
 * manifest / HTML `<script src>` (no ESM, no shared chunks). Static files
 * (manifest, HTML, CSS, assets) are copied with version/target substitution,
 * mirroring the previous webpack setup.
 */
import { build } from 'vite';
import inject from '@rollup/plugin-inject';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const target = process.env.TARGET_BROWSER === 'firefox' ? 'firefox' : 'chrome';
const dev = process.argv.includes('--dev');
const outDir = resolve(root, 'dist', target);

const { version } = JSON.parse(
  fs.readFileSync(resolve(root, 'package.json'), 'utf8'),
);

/** Entry name -> source file. The output filename is `<name>.js`. */
const entries = {
  content: 'src/content/content-main.ts',
  'page-script': 'src/content/page-script.ts',
  popup: 'src/popup/popup.ts',
  options: 'src/options/options.ts',
};

// Start from a clean target directory (the other browser's build is untouched).
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const [name, input] of Object.entries(entries)) {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [inject({ browser: ['webextension-polyfill', 'default'] })],
    define: {
      'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
    },
    build: {
      outDir,
      emptyOutDir: false,
      target: 'es2020',
      minify: !dev,
      sourcemap: dev ? 'inline' : false,
      rollupOptions: {
        input: { [name]: resolve(root, input) },
        output: {
          format: 'iife',
          entryFileNames: '[name].js',
          name: `__tabout_${name.replace(/-/g, '_')}`,
          extend: true,
        },
      },
    },
  });
}

/* ---------------------------- static assets ---------------------------- */

const copy = (from, to) => fs.copyFileSync(resolve(root, from), resolve(outDir, to));

// Manifest (target-specific) with the version stamped in.
const manifestSrc = target === 'firefox' ? 'src/manifest.firefox.json' : 'src/manifest.json';
const manifest = JSON.parse(fs.readFileSync(resolve(root, manifestSrc), 'utf8'));
manifest.version = version;
fs.writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// HTML — options.html carries a {{VERSION}} placeholder.
const optionsHtml = fs
  .readFileSync(resolve(root, 'src/options/options.html'), 'utf8')
  .replace(/\{\{VERSION\}\}/g, version);
fs.writeFileSync(resolve(outDir, 'options.html'), optionsHtml);
copy('src/popup/popup.html', 'popup.html');

// CSS (plain copies, referenced by name from the HTML).
copy('src/options/options.css', 'options.css');
copy('src/popup/popup.css', 'popup.css');

// Assets directory.
fs.cpSync(resolve(root, 'src/assets'), resolve(outDir, 'assets'), { recursive: true });

console.log(`✅ Built TabOut v${version} (${target}) -> ${outDir}`);
