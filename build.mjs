import { readFile, mkdir, writeFile, cp } from 'node:fs/promises';
import { transform, build } from 'esbuild';
let html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
// Bootstrap the optional intro before first paint; no JS means no overlay exists.
const intro = await build({ entryPoints: ['preloader/index.js'], bundle: true, minify: true, write: false, target: 'es2020', legalComments: 'eof' });
html = html.replace('<!-- preloader:bootstrap -->', `<script data-purpose="brand-preloader">${intro.outputFiles[0].text}</script>`);
// Minify embedded code without rewriting HTML, SVG, or shader template strings.
for (const [tag, loader] of [['style', 'css'], ['script', 'js']]) {
  const pattern = new RegExp(`(<${tag}\\b[^>]*>)([\\s\\S]*?)(</${tag}>)`, 'gi');
  const matches = [...html.matchAll(pattern)];
  for (const match of matches.reverse()) {
    const { code } = await transform(match[2], { loader, minify: true, legalComments: 'inline', target: 'es2020' });
    html = html.slice(0, match.index) + match[1] + code + match[3] + html.slice(match.index + match[0].length);
  }
}
await mkdir(new URL('./public/', import.meta.url), { recursive: true });
await writeFile(new URL('./public/index.html', import.meta.url), html);
await cp(new URL('./assets/', import.meta.url), new URL('./public/assets/', import.meta.url), { recursive: true });
await writeFile(new URL('./public/_headers', import.meta.url), '/\n  Cache-Control: public, max-age=0, must-revalidate\n/index.html\n  Cache-Control: public, max-age=0, must-revalidate\n/assets/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log(`Built public/index.html (${Buffer.byteLength(html)} bytes)`);

await build({ entryPoints: ['motion/index.js'], bundle: true, minify: true, outfile: 'public/assets/motion.js', target: 'es2020', legalComments: 'eof' });
