import type { ReactNode } from 'react';
import { getLab, groupOf, labNo } from '../data/labs';

/**
 * 各ラボの見出し（全ラボ共通の形）
 * ① これは何？（lead）→ ② やること → ③ 結果の見方。根拠は各ラボの下に置く。
 */
export function LabHead({ id, lead, steps, read }: { id: string; lead: ReactNode; steps: ReactNode; read: ReactNode }) {
  const lab = getLab(id);
  return (
    <div className="section-head lab-head">
      <span className="section-index">
        {labNo(id)} / {groupOf(id).title}
      </span>
      <h2>
        {lab.title}
        <span className="en-sub">{lab.en}</span>
      </h2>
      <div className="lab-tags">
        <span>{lab.device}</span>
        <span>{lab.time}</span>
      </div>
      <p className="section-lead">{lead}</p>
      <dl className="lab-flow">
        <div>
          <dt>やること</dt>
          <dd>{steps}</dd>
        </div>
        <div>
          <dt>結果の見方</dt>
          <dd>{read}</dd>
        </div>
      </dl>
    </div>
  );
}
