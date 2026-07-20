// J.A.R.V.I.S. server — ponte tra il frontend e gli agenti Claude Code del vault.
// Avvio:  node "90 Sistema/Jarvis/server.js"   (dalla root del vault, o doppio click su avvia-jarvis.bat)
// Poi apri http://127.0.0.1:8765
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT) || 8766;
// In locale gira su 127.0.0.1; su un server (Railway) impostare JARVIS_PUBLIC=1 (o c'è RAILWAY_ENVIRONMENT) per ascoltare su 0.0.0.0.
const HOST = process.env.HOST || ((process.env.RAILWAY_ENVIRONMENT || process.env.JARVIS_PUBLIC) ? '0.0.0.0' : '127.0.0.1');
// Se JARVIS_PASSWORD è impostata, tutte le richieste NON locali richiedono la password (HTTP Basic: utente qualsiasi).
const JARVIS_PASSWORD = process.env.JARVIS_PASSWORD || '';
// Gestionale SvaPro: base URL e token (Sanctum) per il proxy in sola lettura. Il token vive SOLO qui, mai nel vault.
const SVAPRO_API_URL = (process.env.SVAPRO_API_URL || 'https://quisvapo.app').replace(/\/+$/, '');
const SVAPRO_API_TOKEN = process.env.SVAPRO_API_TOKEN || '';
// Sul server (container) i permessi interattivi non esistono: con JARVIS_SKIP_PERMISSIONS=1
// il CLI gira senza chiedere conferme (serve anche IS_SANDBOX=1 se il processo è root).
const SKIP_PERMISSIONS = process.env.JARVIS_SKIP_PERMISSIONS === '1';
// Voce neurale cloud (opzionale, per il server dove Voicebox non esiste): ElevenLabs.
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID || '';
const JARVIS_DIR = __dirname;
const VAULT_ROOT = path.resolve(__dirname, '..', '..');
const AGENTS_DIR = path.join(VAULT_ROOT, '.claude', 'agents');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function readAgents() {
  try {
    return fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md')).map(f => {
      const txt = fs.readFileSync(path.join(AGENTS_DIR, f), 'utf8');
      const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const meta = {};
      if (m) m[1].split(/\r?\n/).forEach(l => { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
      return { id: meta.name || f.replace('.md', ''), desc: (meta.description || '').slice(0, 140) };
    });
  } catch (e) { return []; }
}

// Avvia il CLI claude in modo cross-platform (Windows in locale, Linux su Railway).
function spawnClaude(cliArgs) {
  if (process.platform === 'win32') return spawn('cmd.exe', ['/s', '/c', 'claude', ...cliArgs], { cwd: VAULT_ROOT, windowsHide: true });
  return spawn('claude', cliArgs, { cwd: VAULT_ROOT });
}

function permissionArgs() {
  return SKIP_PERMISSIONS ? ['--dangerously-skip-permissions'] : ['--permission-mode', 'acceptEdits'];
}

function runClaude(agent, message, fresh, res) {
  const args = ['-p', '--output-format', 'text', ...permissionArgs()];
  if (!fresh) args.push('--continue');
  const prompt = buildPrompt(agent, message);

  const child = spawnClaude(args);
  let out = '', err = '';
  const timer = setTimeout(() => { child.kill(); }, 10 * 60 * 1000);
  child.stdout.on('data', d => out += d);
  child.stderr.on('data', d => err += d);
  child.on('close', code => {
    clearTimeout(timer);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (code === 0) res.end(JSON.stringify({ ok: true, reply: out.trim() }));
    else res.end(JSON.stringify({ ok: false, reply: (err || out || 'Errore sconosciuto').trim() + '\n\nSuggerimento: se è la prima volta, apri un terminale nella cartella del vault ed esegui "claude" una volta per fare il login.' }));
  });
  child.stdin.write(prompt, 'utf8');
  child.stdin.end();
}

