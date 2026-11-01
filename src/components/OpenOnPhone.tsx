import { useState } from 'react';

/** パソコン（マウス操作・タッチなし）で開いているか */
export function isDesktopDevice() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches && navigator.maxTouchPoints === 0;
}

/** センサーを使うラボで、アプリが要らないことと iPhone の許可を伝える一文 */
export const NO_APP_NOTE = 'アプリは要りません。スマホのブラウザで開くだけで測れます（iPhone は最初に「動きと方向へのアクセス」を許可してください）。';

/** パソコンで開いたときだけ、スマホで開くためのQRコードを出す（センサーを使うラボ用） */
export function OpenOnPhone({ id, text }: { id: string; text: string }) {
  const [isDesktop] = useState(isDesktopDevice);
  if (!isDesktop) return null;
  return (
    <div className="open-on-phone">
      <img src={`/images/qr/${id}.svg`} alt={`スマホでこのラボを開くQRコード（lab.health-football.com/lab/${id}）`} width={104} height={104} />
      <div>
        <b>スマホで開いてください</b>
        <p>{text}</p>
        <p className="open-on-phone-note">{NO_APP_NOTE}</p>
        <small>lab.health-football.com/lab/{id}</small>
      </div>
    </div>
  );
}
