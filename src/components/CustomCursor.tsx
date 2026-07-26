import { useEffect, useRef } from 'react';

/**
 * カスタムカーソル(LP雛形 準拠)
 * - 小さなドットはマウスに即追従
 * - リングは係数0.16で遅れて滑らかに追従
 * - リンク・ボタン等の上に来るとリングが拡大し、内側に薄い緑が入る
 * - タッチ端末(pointer:fine でない) と「視差を減らす」設定時は無効
 */

/** ホバー時に拡大させたい要素 */
const HOT_SELECTOR =
  'a, button, input, select, label, [role="tab"], [data-cursor], .chip, .post-card, .article-link';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // マウス環境(ホバーができる精密ポインタ)のみ有効。タッチ端末では既定のまま
    const isMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isMouse || reduce) return;

    document.body.classList.add('has-custom-cursor');

    const dot = dotRef.current;
    const ring = ringRef.current;
    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let hot = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot) {
        dot.style.opacity = '1';
        dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
      }
      if (ring) ring.style.opacity = '1';

      const target = e.target as Element | null;
      const isHot = !!(target && target.closest && target.closest(HOT_SELECTOR));
      if (isHot !== hot) {
        hot = isHot;
        ring?.classList.toggle('cur-hot', hot);
      }
    };

    const onLeave = () => {
      if (dot) dot.style.opacity = '0';
      if (ring) ring.style.opacity = '0';
    };

    const onDown = () => ring?.classList.add('cur-press');
    const onUp = () => ring?.classList.remove('cur-press');

    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      if (ring) {
        const s = hot ? 58 : 36;
        ring.style.transform = `translate(${rx - s / 2}px, ${ry - s / 2}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.body.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cur-ring" aria-hidden="true" />
      <div ref={dotRef} className="cur-dot" aria-hidden="true" />
    </>
  );
}
