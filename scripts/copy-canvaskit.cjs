// Copies Skia's WebAssembly build into public/ so the web version can load it.
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'node_modules/canvaskit-wasm/bin/full/canvaskit.wasm');
const target = path.join(root, 'public/canvaskit.wasm');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log('Copied canvaskit.wasm to public/');
