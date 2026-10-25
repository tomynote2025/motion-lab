import { useState, type ReactNode } from 'react';

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
        <button type="button" className="predict-lock" onClick={() => onChange(draft)}>
          この予想で決める
        </button>
        <button type="button" className="predict-skip" onClick={() => onChange(null)}>
          予想しないで測る
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
