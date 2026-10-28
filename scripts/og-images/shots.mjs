// 各ラボの見どころの要素だけを切り抜いて撮る（OGP画像の素材）
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const OUT = process.argv[2];
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prof = mkdtempSync(join(tmpdir(), 'cdp-'));
const port = 9100 + Math.floor(Math.random() * 800);
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 80; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find((t) => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {} await sleep(250); }
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.result.value;
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1.5, mobile: false });
const click = (t) => `[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(t)}))?.click()`;
const slider = (sel, v) => `(()=>{const r=document.querySelector(${JSON.stringify(sel)});const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(r,${JSON.stringify(v)});r.dispatchEvent(new Event('input',{bubbles:true}));})()`;
const jobs = [
  ['home', 'http://localhost:5188/', '#bodymap .bodymap-canvas', []],
  ['proprioception', 'http://localhost:5188/lab/proprioception', '.pos-stage', []],
  ['laterality', 'http://localhost:5188/lab/laterality', '.lr-stage', []],
  ['iap', 'http://localhost:5188/lab/iap', '.iap-canvas', []],
  ['homunculus', 'http://localhost:5188/lab/homunculus', '.homu-canvas', [slider('#homunculus input[type=range]', '1')]],
  ['fascia', 'http://localhost:5188/lab/fascia', '.fascia-stage-3d', []],
  ['fascia-network', 'http://localhost:5188/lab/fascia-network', '#fascia-network .bodymap-canvas', [slider('#fascia-network input[type=range]', '0.85'), click('前屈してみる')]],
  ['breath', 'http://localhost:5188/lab/breath', '.breath-stage', []],
  ['pain', 'http://localhost:5188/lab/pain', '.pain-stage', []],
  ['nutri', 'http://localhost:5188/lab/nutri', '.nutri-stage', []],
];
for (const [name, url, sel, acts] of jobs) {
  await send('Page.navigate', { url });
  await sleep(7000);
  for (const a of acts) { await ev(a); await sleep(2500); }
  await ev(`document.documentElement.style.scrollBehavior='auto'; document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({block:'center'})`);
  await sleep(2500);
  const r = await ev(`(()=>{const b=document.querySelector(${JSON.stringify(sel)})?.getBoundingClientRect(); return b?{x:b.x+scrollX,y:b.y+scrollY,w:b.width,h:b.height}:null})()`);
  if (!r) { console.log('missing', name); continue; }
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot.result.data, 'base64'));
  console.log('shot', name, Math.round(r.w), Math.round(r.h));
}
ws.close(); proc.kill(); setTimeout(() => rmSync(prof, { recursive: true, force: true }), 1500); // 撮影用 Chrome の作業フォルダを残さない
