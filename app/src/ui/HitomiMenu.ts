import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Menu Hitomi in-app untuk overlay Tauri.
 * - Tombol ikon panah (arrow.png) di pojok atas avatar (kanan/kiri sesuai preferensi).
 * - Klik → panah flip ke atas (rotate 180°) + panel menu muncul.
 * - Panel: fill ungu tua #3e2271, border pink #fab3df, teks putih, font Vividly.
 * - Isi: slider ukuran karakter, toggle sisi bubble (kanan/kiri), Keluar.
 *
 * Tembus-klik SENGAJA tidak di sini (dulu bikin menu ngunci diri) — kontrolnya via tray.
 */
const PURPLE = '#3e2271';
const PINK = '#fab3df';
const FONT = "'Vividly', system-ui, sans-serif";

type Side = 'right' | 'left';

export function mountHitomiMenu(): void {
  // Seret window dari area avatar (kanvas pointer-events:none → mousedown jatuh ke #app).
  const appEl = document.getElementById('app');
  appEl?.addEventListener('mousedown', (e) => {
    if (e.button === 0) void getCurrentWindow().startDragging();
  });

  const ui = document.createElement('div');
  ui.id = 'hitomi-ui';
  Object.assign(ui.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '10',
  });

  // --- Tombol toggle (ikon panah) ---
  const btn = document.createElement('button');
  const arrow = document.createElement('img');
  arrow.src = '/ui/arrow.png';
  arrow.alt = 'menu';
  arrow.draggable = false;
  Object.assign(arrow.style, {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    transition: 'transform .18s ease',
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.45))',
  });
  btn.appendChild(arrow);
  Object.assign(btn.style, {
    position: 'absolute',
    top: '14px',
    width: '34px',
    height: '34px',
    padding: '3px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    pointerEvents: 'auto',
  });

  // --- Panel menu ---
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'absolute',
    top: '54px',
    minWidth: '188px',
    padding: '10px',
    background: PURPLE,
    border: `2px solid ${PINK}`,
    borderRadius: '12px',
    color: '#ffffff',
    fontFamily: FONT,
    fontSize: '15px',
    lineHeight: '1.25',
    boxShadow: '0 8px 24px rgba(0,0,0,.45)',
    display: 'none',
    pointerEvents: 'auto',
    userSelect: 'none',
  });

  const rowStyle = (el: HTMLElement): void => {
    Object.assign(el.style, {
      padding: '8px 10px',
      borderRadius: '8px',
      whiteSpace: 'nowrap',
    });
  };
  const makeItem = (label: string, onClick: () => void): HTMLDivElement => {
    const it = document.createElement('div');
    it.textContent = label;
    rowStyle(it);
    it.style.cursor = 'pointer';
    it.addEventListener('mouseenter', () => (it.style.background = 'rgba(250,179,223,.22)'));
    it.addEventListener('mouseleave', () => (it.style.background = 'transparent'));
    it.addEventListener('click', onClick);
    return it;
  };

  // --- Ukuran karakter: grid tombol 1–10 (2 baris × 5) ---
  const widthForLevel = (lv: number): number => Math.round(260 + (lv - 1) * ((900 - 260) / 9));
  const savedLevel = Math.min(10, Math.max(1, Number(localStorage.getItem('hitomi.sizeLevel')) || 5));
  const sizeRow = document.createElement('div');
  rowStyle(sizeRow);
  const sizeLabel = document.createElement('div');
  sizeLabel.textContent = 'Ukuran';
  sizeLabel.style.marginBottom = '6px';
  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '5px',
  });
  const sizeButtons: HTMLButtonElement[] = [];
  const setLevel = (lv: number): void => {
    localStorage.setItem('hitomi.sizeLevel', String(lv));
    sizeButtons.forEach((b, i) => {
      const active = i + 1 === lv;
      b.style.background = active ? PINK : 'transparent';
      b.style.color = active ? PURPLE : '#ffffff';
      b.style.fontWeight = active ? '700' : '400';
    });
    void invoke('resize_overlay', { width: widthForLevel(lv) });
  };
  for (let n = 1; n <= 10; n++) {
    const b = document.createElement('button');
    b.textContent = String(n);
    Object.assign(b.style, {
      padding: '5px 0',
      border: `1.5px solid ${PINK}`,
      borderRadius: '7px',
      background: 'transparent',
      color: '#ffffff',
      fontFamily: FONT,
      fontSize: '14px',
      lineHeight: '1',
      cursor: 'pointer',
    });
    b.addEventListener('click', () => setLevel(n));
    sizeButtons.push(b);
    grid.appendChild(b);
  }
  sizeRow.append(sizeLabel, grid);

  // --- Sisi bubble (kanan/kiri) — juga memindah posisi menu sebagai preview ---
  let side: Side = (localStorage.getItem('hitomi.bubbleSide') as Side) || 'right';
  const applySide = (s: Side): void => {
    side = s;
    localStorage.setItem('hitomi.bubbleSide', s);
    btn.style.left = s === 'left' ? '16px' : '';
    btn.style.right = s === 'left' ? '' : '16px';
    panel.style.left = s === 'left' ? '16px' : '';
    panel.style.right = s === 'left' ? '' : '16px';
    sideItem.textContent = `Bubble: ${s === 'left' ? 'Kiri' : 'Kanan'}`;
  };
  const sideItem = makeItem('Bubble: Kanan', () => applySide(side === 'right' ? 'left' : 'right'));

  const quitItem = makeItem('Keluar 💔', () => void invoke('quit_app'));

  panel.append(sizeRow, sideItem, quitItem);

  // --- Buka/tutup ---
  let open = false;
  const openMenu = (): void => {
    open = true;
    panel.style.display = 'block';
    arrow.style.transform = 'rotate(180deg)';
  };
  const closeMenu = (): void => {
    open = false;
    panel.style.display = 'none';
    arrow.style.transform = 'rotate(0deg)';
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    open ? closeMenu() : openMenu();
  });
  document.addEventListener('mousedown', (e) => {
    const t = e.target as Node;
    if (open && !panel.contains(t) && !btn.contains(t)) closeMenu();
  });

  ui.append(btn, panel);
  document.body.appendChild(ui);

  // Terapkan preferensi tersimpan.
  applySide(side);
  setLevel(savedLevel);
}
