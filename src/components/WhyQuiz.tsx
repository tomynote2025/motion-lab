import { useState } from 'react';

/**
 * 各ラボの最後に置く「なぜそうなる？」の問い。
 * 先に自分で選んでから答えを開く（考えてから読むと残りやすい）。正解・不正解は責めない言い方にする。
 */
export function WhyQuiz({
  question,
  choices,
  answer,
  explain,
}: {
  question: string;
  choices: string[];
  /** choices の中の正しいものの番号 */
  answer: number;
  explain: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;

  return (
    <div className="why">
      <span className="why-tag">なぜそうなる？</span>
      <b className="why-q">{question}</b>
      <div className="why-choices" role="group" aria-label={question}>
        {choices.map((c, i) => (
          <button
            key={c}
            type="button"
            disabled={done}
            className={done ? (i === answer ? 'is-answer' : i === picked ? 'is-picked' : '') : ''}
            onClick={() => setPicked(i)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {c}
          </button>
        ))}
      </div>
      {done ? (
        <div className="why-explain">
          <b>{picked === answer ? 'そのとおりです。' : `答えは ${String.fromCharCode(65 + answer)} です。`}</b>
          <p>{explain}</p>
          <button type="button" className="why-reset" onClick={() => setPicked(null)}>
            もう一度選ぶ
          </button>
        </div>
      ) : (
        <p className="why-hint">先に1つ選んでから、答えを開きます。</p>
      )}
    </div>
  );
}
