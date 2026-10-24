import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

// Writes dist/precache.json: the app shell the service worker keeps for offline use.
// Question data is not in it: the app caches only today's and tomorrow's cards.
function precacheManifest(): Plugin {
  return {
    name: 'precache-manifest',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = Object.keys(bundle).filter((f) => !/\.(woff|ttf|map)$/.test(f));
      const shell = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png', ...files];
      const version = createHash('sha1').update([...files].sort().join('|')).digest('hex').slice(0, 12);
      this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify({ version, files: shell }) });
      // sw.js must differ byte-for-byte on every deploy, or browsers keep the old offline copy
      const sw = fs.readFileSync('sw/sw.js', 'utf8');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `// build ${version}\n${sw}` });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [preact(), precacheManifest()],
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
