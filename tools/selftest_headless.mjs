/* Selbsttest ohne Bildschirm: startet ein neues Spiel in headless Chromium und ruft RF.selftest() auf.
   Aufruf:  node tools/selftest_headless.mjs [port=8000] [ausgabe.txt]
   Vorher:  python3 -m http.server 8000  (im Repo-Wurzelverzeichnis)
   Playwright und Chromium werden gesucht unter PLAYWRIGHT_MODULE / PLAYWRIGHT_CHROMIUM, sonst /opt/node-tools und /opt/pw-browsers.
   Exit-Code 0 = alle Proben grün, 1 = Fehlschläge, 2 = Spiel nicht gestartet. Der echte Spielstand wird nie berührt (frisches Profil, neue Geschichte, S._quiet). */
import fs from 'fs';
import { createRequire } from 'module';

const port = process.argv[2] || '8000';
const out = process.argv[3] || '';
const modPath = process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright';
const exe = process.env.PLAYWRIGHT_CHROMIUM || firstDir('/opt/pw-browsers', /^chromium-\d+$/, 'chrome-linux/chrome');

function firstDir(base, re, tail) {
  try { const d = fs.readdirSync(base).filter(n => re.test(n)).sort().pop(); return d ? `${base}/${d}/${tail}` : undefined; } catch { return undefined; }
}

let chromium;
try { ({ chromium } = createRequire(import.meta.url)(modPath)); }
catch { try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { console.error('Playwright nicht gefunden (PLAYWRIGHT_MODULE setzen).'); process.exit(2); } }

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on('console', m => logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', e => logs.push(`PAGEERROR: ${e.message}`));

await page.goto(`http://localhost:${port}/?dev`, { waitUntil: 'load' });
await page.waitForTimeout(2500);
if (!await page.evaluate(() => !!window.RF)) { console.error('window.RF fehlt: Modul lädt nicht (Parse-Fehler oder doppeltes const?).'); console.error(logs.slice(-10).join('\n')); await browser.close(); process.exit(2); }

await page.click('[data-act="new"]'); await page.waitForTimeout(800);
await page.click('#cr-begin'); await page.waitForTimeout(4000);
if (!await page.evaluate(() => !!(window.RF.S && window.RF.S.player))) { console.error('Kein Spiel gestartet.'); await browser.close(); process.exit(2); }

await page.evaluate(() => { window.RF.S._quiet = true; window.__st = null; setTimeout(() => { try { window.__st = RF.selftest(); } catch (e) { window.__st = ['EXC ' + e.stack]; } }, 50); });
for (let i = 0; i < 120; i++) { await page.waitForTimeout(3000); if (await page.evaluate(() => Array.isArray(window.__st))) break; }
const st = (await page.evaluate(() => window.__st)) || ['TIMEOUT'];
const fails = st.filter(s => !/^PASS/.test(s));
console.log(`Selbsttest: ${st.length} Proben, ${fails.length} nicht grün`);
fails.forEach(f => console.log('  ' + f.slice(0, 240)));
const diag = logs.filter(l => /^(warning|error): (?!Failed to load|Canvas2D)/.test(l));
if (diag.length) { console.log('--- Diagnosen (console.warn/error):'); diag.slice(0, 40).forEach(l => console.log('  ' + l.slice(0, 400))); }
if (out) fs.writeFileSync(out, st.join('\n') + '\n\n--- console ---\n' + logs.join('\n'));
await browser.close();
process.exit(fails.length ? 1 : 0);
