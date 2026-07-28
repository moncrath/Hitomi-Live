#!/usr/bin/env node
// Hook Claude Code -> POST event ke bridge Hitomi.
// Dipakai dari settings.json, mis:  node hooks/notify.mjs PreToolUse
// Nama event bisa via argumen (menang) atau dari stdin JSON hook (hook_event_name).
//
// Prinsip: FIRE-AND-FORGET. Cepat, timeout pendek, dan SELALU exit 0 —
// jangan pernah blokir/gagalkan Claude Code walau bridge mati.

const BRIDGE = process.env.HITOMI_BRIDGE_URL ?? 'http://127.0.0.1:17872/event';

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

function readStdin(timeoutMs = 150) {
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
      if (data.length > 65536) finish();
    });
    process.stdin.on('end', finish);
    process.stdin.on('error', finish);
    setTimeout(finish, timeoutMs);
  });
}

async function main() {
  let name = process.argv[2];
  if (!name) {
    const raw = await readStdin();
    try {
      const j = JSON.parse(raw);
      name = j.hook_event_name ?? j.hookEventName;
    } catch {
      /* stdin bukan JSON -> abaikan */
    }
  }

  const mapped = name && EVENT_MAP[name];
  if (!mapped) return; // hook tak dipetakan -> diam

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 400);
  try {
    await fetch(BRIDGE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'event', name: mapped }),
      signal: ac.signal,
    });
  } catch {
    /* bridge mati/timeout -> diam */
  } finally {
    clearTimeout(t);
  }
}

main().finally(() => process.exit(0));
