import type { ReactNode } from 'react';
import { getLab, groupOf, labNo } from '../data/labs';

/**
 * 各ラボの見出し（全ラボ共通の形）
 * 最初に見えるのは「題名・問いかけ1行・機器と時間」だけ。
 * くわしい説明（これは何？／やること／結果の見方）は「このラボについて」に畳んでおく。
 */
export function LabHead({ id, lead, steps, read }: { id: string; lead: ReactNode; steps: ReactNode; read: ReactNode }) {
  const lab = getLab(id);
  return (
    <div className="section-head lab-head">
      <span className="section-index">
        {labNo(id)} / {groupOf(id).title}
      </span>
      <h2>{lab.title}</h2>
      <p className="lab-hook">{lab.hook}</p>
      <div className="lab-tags">
        <span>{lab.device}</span>
        <span>{lab.time}</span>
      </div>
      <details className="lab-more">
        <summary>このラボについて</summary>
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
      </details>
    </div>
  );
}

/** 根拠・参考文献など、読みたい人だけが開く欄 */
export function LabMore({ title = '根拠と参考文献', children }: { title?: string; children: ReactNode }) {
  return (
    <details className="lab-more lab-more-evidence">
      <summary>{title}</summary>
      {children}
    </details>
  );
}
