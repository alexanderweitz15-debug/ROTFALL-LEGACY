// S15 Paket S (Nutzer: „gut gesichert und verschlüsselt, geräteübergreifend spielen“), Stufe 1 ohne Server:
// Der Spielstand wird im Browser verschlüsselt und als Datei exportiert. Der Nutzer legt sie in einen Cloud-Ordner
// (OneDrive, Google Drive, Dropbox) und importiert sie auf dem anderen Gerät mit demselben Passwort.
//
// Format .rfsave: "RFS1" | Salz (16 Byte) | IV (12 Byte) | AES-GCM-256(gzip(JSON)).
// Schlüssel: PBKDF2-SHA-256 aus dem Passwort, 600 000 Runden. Das Passwort wird nie gespeichert und nie gesendet.
// AES-GCM prüft die Echtheit: ein falsches Passwort oder eine veränderte Datei schlägt beim Entschlüsseln fehl.
const MAGIC = [0x52, 0x46, 0x53, 0x31], ITER = 600000;
export const MIN_PW = 8;

async function keyOf(pw, salt, iter = ITER) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

// Inhalt: der Spielstand und ein paar Angaben zur Kontrolle (Version, Haus, Tag, Zeitpunkt)
export async function encryptSave(json, pw, iter = ITER) {
  if (!pw || pw.length < MIN_PW) throw new Error(`Das Passwort braucht mindestens ${MIN_PW} Zeichen.`);
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const packed = await pipe(new TextEncoder().encode(JSON.stringify({ at: Date.now(), save: json })), new CompressionStream('gzip'));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyOf(pw, salt, iter), packed));
  const out = new Uint8Array(4 + 16 + 12 + ct.length); out.set(MAGIC, 0); out.set(salt, 4); out.set(iv, 20); out.set(ct, 32);
  return out;
}
export async function decryptSave(bytes, pw, iter = ITER) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 40 || MAGIC.some((b, i) => bytes[i] !== b)) throw new Error('Das ist keine Rotfall-Spielstanddatei.');
  let plain;
  try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(20, 32) }, await keyOf(pw, bytes.slice(4, 20), iter), bytes.slice(32)); }
  catch { throw new Error('Falsches Passwort oder beschädigte Datei.'); }
  const inner = JSON.parse(new TextDecoder().decode(await pipe(new Uint8Array(plain), new DecompressionStream('gzip'))));
  JSON.parse(inner.save);                                            // muss gültiges JSON sein, sonst nicht übernehmen
  return inner;
}
// Kurzinfo aus einem Spielstand-JSON, für Dateiname und Rückfrage
export function saveInfo(json) {
  try { const d = JSON.parse(json); return { house: d.legacy?.house || 'Haus', gen: d.legacy?.gen || 1, name: d.player?.name || '—', day: d.day | 0 }; }
  catch { return null; }
}
