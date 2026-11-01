import { useState, type ReactNode } from 'react';
import { BLOG_BASE } from '../data/blogLinks';
import { getLab } from '../data/labs';

/**
 * 気づきのための部品（「試して測る」のラボで共通に使う）
 *  - Predict: 測る前に予想してもらう
 *  - InsightResult: 予想と結果を並べ、論文で報告されている目安の帯の上に印を付ける（判定はしない）
 */

type Fmt = (v: number) => string;

/** 予想。value が undefined = まだ決めていない / null = 予想せずに測る */
export function Predict({
  question,
  hint,
  min,
  max,
  step,
  initial,
  format,
  value,
  onChange,
  disabled,
  onStart,
}: {
  question: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  format: Fmt;
  value: number | null | undefined;
  onChange: (v: number | null | undefined) => void;
  disabled?: boolean;
  /** 渡すと「この予想ではじめる」1回で予想を決めて測定を始める */
  onStart?: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  if (value !== undefined) {
    return (
      <div className="predict predict-done">
        <span>{value === null ? '予想なしで測ります' : 'あなたの予想'}</span>
        {value !== null && <b>{format(value)}</b>}
        {!disabled && (
          <button type="button" onClick={() => onChange(undefined)}>
            {value === null ? '予想する' : '変える'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="predict">
      <span className="predict-tag">測る前に予想</span>
      <b className="predict-q">{question}</b>
      {hint && <p className="predict-hint">{hint}</p>}
      <div className="predict-value">{format(draft)}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(e) => setDraft(+e.target.value)}
        aria-label={question}
      />
      <div className="predict-scale">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
      <div className="predict-actions">
        <button
          type="button"
          className="predict-lock"
          onClick={() => {
            onChange(draft);
            onStart?.();
          }}
        >
          {onStart ? 'この予想ではじめる' : 'この予想で決める'}
        </button>
        <button
          type="button"
          className="predict-skip"
          onClick={() => {
            onChange(null);
            onStart?.();
          }}
        >
          {onStart ? '予想せずにはじめる' : '予想しないで測る'}
        </button>
      </div>
    </div>
  );
}

type Band = { from: number; to: number; label: string };

/** 予想と結果、目安の帯 */
export function InsightResult({
  title,
  result,
  prediction,
  previous,
  format,
  min,
  max,
  ticks,
  band,
  gap,
  caption,
  lowerIsCloser,
  tickFormat,
  labId,
  cardSub,
}: {
  title: string;
  result: number;
  prediction?: number | null;
  previous?: number | null;
  format: Fmt;
  /** 図の左端・右端 */
  min: number;
  max: number;
  ticks: number[];
  /** 論文で報告されている目安の範囲。無いときは帯を出さない */
  band?: Band;
  /** 予想とのずれについての一言 */
  gap?: ReactNode;
  /** 帯の出典や注意書き */
  caption: ReactNode;
  /** 図の左ほど「目標に近い」など、向きの説明（任意） */
  lowerIsCloser?: string;
  /** 目盛りの書き方（省略時は format） */
  tickFormat?: Fmt;
  /** 渡すと、結果カードの保存・共有とサロンへの入口を出す */
  labId?: string;
  /** 結果カードに書く、何を測ったかの一言（例: ひざ・3回の平均のずれ） */
  cardSub?: string;
}) {
  const tf = tickFormat ?? format;
  // 端に近いときは、吹き出しや目盛りの文字が枠からはみ出さないよう、内側へ寄せる
  const pinShift = (p: number) => (p > 85 ? 88 : p < 15 ? 12 : 50);
  const tickShift = (p: number) => (p > 95 ? 100 : p < 5 ? 0 : 50);
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  const hasPred = prediction != null && Number.isFinite(prediction);
  const hasPrev = previous != null && Number.isFinite(previous);
  const over = (v: number) => (v > max ? ' ▶' : v < min ? '◀ ' : '');

  return (
    <div className="insight">
      <span className="insight-tag">{title}</span>

      {hasPred ? (
        <div className="insight-compare">
          <div>
            <small>予想</small>
            <b className="is-pred">{format(prediction!)}</b>
          </div>
          <i>→</i>
          <div>
            <small>結果</small>
            <b className="is-result">{format(result)}</b>
          </div>
        </div>
      ) : (
        <div className="insight-compare">
          <div>
            <small>結果</small>
            <b className="is-result">{format(result)}</b>
          </div>
        </div>
      )}
      {hasPred && gap && <p className="insight-gap">{gap}</p>}

      <div className="rb" role="img" aria-label={`結果 ${format(result)}${band ? `。目安の範囲は ${format(band.from)}〜${format(band.to)}` : ''}`}>
        <div className="rb-above">
          <span className="rb-pin is-result" style={{ left: `${pct(result)}%`, translate: `-${pinShift(pct(result))}% 0`, ['--arrow' as string]: `${pinShift(pct(result))}%` }}>
            今回 {format(result)}
            {over(result)}
          </span>
        </div>
        <div className="rb-track">
          {band && (
            <div className="rb-band" style={{ left: `${pct(band.from)}%`, width: `${pct(band.to) - pct(band.from)}%` }} />
          )}
          {hasPrev && <span className="rb-dot is-prev" style={{ left: `${pct(previous!)}%` }} />}
          {hasPred && <span className="rb-dot is-pred" style={{ left: `${pct(prediction!)}%` }} />}
          <span className="rb-dot is-result" style={{ left: `${pct(result)}%` }} />
        </div>
        <div className="rb-ticks">
          {ticks.map((t) => (
            <span key={t} style={{ left: `${pct(t)}%`, translate: `-${tickShift(pct(t))}% 0` }}>
              {tf(t)}
            </span>
          ))}
        </div>
        <div className="rb-legend">
          <span><i className="is-result" />今回</span>
          {hasPred && <span><i className="is-pred" />予想</span>}
          {hasPrev && <span><i className="is-prev" />前回</span>}
          {band && <span><i className="is-band" />{band.label}</span>}
          {lowerIsCloser && <em>{lowerIsCloser}</em>}
        </div>
      </div>
      <p className="insight-caption">{caption}</p>
      {labId && (
        <>
          <ResultActions
            card={{ labId, title: cardSub ?? title, result, prediction: hasPred ? prediction! : null, previous: hasPrev ? previous! : null, format, tickFormat: tf, min, max, ticks, band }}
          />
          <SalonCta />
        </>
      )}
    </div>
  );
}

/* ---------- 結果カード（端末の中で画像を作るだけで、どこにも送らない） ---------- */

export type CardData = {
  labId: string;
  title: string;
  result: number;
  prediction: number | null;
  previous: number | null;
  format: Fmt;
  tickFormat: Fmt;
  min: number;
  max: number;
  ticks: number[];
  band?: Band;
};

const C = { bg: '#14271c', panel: '#1d3a2b', line: '#2e4a3b', text: '#efeadc', muted: '#a4b8ab', green: '#8fb8a0', coral: '#e07a52', band: 'rgba(143,184,160,0.35)' };
const JP = "'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', sans-serif";
const EN = "'IBM Plex Mono', monospace";

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  let line = '';
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW) {
      ctx.fillText(line, x, y);
      line = ch;
      y += lh;
    } else line += ch;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

export async function drawCard(d: CardData): Promise<Blob | null> {
  try {
    await document.fonts?.ready;
  } catch {
    /* フォントが読めなくても描く */
  }
  const W = 1080;
  const H = 1350;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  const lab = getLab(d.labId);

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // 方眼の地模様
  ctx.strokeStyle = 'rgba(239,234,220,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const P = 90;
  ctx.fillStyle = C.green;
  ctx.font = `600 28px ${EN}`;
  ctx.fillText('Be:come  からだの実験室', P, 130);
  ctx.fillStyle = C.text;
  ctx.font = `900 76px ${JP}`;
  ctx.fillText(lab.title, P, 250);
  ctx.fillStyle = C.muted;
  ctx.font = `500 30px ${JP}`;
  const today = new Date();
  ctx.fillText(`${d.title}　${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`, P, 310);

  // 予想 → 結果
  let y = 470;
  if (d.prediction != null) {
    ctx.fillStyle = C.muted;
    ctx.font = `700 30px ${JP}`;
    ctx.fillText('予想', P, y - 70);
    ctx.fillText('結果', P + 470, y - 70);
    ctx.font = `600 100px ${EN}`;
    ctx.fillStyle = C.text;
    ctx.fillText(d.format(d.prediction), P, y + 20);
    ctx.fillStyle = C.muted;
    ctx.font = `400 64px ${EN}`;
    ctx.fillText('→', P + 370, y);
    ctx.fillStyle = C.coral;
    ctx.font = `600 100px ${EN}`;
    ctx.fillText(d.format(d.result), P + 470, y + 20);
  } else {
    ctx.fillStyle = C.muted;
    ctx.font = `700 30px ${JP}`;
    ctx.fillText('結果', P, y - 70);
    ctx.fillStyle = C.coral;
    ctx.font = `600 120px ${EN}`;
    ctx.fillText(d.format(d.result), P, y + 30);
  }

  // 目安の帯
  const tx = P;
  const tw = W - P * 2;
  const ty = 700;
  const pct = (v: number) => Math.max(0, Math.min(1, (v - d.min) / (d.max - d.min)));
  ctx.fillStyle = C.panel;
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, 34, 17);
  ctx.fill();
  if (d.band) {
    const bx = tx + tw * pct(d.band.from);
    const bw = tw * (pct(d.band.to) - pct(d.band.from));
    ctx.fillStyle = C.band;
    ctx.beginPath();
    ctx.roundRect(bx, ty, bw, 34, 17);
    ctx.fill();
  }
  const dot = (v: number, r: number, fill: string, stroke?: string) => {
    ctx.beginPath();
    ctx.arc(tx + tw * pct(v), ty + 17, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.lineWidth = 6;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };
  if (d.previous != null) dot(d.previous, 12, '#5e8ba8', C.bg);
  if (d.prediction != null) dot(d.prediction, 16, C.bg, C.text);
  dot(d.result, 22, C.coral, C.bg);
  ctx.fillStyle = C.muted;
  ctx.font = `400 26px ${EN}`;
  ctx.textAlign = 'center';
  d.ticks.forEach((t) => ctx.fillText(d.tickFormat(t), tx + tw * pct(t), ty + 84));
  ctx.textAlign = 'left';

  // 凡例
  y = ty + 160;
  ctx.font = `500 28px ${JP}`;
  const legend: [string, string][] = [[C.coral, '今回']];
  if (d.prediction != null) legend.push([C.text, '予想']);
  if (d.previous != null) legend.push(['#5e8ba8', '前回']);
  let lx = P;
  legend.forEach(([col, label]) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(lx + 12, y - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.text;
    ctx.fillText(label, lx + 34, y);
    lx += 34 + ctx.measureText(label).width + 40;
  });
  if (d.band) {
    y += 56;
    ctx.fillStyle = C.band;
    ctx.beginPath();
    ctx.roundRect(P, y - 26, 44, 22, 11);
    ctx.fill();
    ctx.fillStyle = C.text;
    ctx.fillText(d.band.label, P + 60, y);
  }

  // 注意書き
  ctx.fillStyle = C.muted;
  ctx.font = `500 26px ${JP}`;
  y = wrapText(ctx, '帯は、研究で報告されている目安との比較です。良い悪いの判定や、診断ではありません。', P, 1110, W - P * 2, 40);

  ctx.fillStyle = C.green;
  ctx.font = `600 28px ${EN}`;
  ctx.fillText(`lab.health-football.com/lab/${d.labId}`, P, 1260);

  return new Promise((resolve) => cv.toBlob((b) => resolve(b), 'image/png'));
}

function ResultActions({ card }: { card: CardData }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const make = async () => {
    const blob = await drawCard(card);
    if (!blob) throw new Error('canvas');
    return new File([blob], `become-${card.labId}.png`, { type: 'image/png' });
  };

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      const file = await make();
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setMsg('画像を保存しました。');
    } catch {
      setMsg('画像を作れませんでした。');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    setMsg('');
    try {
      const file = await make();
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: `${getLab(card.labId).title}の結果`, text: 'からだの実験室で試してみました' });
      } else {
        await save();
        return;
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setMsg('共有できませんでした。「画像を保存」をお使いください。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="result-actions">
      <button type="button" onClick={share} disabled={busy}>
        結果を画像で共有
      </button>
      <button type="button" className="ghost" onClick={save} disabled={busy}>
        画像を保存
      </button>
      <small>画像はこの端末の中で作るだけで、どこにも送信しません。{msg && ` ${msg}`}</small>
    </div>
  );
}

/** サロン（出張パーソナル）への入口。診断や治療を思わせる言い方はしない */
export function SalonCta() {
  return (
    <div className="salon-cta">
      <b>この結果を、体の使い方に活かしたいときは</b>
      <p>測った結果を見ながら、日常の動きやトレーニングの組み立てを一緒に確認できます。出張パーソナルトレーニングで対応しています。</p>
      <a href={`${BLOG_BASE}/personal-training`} target="_blank" rel="noreferrer">出張パーソナルの案内を見る ↗</a>
    </div>
  );
}

/** この端末のブラウザにだけ残す前回の値（読めない環境では null） */
export function readPrevious(key: string): number | null {
  try {
    const v = localStorage.getItem(key);
    return v == null ? null : Number(v);
  } catch {
    return null;
  }
}

export function savePrevious(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* 保存できなくても体験は続けられる */
  }
}
