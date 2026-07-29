/**
 * Bubble teks Hitomi (Fase 2). Menampilkan kalimat terakhir Hitomi dari transkrip
 * (dikirim hook `Stop` → `/bubble` → event Tauri `hitomi://bubble`). Auto-hilang,
 * posisi ikut preferensi sisi (`hitomi.bubbleSide`, sama dgn menu). Font Vividly.
 */
const PURPLE = '#3e2271';
const PINK = '#fab3df';
const FONT = "'Vividly', system-ui, sans-serif";

export async function mountHitomiBubble(): Promise<void> {
  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'fixed',
    top: '56px', // di bawah tombol menu (yang di top:14)
    maxWidth: '260px',
    padding: '11px 14px',
    background: PURPLE,
    border: `2px solid ${PINK}`,
    borderRadius: '16px',
    color: '#ffffff',
    fontFamily: FONT,
    fontSize: '15px',
    lineHeight: '1.35',
    boxShadow: '0 8px 24px rgba(0,0,0,.45)',
    pointerEvents: 'none',
    zIndex: '11',
    opacity: '0',
    transform: 'translateY(-6px) scale(.96)',
    transition: 'opacity .22s ease, transform .22s ease',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  });
  document.body.appendChild(bubble);

  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const show = (text: string): void => {
    const side = (localStorage.getItem('hitomi.bubbleSide') as 'left' | 'right') || 'right';
    bubble.style.left = side === 'left' ? '14px' : '';
    bubble.style.right = side === 'left' ? '' : '14px';
    bubble.style.textAlign = side === 'left' ? 'left' : 'right';

    bubble.textContent = text;
    bubble.style.opacity = '1';
    bubble.style.transform = 'translateY(0) scale(1)';

    if (hideTimer) clearTimeout(hideTimer);
    const dur = Math.min(9000, 2600 + text.length * 45); // makin panjang, makin lama
    hideTimer = setTimeout(() => {
      bubble.style.opacity = '0';
      bubble.style.transform = 'translateY(-6px) scale(.96)';
    }, dur);
  };

  const { listen } = await import('@tauri-apps/api/event');
  await listen<{ text: string }>('hitomi://bubble', (e) => show(e.payload.text));
}
