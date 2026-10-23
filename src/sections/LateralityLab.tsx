import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * LEFT / RIGHT LAB — 左右判断テスト(手・前腕と手・腕全体・足)
 *
 * 画面の体が右か左かを、できるだけ速く正確に答える。
 * 画像は MakeHuman(MPFB 2, CC0)で作った人体を描画したもの(public/images/laterality/)。
 * どの画像も「左」側の画像だけを用意し、右は左右反転で作り、8方向に回転させる。
 *
 * 根拠(文言の範囲):
 *  - 手の左右判断には運動イメージが関わると考えられる(Parsons 1987/1994)。ただし見た目の手がかりで解ける場合もある。
 *  - 慢性痛では手足・顔の痛みで成績低下が一貫、首や腰など体幹では一貫しない(Breckenridge 2019, 25研究)。
 *  - 左右判断の練習だけで痛みが減る効果は確認されていない(Bowering 2013)。
 *  - 健康な18〜35歳100人(手): 正答率 約87〜89%、反応時間 約1.0〜1.4秒(オープンソース版HLJT, 2024 プレプリント)。
 */

type Side = 'L' | 'R';
type Part = 'hand' | 'forearm' | 'upperlimb' | 'foot';
type Stim = { src: string; view: string };
type Trial = { side: Side; stim: Stim; angle: number };
type Result = Trial & { correct: boolean; rt: number; timeout: boolean };
type Phase = 'intro' | 'fixation' | 'stimulus' | 'feedback' | 'result';

const IMG = '/images/laterality/';

const PARTS: Record<
  Part,
  { label: string; question: string; left: string; right: string; stims: Stim[]; rotate: boolean; repeats: number; howto: string }
