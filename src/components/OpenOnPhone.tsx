import { useState } from 'react';

/** パソコンで開いたときだけ、スマホで開くためのQRコードを出す（センサーを使うラボ用） */
export function OpenOnPhone({ id, text }: { id: string; text: string }) {
  const [isDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches && navigator.maxTouchPoints === 0,
  );
  if (!isDesktop) return null;
  return (
    <div className="open-on-phone">
      <img src={`/images/qr/${id}.svg`} alt={`スマホでこのラボを開くQRコード（lab.health-football.com/lab#${id}）`} width={104} height={104} />
      <div>
        <b>スマホで開いてください</b>
        <p>{text}</p>
        <small>lab.health-football.com/lab#{id}</small>
      </div>
    </div>
  );
}
