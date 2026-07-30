/**
 * Bubble teks Hitomi (Fase 2). Menampilkan kalimat terakhir Hitomi dari transkrip
 * (dikirim hook `Stop` → `/bubble` → event Tauri `hitomi://bubble`). Auto-hilang,
 * posisi ikut preferensi sisi (`hitomi.bubbleSide`, sama dgn menu). Font Vividly.
 */
const PURPLE = '#3e2271';
const PINK = '#fab3df';
const FONT = "'Vividly', system-ui, sans-serif";

interface BubbleHooks {
  onShow?: () => void; // bubble muncul (mulai animasi "ngomong")
  onHide?: () => void; // bubble hilang (berhenti "ngomong")
}

export interface BubbleController {
  hide: () => void;
}

export async function mountHitomiBubble(hooks: BubbleHooks = {}): Promise<BubbleController> {
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
  let visible = false;

  const hide = (): void => {
    if (!visible) return;
    visible = false;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(-6px) scale(.96)';
    hooks.onHide?.();
  };

  const show = (text: string): void => {
    const side = (localStorage.getItem('hitomi.bubbleSide') as 'left' | 'right') || 'right';
    bubble.style.left = side === 'left' ? '14px' : '';
    bubble.style.right = side === 'left' ? '' : '14px';
    bubble.style.textAlign = side === 'left' ? 'left' : 'right';

    bubble.textContent = text;
    bubble.style.opacity = '1';
    bubble.style.transform = 'translateY(0) scale(1)';
    visible = true;
    hooks.onShow?.();

    if (hideTimer) clearTimeout(hideTimer);
    const dur = Math.min(16000, 4000 + text.length * 95); // cukup lama buat dibaca
    hideTimer = setTimeout(hide, dur);
  };

  const { listen } = await import('@tauri-apps/api/event');
  await listen<{ text: string }>('hitomi://bubble', (e) => show(e.payload.text));

  return { hide };
}
