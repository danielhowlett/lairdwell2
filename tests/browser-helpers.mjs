import { createServer } from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

export async function serveProduction() {
  const root = fileURLToPath(new URL('../public/', import.meta.url));
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(req.url.split('?')[0]);
      const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
      if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error('Outside public');
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': file.endsWith('.webp') ? 'image/webp' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.png') ? 'image/png' : file.endsWith('.webmanifest') ? 'application/manifest+json' : file.endsWith('.ico') ? 'image/x-icon' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.woff2') ? 'font/woff2' : file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain' });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise(resolve => server.close(resolve)) };
}

export async function launchBrowser(name) {
  const type = { chromium, firefox, webkit }[name];
  if (!type) throw new Error(`Unknown browser: ${name}`);
  let executablePath = process.env[`${name.toUpperCase()}_EXECUTABLE_PATH`];
  if (name === 'chromium') {
    executablePath ||= process.env.CHROMIUM_PATH;
    if (!executablePath) { try { await access('/usr/bin/chromium'); executablePath = '/usr/bin/chromium'; } catch {} }
  }
  const options = { executablePath, timeout: 20000 };
  if (name === 'chromium') options.args = ['--no-sandbox'];
  // Optional accommodation for a container that cannot create user namespaces.
  if (name === 'firefox' && process.env.FIREFOX_CONTENT_SANDBOX_LEVEL) {
    options.firefoxUserPrefs = { 'security.sandbox.content.level': Number(process.env.FIREFOX_CONTENT_SANDBOX_LEVEL) };
  }
  return type.launch(options);
}

export async function settleScroll(page) {
  await page.waitForFunction(() => {
    const state = window.__scrollSettling ||= { y: -1, stable: 0 };
    state.stable = Math.abs(scrollY - state.y) < .5 ? state.stable + 1 : 0;
    state.y = scrollY;
    return state.stable >= 8 && !document.documentElement.classList.contains('lenis-scrolling');
  }, null, { polling: 'raf', timeout: 10000 });
  await page.evaluate(() => { delete window.__scrollSettling; });
}