function vaultApiConfig() {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(VAULT_ROOT, '.obsidian', 'plugins', 'obsidian-local-rest-api', 'data.json'), 'utf8'));
    if (d.apiKey && d.enableInsecureServer) return { base: `http://127.0.0.1:${d.insecurePort || 27123}`, key: d.apiKey };
  } catch (e) {}
  return null;
}

async function proxyVault(req, res, url) {
  const cfgV = vaultApiConfig();
  if (!cfgV) { res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end('{"error":"Local REST API non configurata (attiva il server HTTP nel plugin)"}'); }
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    try {
      const r = await fetch(cfgV.base + url.slice(4), {
        method: req.method,
        headers: { 'Authorization': 'Bearer ' + cfgV.key, 'Content-Type': req.headers['content-type'] || 'text/markdown' },
        body: chunks.length ? Buffer.concat(chunks) : undefined
      });
      const body = Buffer.from(await r.arrayBuffer());
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json' });
      res.end(body);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Vault non raggiungibile: Obsidian è aperto?' }));
    }
  });
}

// ---- Gestionale SvaPro: proxy in SOLA LETTURA verso le API dei report ----
// Gli agenti (e il frontend) chiamano /api/gestionale/<endpoint> e il server inoltra a
// SVAPRO_API_URL/api/<endpoint> aggiungendo il token. Solo GET, solo endpoint di lettura.
const GESTIONALE_ALLOW = ['reports/', 'daily-reports', 'stores', 'dashboard'];
function proxyGestionale(req, res, rawUrl) {
  const rest = rawUrl.slice('/api/gestionale/'.length);
  const clean = decodeURIComponent(rest.split('?')[0]).replace(/^\/+/, '');
  const json = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  if (req.method !== 'GET') return json(405, { error: 'Solo GET: da qui il gestionale è in sola lettura.' });
  if (!clean || clean.includes('..') || !GESTIONALE_ALLOW.some(p => clean === p.replace(/\/$/, '') || clean.startsWith(p))) {
    return json(403, { error: 'Endpoint non consentito. Consentiti: ' + GESTIONALE_ALLOW.join(', ') });
  }
  if (!SVAPRO_API_TOKEN) return json(503, { error: 'SVAPRO_API_TOKEN non impostato: definisci la variabile d\'ambiente con un token API del gestionale (mai nel vault).' });
  fetch(`${SVAPRO_API_URL}/api/${rest}`, {
    headers: { 'Authorization': 'Bearer ' + SVAPRO_API_TOKEN, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(60000)
  }).then(async r => {
    const body = Buffer.from(await r.arrayBuffer());
    res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json' });
    res.end(body);
  }).catch(e => json(502, { error: 'Gestionale non raggiungibile: ' + String(e.message || e) }));
}

// ---- Voicebox (https://github.com/jamiepine/voicebox) — voce neurale locale, opzionale ----
const VOICEBOX = 'http://127.0.0.1:17493';

const WHISPER_MODEL = 'whisper-small';
let whisperState = 'unknown'; // unknown | ready | downloading | missing | offline

async function checkWhisper(autoDownload) {
  try {
    const st = await (await fetch(VOICEBOX + '/models/status', { signal: AbortSignal.timeout(3000) })).json();
    const w = (st.models || []).find(m => m.model_name === WHISPER_MODEL);
    if (w && w.downloaded) { whisperState = 'ready'; return whisperState; }
    if (w && w.downloading) { whisperState = 'downloading'; return whisperState; }
    if (autoDownload) {
      await fetch(VOICEBOX + '/models/download', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: WHISPER_MODEL })
      });
      console.log(`  Download di ${WHISPER_MODEL} avviato in Voicebox (dettatura pronta tra qualche minuto)…`);
      whisperState = 'downloading';
    } else whisperState = 'missing';
  } catch (e) { whisperState = 'offline'; }
  return whisperState;
}

