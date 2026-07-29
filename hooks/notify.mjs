#!/usr/bin/env node
// Hook Claude Code -> POST event ke bridge Hitomi (in-process di overlay).
// Dipakai dari settings: node hooks/notify.mjs PreToolUse
// Pada Stop: juga baca transkrip .jsonl -> kalimat terakhir Hitomi -> POST /bubble.
//
// Prinsip: FIRE-AND-FORGET. Cepat, timeout pendek, SELALU exit 0 —
// jangan pernah blokir/gagalkan Claude Code walau bridge mati.

import { readFileSync, statSync } from 'node:fs';

const BRIDGE = process.env.HITOMI_BRIDGE_URL ?? 'http://127.0.0.1:17872';

// Peta nama hook Claude Code -> nama event manifest overlay.
const EVENT_MAP = {
  SessionStart: 'SessionStart',
  UserPromptSubmit: 'UserPromptSubmit',
  PreToolUse: 'PreToolUse',
  PostToolUse: 'PostToolUse',
  Notification: 'Notification',
  Stop: 'Stop',
  SubagentStop: 'Stop',
};

function readStdin(timeoutMs = 200) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve(data);
      }
    };
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => {
      data += c;
      if (data.length > 262144) finish();
    });
    process.stdin.on('end', finish);
    process.stdin.on('error', finish);
    setTimeout(finish, timeoutMs);
  });
}

function parseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function post(path, body) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 400);
  return fetch(BRIDGE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ac.signal,
  })
    .catch(() => {})
    .finally(() => clearTimeout(t));
}

/** Ambil kalimat terakhir "Hitomi" (assistant terakhir yang ada teksnya) dari transkrip. */
function extractBubble(transcriptPath) {
  try {
    const st = statSync(transcriptPath);
    if (!st.isFile() || st.size > 25 * 1024 * 1024) return null;
    const lines = readFileSync(transcriptPath, 'utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line) continue;
      const o = parseJson(line);
      const msg = o?.message;
      if (!msg || msg.role !== 'assistant' || !Array.isArray(msg.content)) continue;
      const text = msg.content
        .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
        .map((b) => b.text)
        .join(' ')
        .trim();
      if (!text) continue;
      return cleanSentence(text);
    }
  } catch {
    /* transkrip tak terbaca -> tanpa bubble */
  }
  return null;
}

/** Bersihkan markdown ringan + ambil kalimat terakhir, batasi panjang. */
function cleanSentence(raw) {
  const t = raw
    .replace(/```[\s\S]*?```/g, ' ') // blok kode
    .replace(/`([^`]*)`/g, '$1') // inline code
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // link -> teks
    .replace(/[*_#>]/g, '') // penekanan/heading md
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return null;
  const parts = t.split(/(?<=[.!?…])\s+/).filter(Boolean);
  let s = parts.length ? parts[parts.length - 1] : t;
  if (s.length > 180) s = s.slice(0, 180).trim() + '…';
  return s;
}

async function main() {
  const argvName = process.argv[2];
  let name = argvName;
  let hook = null;

  if (!name) {
    hook = parseJson(await readStdin());
    name = hook?.hook_event_name ?? hook?.hookEventName;
  }
  const mapped = name && EVENT_MAP[name];
  if (!mapped) return;

  const tasks = [post('/event', { kind: 'event', name: mapped })];

  // Hanya pada Stop asli (bukan SubagentStop) tampilkan bubble kalimat terakhir.
  if (name === 'Stop') {
    if (!hook) hook = parseJson(await readStdin());
    const path = hook?.transcript_path ?? hook?.transcriptPath;
    if (path) {
      const text = extractBubble(path);
      if (text) tasks.push(post('/bubble', { text }));
    }
  }

  await Promise.all(tasks);
}

main().finally(() => process.exit(0));
