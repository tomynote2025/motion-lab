import { spawn } from 'node:child_process';
import { rmSync, writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [dir, out] = process.argv.slice(2);
const ids = JSON.parse(readFileSync(`${dir}/hooks.json`, 'utf8')).map((h) => h.id);
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prof = mkdtempSync(join(tmpdir(), 'cdp-'));
const port = 9100 + Math.floor(Math.random() * 800);
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 80; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(250); }
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
for (const lid of ids) {
  await send('Page.navigate', { url: `http://localhost:5188/__og/og-${lid}.html` });
  await sleep(2500);
  await send('Runtime.evaluate', { expression: 'Promise.race([document.fonts.ready, new Promise(r=>setTimeout(r,4000))])', awaitPromise: true });
  await sleep(500);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${out}/${lid}.png`, Buffer.from(r.result.data, 'base64'));
  console.log('og', lid);
}
ws.close(); proc.kill(); setTimeout(() => rmSync(prof, { recursive: true, force: true }), 1500); // 撮影用 Chrome の作業フォルダを残さない