// ---- ElevenLabs: voce neurale cloud (usata quando c'è ELEVENLABS_API_KEY, es. su Railway) ----
let elVoicesCache = null;
async function elVoices() {
  if (elVoicesCache) return elVoicesCache;
  const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': ELEVEN_KEY }, signal: AbortSignal.timeout(8000) });
  const d = await r.json();
  elVoicesCache = (d.voices || []).map(v => ({ id: v.voice_id, name: v.name }));
  return elVoicesCache;
}
async function elSpeak(text, profile) {
  const voices = await elVoices().catch(() => []);
  let vid = ELEVEN_VOICE;
  if (profile) { const m = voices.find(v => (v.name || '').toLowerCase() === String(profile).toLowerCase()); if (m) vid = m.id; }
  if (!vid && voices.length) vid = voices[0].id;
  if (!vid) throw new Error('nessuna voce ElevenLabs disponibile');
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
    signal: AbortSignal.timeout(60000)
  });
  if (!r.ok) throw new Error('ElevenLabs ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return { buf: Buffer.from(await r.arrayBuffer()), type: 'audio/mpeg' };
}

async function voiceStatus(res) {
  if (ELEVEN_KEY) {
    const profiles = (await elVoices().catch(() => [])).map(v => v.name);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    // ttsOnly: il server genera l'audio ma non può riprodurlo (niente casse): lo suona il browser.
    return res.end(JSON.stringify({ available: true, ttsOnly: true, profiles, whisper: 'offline' }));
  }
  try {
    const r = await fetch(VOICEBOX + '/profiles', { signal: AbortSignal.timeout(1500) });
    const d = await r.json();
    const profiles = (Array.isArray(d) ? d : (d.profiles || [])).map(p => (typeof p === 'string' ? p : (p.name || p.id))).filter(Boolean);
    if (whisperState !== 'ready') await checkWhisper(true);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ available: true, profiles, whisper: whisperState }));
  } catch (e) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ available: false, profiles: [], whisper: 'offline' }));
  }
}

function voiceTranscribe(req, res) {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    try {
      if (whisperState !== 'ready') {
        const s = await checkWhisper(true);
        if (s !== 'ready') {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ ok: false, reason: s }));
        }
      }
      const audio = new Blob([Buffer.concat(chunks)], { type: req.headers['content-type'] || 'audio/webm' });
      let out = null;
      for (const field of ['file', 'audio']) {
        const fd = new FormData();
        fd.append(field, audio, 'dettato.webm');
        fd.append('language', 'it');
        fd.append('model', WHISPER_MODEL.replace('whisper-', '')); // l'API vuole solo la taglia: base|small|medium|large|turbo
        const r = await fetch(VOICEBOX + '/transcribe', { method: 'POST', body: fd, signal: AbortSignal.timeout(120000) });
        if (r.ok) { out = await r.json(); break; }
        if (r.status !== 422 && r.status !== 400) { out = { _err: r.status }; break; }
      }
      const text = out && (out.text || out.transcript || out.transcription || (out.result && out.result.text));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(text ? { ok: true, text } : { ok: false, reason: 'trascrizione vuota', detail: out }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, reason: 'errore', detail: String(e.message || e) }));
    }
  });
}

function voiceSpeak(req, res) {
  let body = '';
  req.on('data', d => body += d);
  req.on('end', async () => {
    try {
      const { text, profile } = JSON.parse(body || '{}');
      if (ELEVEN_KEY) {
        // Il server non ha casse: segnala al frontend di usare /api/tts e riprodurre lui l'audio.
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, ttsOnly: true }));
      }
      const payload = { text, language: 'it', profile: profile || 'Jarvis' };
      const r = await fetch(VOICEBOX + '/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Voicebox-Client-Id': 'jarvis' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000)
      });
      res.writeHead(r.ok ? 200 : 502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: r.ok }));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Voicebox non raggiungibile' }));
    }
  });
}