> = {
  hand: {
    label: '手',
    question: 'この手は、右手？ 左手？',
    left: '左手',
    right: '右手',
    stims: [
      { src: `${IMG}hand-left-dorsal.webp`, view: '手の甲' },
      { src: `${IMG}hand-left-palmar.webp`, view: '手のひら' },
    ],
    rotate: true,
    repeats: 1,
    howto: '手の甲・手のひらを、8方向の向きで出します。',
  },
  foot: {
    label: '足',
    question: 'この足は、右足？ 左足？',
    left: '左足',
    right: '右足',
    stims: [
      { src: `${IMG}foot-left-dorsal.webp`, view: '足の甲' },
      { src: `${IMG}foot-left-plantar.webp`, view: '足の裏' },
    ],
    rotate: true,
    repeats: 1,
    howto: '足の甲・足の裏を、8方向の向きで出します。',
  },
  forearm: {
    label: '前腕と手',
    question: 'この腕は、右？ 左？',
    left: '左',
    right: '右',
    stims: [
      { src: `${IMG}forearm-left-dorsal.webp`, view: '手の甲側' },
      { src: `${IMG}forearm-left-palmar.webp`, view: '手のひら側' },
    ],
    rotate: true,
    repeats: 1,
    howto: 'ひじから先を、手の甲側・手のひら側から、8方向の向きで出します。',
  },
  upperlimb: {
    label: '腕全体',
    question: 'この腕は、右？ 左？',
    left: '左',
    right: '右',
    stims: [
      { src: `${IMG}upperlimb-left-dorsal.webp`, view: '手の甲側' },
      { src: `${IMG}upperlimb-left-palmar.webp`, view: '手のひら側' },
    ],
    rotate: true,
    repeats: 1,
    howto: '二の腕から指先までを、手の甲側・手のひら側から、8方向の向きで出します。',
  },
};
const PART_ORDER: Part[] = ['hand', 'forearm', 'upperlimb', 'foot'];

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]; // 時計回り
const FIXATION_MS = 500;
const FEEDBACK_MS = 350;
const TIMEOUT_MS = 5000;
const STORAGE_KEY = 'lr-lab-last'; // 部位ごとに保存する(キーの後ろに -hand など)

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function makeTrials(part: Part, practice: boolean): Trial[] {
  const def = PARTS[part];
  const all: Trial[] = [];
  for (let r = 0; r < def.repeats; r++) {
    (['L', 'R'] as Side[]).forEach((side) =>
      def.stims.forEach((stim) => (def.rotate ? ANGLES : [0]).forEach((angle) => all.push({ side, stim, angle }))),
    );
  }
  const order = shuffle(all);
  // 同じ画像・同じ左右が2問続かないように入れ替える
  const same = (a: Trial, b: Trial) => a.side === b.side && a.stim === b.stim && a.angle === b.angle;
  for (let i = 1; i < order.length; i++) {
    if (same(order[i], order[i - 1])) {
      const j = order.findIndex((t, k) => k > i && !same(t, order[i - 1]));
      if (j > 0) [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return practice ? order.slice(0, 4) : order;
}

/** 手のひら: 指先が体の中心(内側)を向く回転か、外側を向く回転か */
function rotationDir(t: Trial): 'medial' | 'lateral' | null {
  if (t.angle === 0 || t.angle === 180) return null;
  const clockwise = t.angle < 180; // 指先が画面の右を向く
  if (t.side === 'L') return clockwise ? 'medial' : 'lateral';
  return clockwise ? 'lateral' : 'medial';
}

function Stimulus({ trial }: { trial: Trial }) {
  // 左の画像を、右なら左右反転してから、時計回りに回す
  return (
    <img
      className="lr-stim-img"
      src={trial.stim.src}
      alt=""
      draggable={false}
      style={{ transform: `rotate(${trial.angle}deg) scaleX(${trial.side === 'R' ? -1 : 1})` }}
    />
  );
}

function loadLast(part: Part): { acc: number; rt: number } | null {
  try {
    const v = localStorage.getItem(`${STORAGE_KEY}-${part}`);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function saveLast(part: Part, v: { acc: number; rt: number }) {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${part}`, JSON.stringify(v));
  } catch {
    /* 保存できなくても動作には影響しない */
  }
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);

function group(rs: Result[], f: (r: Result) => boolean) {
  const g = rs.filter(f);
  const ok = g.filter((r) => r.correct);
  return { acc: g.length ? ok.length / g.length : NaN, rt: mean(ok.map((r) => r.rt)), n: g.length };
}

function summarize(rs: Result[]) {
  const ok = rs.filter((r) => r.correct);
  const views = [...new Set(rs.map((r) => r.stim.view))];
  return {
    acc: rs.length ? ok.length / rs.length : 0,
    rt: mean(ok.map((r) => r.rt)),
    left: group(rs, (r) => r.side === 'L'),
    right: group(rs, (r) => r.side === 'R'),
    views: views.map((v) => ({ view: v, ...group(rs, (r) => r.stim.view === v) })),
    palmarMedial: group(rs, (r) => r.stim.view === '手のひら' && rotationDir(r) === 'medial'),
    palmarLateral: group(rs, (r) => r.stim.view === '手のひら' && rotationDir(r) === 'lateral'),
  };
}

const fmtS = (ms: number) => (Number.isFinite(ms) ? `${(ms / 1000).toFixed(2)}秒` : '—');
const fmtP = (p: number) => (Number.isFinite(p) ? `${Math.round(p * 100)}%` : '—');

function Bars({ label, rows }: { label: string; rows: { name: string; rt: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.rt || 0));
  return (
    <div className="lr-compare">
      <span className="lr-compare-label">{label}</span>
      {rows.map((r, i) => (
        <div key={r.name} className="lr-bar-row">
          <i>{r.name}</i>
          <span className={`lr-bar ${i % 2 ? 'alt' : ''}`}>
            <span style={{ width: `${((r.rt || 0) / max) * 100}%` }} />
          </span>
          <b>{fmtS(r.rt)}</b>
        </div>
      ))}
    </div>
  );
}

export function LateralityLab() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [part, setPart] = useState<Part>('hand');
  const [practice, setPractice] = useState(false);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [lastFeedback, setLastFeedback] = useState<boolean | null>(null);
  const [previous, setPrevious] = useState<{ acc: number; rt: number } | null>(null);
  const t0 = useRef(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  // 反応時間に読み込みの遅れが混ざらないよう、画像を先に読み込んでおく
  useEffect(() => {
    PART_ORDER.forEach((p) =>
      PARTS[p].stims.forEach((s) => {
        const im = new Image();
        im.src = s.src;
      }),
    );
  }, []);

  const showTrial = useCallback((i: number) => {
    setIndex(i);
    setPhase('fixation');
    timers.current.push(
      window.setTimeout(() => {
        setPhase('stimulus');
        t0.current = performance.now();
      }, FIXATION_MS),
    );
  }, []);

  const start = (isPractice: boolean) => {
    clearTimers();
    setPractice(isPractice);
    setTrials(makeTrials(part, isPractice));
    setResults([]);
    setPrevious(loadLast(part));
    showTrial(0);
  };

  const answer = useCallback(
    (choice: Side | null) => {
      if (phase !== 'stimulus') return;
      clearTimers();
      const trial = trials[index];
      const rt = performance.now() - t0.current;
      const correct = choice === trial.side;
      const next = [...results, { ...trial, correct, rt, timeout: choice === null }];
      setResults(next);
      setLastFeedback(correct);
      setPhase('feedback');
      timers.current.push(
        window.setTimeout(() => {
          if (index + 1 < trials.length) {
            showTrial(index + 1);
          } else {
            setPhase('result');
            if (!practice) {
              const s = summarize(next);
              saveLast(part, { acc: s.acc, rt: s.rt });
            }
          }
        }, FEEDBACK_MS),
      );
    },
    [phase, trials, index, results, practice, showTrial, part],
  );

  // 時間切れ
  useEffect(() => {
    if (phase !== 'stimulus') return;
    const id = window.setTimeout(() => answer(null), TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [phase, answer]);

  // キーボード: ← / F = 左、→ / J = 右
  useEffect(() => {
    if (phase !== 'stimulus') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        answer('L');
      } else if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        answer('R');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answer]);

  const running = phase === 'fixation' || phase === 'stimulus' || phase === 'feedback';
  const trial = trials[index];
  const s = useMemo(() => summarize(results), [results]);
  const def = PARTS[part];
  const total = def.stims.length * 2 * (def.rotate ? ANGLES.length : 1) * def.repeats;

  return (
    <section id="laterality" className="section">
      <div className="section-head">
        <span className="section-index">04 / LEFT-RIGHT JUDGEMENT</span>
        <h2>LEFT / RIGHT LAB<span className="jp-sub">左右判断テスト</span></h2>
        <p className="section-lead">
          画面に出る手足が「右」か「左」かを、できるだけ速く正確に答えてください。向きを判断するとき、脳の中では自分の手足を同じ向きに動かすイメージ（運動イメージ）が使われていると考えられています。痛みが長く続いている人では、この判断が遅くなったり間違えやすくなったりすることが報告されています。
        </p>
      </div>

      <div className="position-notice">
        <b>この体験で測るもの</b>
        <p>手足の左右を判断する速さと正確さです。運動イメージが関わると考えられていますが、見た目の手がかり（親指の位置や爪など）だけで判断できる場合もあり、運動イメージだけを測っているわけではありません。病気や痛みの原因を調べる検査ではありません。</p>
      </div>

      <div className="position-grid">
        <div className="position-stage lr-stage">
          <div className="position-stage-head">
            <span>{running ? `${practice ? 'PRACTICE' : 'TRIAL'} ${index + 1} / ${trials.length}` : 'LEFT OR RIGHT ?'}</span>
            <b>{running ? def.question : phase === 'result' ? 'おつかれさまでした' : '右の「はじめる」から開始'}</b>
          </div>

          <div className="lr-canvas lr-stim">
            {phase === 'stimulus' && trial && <Stimulus trial={trial} />}
            {phase === 'fixation' && <div className="lr-fixation">+</div>}
            {phase === 'feedback' && <div className={`lr-feedback ${lastFeedback ? 'ok' : 'ng'}`}>{lastFeedback ? '○' : '×'}</div>}
            {phase === 'intro' && <div className="lr-idle">画像が表示されたら<br />左右のボタン（または ← / → キー）で答えます</div>}
          </div>

          <div className="lr-answer">
            <button disabled={phase !== 'stimulus'} onClick={() => answer('L')}>
              <span>←</span>{def.left}
            </button>
            <button disabled={phase !== 'stimulus'} onClick={() => answer('R')}>
              {def.right}<span>→</span>
            </button>
          </div>
        </div>

        <div className="position-controls">
          {!running && (
            <>
              <div className="region-chips" role="radiogroup" aria-label="テストする部位">
                {PART_ORDER.map((pt) => (
                  <button
                    key={pt}
                    className={`chip ${part === pt ? 'chip-active' : ''}`}
                    onClick={() => {
                      setPart(pt);
                      setPhase('intro');
                      setResults([]);
                    }}
                  >
                    {PARTS[pt].label}
                  </button>
                ))}
              </div>
              <button className="start-btn position-main-btn" onClick={() => start(false)}>
                {phase === 'result' && !practice ? `もう一度（${total}問）` : `はじめる（${total}問）`}
              </button>
              <button className="lr-sub-btn" onClick={() => start(true)}>練習する（4問）</button>
            </>
          )}
          {running && (
            <div className="lr-progress">
              <span style={{ width: `${(index / Math.max(trials.length, 1)) * 100}%` }} />
            </div>
          )}

          {phase === 'result' && (
            <>
              <div className="lr-score">
                <div><span>正答率</span><strong>{fmtP(s.acc)}</strong></div>
                <div><span>平均反応時間（正解のみ）</span><strong>{fmtS(s.rt)}</strong></div>
              </div>
              {practice ? (
                <p className="lr-note">練習が終わりました。慣れたら「はじめる」で挑戦してください。</p>
              ) : (
                <>
                  {previous && (
                    <p className="lr-note">前回：正答率 {fmtP(previous.acc)}／平均 {fmtS(previous.rt)}（くり返すと速くなる「練習効果」があります）</p>
                  )}
                  <Bars label={`${def.left}と${def.right}`} rows={[{ name: def.left, rt: s.left.rt }, { name: def.right, rt: s.right.rt }]} />
                  <p className="lr-mini">正答率　{def.left} {fmtP(s.left.acc)}／{def.right} {fmtP(s.right.acc)}</p>
                  <Bars label="見る方向による違い" rows={s.views.map((v) => ({ name: v.view, rt: v.rt }))} />
                  {part === 'hand' && (
                    <>
                      <Bars label="手のひら：指先が内向き／外向き" rows={[{ name: '内向き', rt: s.palmarMedial.rt }, { name: '外向き', rt: s.palmarLateral.rt }]} />
                      <p className="lr-mini">手のひらの画像では、指先が体の外側を向く回転のほうが時間がかかりやすいことが知られています。実際に手をその向きへ回すのが難しい（関節の動きの制約）ためと考えられています。</p>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {phase === 'intro' && (
            <div className="lr-howto">
              <p><b>やり方</b></p>
              <ol>
                <li>中央に「＋」が出たあと、画像が表示されます。</li>
                <li>{def.left}か{def.right}かを、ボタンか ← / → キー（F / J キーでも可）で答えます。</li>
                <li>{def.howto}全部で{total}問です。5秒で時間切れになります。</li>
              </ol>
              <p className="lr-mini">自分の手足を動かさず、画面だけを見て判断するのが基本です。</p>
            </div>
          )}
        </div>
      </div>

      <div className="lr-evidence">
        <div>
          <span>REFERENCE</span>
          <b>結果の目安</b>
          <p>手の画像を使い、健康な18〜35歳の100人を対象にした研究では、正答率は約87〜89%、平均反応時間は約1.0〜1.4秒でした。年齢が上がると遅く・間違えやすくなる傾向があり、くり返すと速くなります。テストの条件（画面や答え方）や部位でも変わるため、あくまで目安です。</p>
        </div>
        <div>
          <span>PAIN</span>
          <b>痛みとの関係</b>
          <p>25の研究をまとめた報告では、手足や顔の慢性的な痛みがある人で成績の低下が一貫して見られました。一方、首や腰など体幹の痛みでは結果が一貫していません。左右差や遅さがあっても、それだけで痛みの原因は分かりません。</p>
        </div>
        <div>
          <span>TRAINING</span>
          <b>練習すると痛みは減る？</b>
          <p>左右判断の練習は、「段階的運動イメージ」という方法の最初の段階として使われます。方法全体には痛みを和らげる可能性が示されていますが研究の質は高くなく、左右判断の練習だけで痛みが減る効果は確認されていません。</p>
        </div>
      </div>
      <p className="neuro-caution">
        参考: Parsons LM (1987, 1994) 手の左右判断と運動イメージ／Breckenridge JD ら (2019) J Pain 20(2):119-132／Bowering KJ ら (2013) J Pain 14(1):3-13／Development and validation of an open-source Hand Laterality Judgement Task (bioRxiv, 2024)。画像は MakeHuman（MPFB 2、CC0）で作成。痛みやしびれが続く場合は、医療機関や専門家にご相談ください。
      </p>
    </section>
  );
}