// ---- Chat in STREAMING (SSE): il testo arriva token per token mentre Claude lavora ----
const STYLE = `STILE DELLA RISPOSTA (obbligatorio): prima indaga in silenzio usando gli strumenti, POI scrivi SOLO la risposta finale in italiano. VIETATO scrivere frasi di processo tipo "delego all'agente", "sto recuperando i dati", "ti aggiorno appena ha finito": l'utente deve leggere solo il risultato. La PRIMA riga della risposta è UNA frase discorsiva e naturale, come la direbbe un assistente a voce al suo capo (cifre arrotondate all'euro, niente simboli, niente markdown, tono professionale e diretto); poi riga vuota e i dettagli con numeri precisi e tabella se serve. Sii VELOCE: il minor numero di chiamate/strumenti possibile. Se un dato non è recuperabile, spiega in UNA frase cosa manca e cosa serve.`;

function buildPrompt(agent, message) {
  return agent && agent !== 'auto'
    ? `Usa l'agente "${agent}" (subagent definito in .claude/agents/${agent}.md) per questo compito e riporta il suo risultato.\n${STYLE}\n\nDomanda dell'utente:\n${message}`
    : `${STYLE}\n\n${message}`;
}

function chatStream(req, res) {
  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    let agent, message, fresh;
    try { ({ agent, message, fresh } = JSON.parse((body || '{}').replace(/^﻿/, ''))); } catch (e) { res.writeHead(400); return res.end(); }
    if (!message || !message.trim()) { res.writeHead(400); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    const send = o => res.write('data: ' + JSON.stringify(o) + '\n\n');
    const args = ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', ...permissionArgs()];
    if (!fresh) args.push('--continue');
    const child = spawnClaude(args);
    let buf = '', full = '', deltaSeen = false, err = '';
    const timer = setTimeout(() => child.kill(), 15 * 60 * 1000);
    child.stdout.on('data', d => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line) continue;
        let evt; try { evt = JSON.parse(line); } catch (e) { continue; }
        if (evt.type === 'stream_event') {
          const ev = evt.event || {};
          if (ev.type === 'content_block_delta' && ev.delta && ev.delta.text) {
            deltaSeen = true; full += ev.delta.text; send({ t: 'delta', text: ev.delta.text });
          }
        } else if (evt.type === 'assistant' && evt.message && Array.isArray(evt.message.content)) {
          evt.message.content.filter(c => c.type === 'tool_use').forEach(c => send({ t: 'tool', name: c.name }));
          const txt = evt.message.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
          if (txt && !deltaSeen) { full += (full ? '\n' : '') + txt; send({ t: 'msg', text: txt }); }
          deltaSeen = false;
        } else if (evt.type === 'result' && evt.result && !full) {
          full = evt.result;
        }
      }
    });
    child.stderr.on('data', d => err += d);
    child.on('close', code => {
      clearTimeout(timer);
      send({ t: 'done', ok: code === 0, full: full || (code !== 0 ? (err.trim() || 'Errore: sei loggato? Esegui "claude" nel terminale una volta.') : '') });
      res.end();
    });
    child.stdin.write(buildPrompt(agent, message.trim()), 'utf8');
    child.stdin.end();
    // NB: req.on('close') scatta appena il body è ricevuto (ucciderebbe subito Claude);
    // res 'close' invece segnala la vera disconnessione del client.
    res.on('close', () => { try { child.kill(); } catch (e) {} });
  });
}

// ---- TTS "a file": genera l'audio con Voicebox e lo restituisce al browser,
// che lo riproduce con timing esatto (testo sincronizzato alla voce) ----
async function resolveProfileId(name) {
  const r = await fetch(VOICEBOX + '/profiles', { signal: AbortSignal.timeout(3000) });
  const d = await r.json();
  const arr = Array.isArray(d) ? d : (d.profiles || []);
  const want = (name || 'Jarvis').toLowerCase();
  const p = arr.find(x => (x.name || '').toLowerCase() === want) || arr.find(x => (x.name || '').toLowerCase() === 'jarvis') || arr[0];
  return p && p.id;
}

function ttsRoute(req, res) {
  let body = '';
  req.on('data', d => body += d);
  req.on('end', async () => {
    try {
      const { text, profile } = JSON.parse((body || '{}').replace(/^﻿/, ''));
      if (!text || !text.trim()) throw new Error('testo vuoto');
      if (ELEVEN_KEY) {
        const audio = await elSpeak(text, profile);
        res.writeHead(200, { 'Content-Type': audio.type, 'Cache-Control': 'no-store' });
        return res.end(audio.buf);
      }
      const pid = await resolveProfileId(profile);
      if (!pid) throw new Error('nessun profilo vocale');
      const g = await (await fetch(VOICEBOX + '/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Voicebox-Client-Id': 'jarvis' },
        body: JSON.stringify({ text, profile_id: pid, language: 'it', engine: 'kokoro' })
      })).json();
      if (!g.id) throw new Error(g.detail || 'generazione rifiutata');
      // attendi che l'audio sia pronto (poll diretto sull'endpoint audio)
      let audio = null;
      for (let i = 0; i < 120; i++) {
        const a = await fetch(VOICEBOX + '/audio/' + g.id).catch(() => null);
        if (a && a.ok) {
          const buf = Buffer.from(await a.arrayBuffer());
          if (buf.length > 500) { audio = { buf, type: a.headers.get('content-type') || 'audio/wav' }; break; }
        }
        await new Promise(r => setTimeout(r, 400));
      }
      if (!audio) throw new Error('audio non pronto');
      res.writeHead(200, { 'Content-Type': audio.type, 'Cache-Control': 'no-store' });
      res.end(audio.buf);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  });
}

// Richieste dal loopback (gli agenti claude che girano sulla stessa macchina/container) passano senza password.
function isLoopback(req) {
  const a = req.socket.remoteAddress || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}
function checkAuth(req) {
  if (!JARVIS_PASSWORD || isLoopback(req)) return true;
  const h = req.headers['authorization'] || '';
  if (!h.startsWith('Basic ')) return false;
  try {
    const dec = Buffer.from(h.slice(6), 'base64').toString('utf8');
    return dec.slice(dec.indexOf(':') + 1) === JARVIS_PASSWORD;
  } catch (e) { return false; }
}

const server = http.createServer((req, res) => {
  if (!checkAuth(req)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Jarvis Quisvapo"', 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Autenticazione richiesta');
  }
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url.startsWith('/api/gestionale/')) return proxyGestionale(req, res, req.url);
  if (url === '/api/tts' && req.method === 'POST') return ttsRoute(req, res);
  if (url === '/api/chat-stream' && req.method === 'POST') return chatStream(req, res);
  if (url === '/api/voice-status') return voiceStatus(res);
  if (url === '/api/transcribe' && req.method === 'POST') return voiceTranscribe(req, res);
  if (url === '/api/speak' && req.method === 'POST') return voiceSpeak(req, res);
  if (url.startsWith('/api/vault/')) return proxyVault(req, res, req.url.split('?')[0]);
  if (url === '/api/agents') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(readAgents()));
  }
  if (url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const { agent, message, fresh } = JSON.parse(body || '{}');
        if (!message || !message.trim()) { res.writeHead(400); return res.end('{"ok":false,"reply":"messaggio vuoto"}'); }
        runClaude(agent, message.trim(), !!fresh, res);
      } catch (e) { res.writeHead(400); res.end('{"ok":false,"reply":"richiesta non valida"}'); }
    });
    return;
  }

  // static files (solo dalla cartella Jarvis)
  let file = url === '/' ? '/index.html' : url;
  const full = path.join(JARVIS_DIR, path.normalize(file));
  if (!full.startsWith(JARVIS_DIR) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`\n  J.A.R.V.I.S. online → http://${HOST === '0.0.0.0' ? '0.0.0.0' : '127.0.0.1'}:${PORT}\n  Vault: ${VAULT_ROOT}\n  Agenti trovati: ${readAgents().map(a => a.id).join(', ') || 'nessuno'}\n  Gestionale: ${SVAPRO_API_TOKEN ? SVAPRO_API_URL + ' (token OK)' : 'token NON impostato (SVAPRO_API_TOKEN)'} · Password: ${JARVIS_PASSWORD ? 'attiva' : 'no'}\n`);
  checkWhisper(true); // prepara la dettatura Whisper se Voicebox è aperto
});
