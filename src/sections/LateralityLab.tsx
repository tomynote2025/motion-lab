import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

/**
 * LEFT / RIGHT LAB — 左右判断テスト(手)
 *
 * 画面の手が右手か左手かを、できるだけ速く正確に答える。
 * 刺激: 左右 × 手の甲/手のひら × 8方向(0〜315°, 45°刻み) = 32通り。
 * 手は自作の3Dモデル(public/models/hand-left.glb)を回転・反転して表示する。
 *
 * 根拠(文言の範囲):
 *  - 手の左右判断には運動イメージが関わると考えられる(Parsons 1987/1994)。ただし見た目の手がかりで解ける場合もある。
 *  - 慢性痛では手足・顔の痛みで成績低下が一貫、体幹では一貫しない(Breckenridge 2019, 25研究)。
 *  - 左右判断の練習だけで痛みが減る効果は確認されていない(Bowering 2013)。
 *  - 健康な18〜35歳100人: 正答率 約87〜89%、反応時間 約1.0〜1.4秒(オープンソース版HLJT, 2024 プレプリント)。
 */

type Side = 'L' | 'R';
type View = 'dorsal' | 'palmar';
type Trial = { side: Side; view: View; angle: number };
type Result = Trial & { correct: boolean; rt: number; timeout: boolean };
type Phase = 'intro' | 'fixation' | 'stimulus' | 'feedback' | 'result';

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]; // 時計回り
const FIXATION_MS = 500;
const FEEDBACK_MS = 350;
const TIMEOUT_MS = 5000;
const STORAGE_KEY = 'lr-lab-last';

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function makeTrials(practice: boolean): Trial[] {
  const all: Trial[] = [];
  (['L', 'R'] as Side[]).forEach((side) =>
    (['dorsal', 'palmar'] as View[]).forEach((view) => ANGLES.forEach((angle) => all.push({ side, view, angle }))),
  );
  return practice ? shuffle(all).slice(0, 4) : shuffle(all);
}

/** 指先が体の中心(内側)を向く回転か、外側を向く回転か */
function rotationDir(t: Trial): 'medial' | 'lateral' | null {
  if (t.angle === 0 || t.angle === 180) return null;
  const clockwise = t.angle < 180; // 指先が画面の右を向く
  if (t.side === 'L') return clockwise ? 'medial' : 'lateral';
  return clockwise ? 'lateral' : 'medial';
}

function HandStimulus({ trial }: { trial: Trial }) {
  const { scene } = useGLTF('/models/hand-left.glb');
  const hand = useMemo(() => scene.clone(true), [scene]);
  return (
    // 外側: 画面内の回転(時計回り) / 内側: 手のひら側(Y軸180°)・右手(X反転)
    <group rotation={[0, 0, (-trial.angle * Math.PI) / 180]}>
      <group scale={[trial.side === 'R' ? -1 : 1, 1, 1]} rotation={[0, trial.view === 'palmar' ? Math.PI : 0, 0]}>
        {/* glTF は Blender の Z(手の甲) が Y になるので、X まわりに 90° 起こして「甲 = 手前」に戻す */}
        <group position={[-0.1, -0.3, 0]}>
          <primitive object={hand} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      </group>
    </group>
  );
}

function loadLast(): { acc: number; rt: number } | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function saveLast(v: { acc: number; rt: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* 保存できなくても動作には影響しない */
  }
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);

function summarize(rs: Result[]) {
  const ok = rs.filter((r) => r.correct);
  const acc = rs.length ? ok.length / rs.length : 0;
  const rt = mean(ok.map((r) => r.rt));
  const group = (f: (r: Result) => boolean) => {
    const g = rs.filter(f);
    const gOk = g.filter((r) => r.correct);
    return { acc: g.length ? gOk.length / g.length : NaN, rt: mean(gOk.map((r) => r.rt)), n: g.length };
  };
  return {
    acc,
    rt,
    left: group((r) => r.side === 'L'),
    right: group((r) => r.side === 'R'),
    dorsal: group((r) => r.view === 'dorsal'),
    palmar: group((r) => r.view === 'palmar'),
    palmarMedial: group((r) => r.view === 'palmar' && rotationDir(r) === 'medial'),
    palmarLateral: group((r) => r.view === 'palmar' && rotationDir(r) === 'lateral'),
  };
}

const fmtS = (ms: number) => (Number.isFinite(ms) ? `${(ms / 1000).toFixed(2)}秒` : '—');
const fmtP = (p: number) => (Number.isFinite(p) ? `${Math.round(p * 100)}%` : '—');

function CompareRow({ label, a, b, aLabel, bLabel }: { label: string; a: number; b: number; aLabel: string; bLabel: string }) {
  const max = Math.max(a || 0, b || 0, 1);
  return (
    <div className="lr-compare">
      <span className="lr-compare-label">{label}</span>
      <div className="lr-bar-row"><i>{aLabel}</i><span className="lr-bar"><span style={{ width: `${((a || 0) / max) * 100}%` }} /></span><b>{fmtS(a)}</b></div>
      <div className="lr-bar-row"><i>{bLabel}</i><span className="lr-bar alt"><span style={{ width: `${((b || 0) / max) * 100}%` }} /></span><b>{fmtS(b)}</b></div>
    </div>
  );
}

export function LateralityLab() {
  const [phase, setPhase] = useState<Phase>('intro');
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
    setTrials(makeTrials(isPractice));
    setResults([]);
    setPrevious(loadLast());
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
              saveLast({ acc: s.acc, rt: s.rt });
            }
          }
        }, FEEDBACK_MS),
      );
    },
    [phase, trials, index, results, practice, showTrial],
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

  return (
    <section id="laterality" className="section">
      <div className="section-head">
        <span className="section-index">04 / LEFT-RIGHT JUDGEMENT</span>
        <h2>LEFT / RIGHT LAB<span className="jp-sub">左右判断テスト</span></h2>
        <p className="section-lead">
          画面に出る手が「右手」か「左手」かを、できるだけ速く正確に答えてください。手の向きを判断するとき、脳の中では自分の手を同じ向きに動かすイメージ（運動イメージ）が使われていると考えられています。痛みが長く続いている人では、この判断が遅くなったり間違えやすくなったりすることが報告されています。
        </p>
      </div>

      <div className="position-notice">
        <b>この体験で測るもの</b>
        <p>手の左右を判断する速さと正確さです。運動イメージが関わると考えられていますが、見た目の手がかり（親指の位置や爪など）だけで判断できる場合もあり、運動イメージだけを測っているわけではありません。病気や痛みの原因を調べる検査ではありません。</p>
      </div>

      <div className="position-grid">
        <div className="position-stage lr-stage">
          <div className="position-stage-head">
            <span>{running ? `${practice ? 'PRACTICE' : 'TRIAL'} ${index + 1} / ${trials.length}` : 'LEFT OR RIGHT ?'}</span>
            <b>{running ? 'この手は、右手？ 左手？' : phase === 'result' ? 'おつかれさまでした' : '右の「はじめる」から開始'}</b>
          </div>

          <div className="lr-canvas">
            <Canvas camera={{ position: [0, 0, 7], fov: 32 }} dpr={[1, 2]}>
              <ambientLight intensity={0.75} />
              <directionalLight position={[2.5, 4, 6]} intensity={1.25} />
              <directionalLight position={[-3, -2, 4]} intensity={0.35} />
              <Suspense fallback={null}>{phase === 'stimulus' && trial && <HandStimulus trial={trial} />}</Suspense>
            </Canvas>
            {phase === 'fixation' && <div className="lr-fixation">+</div>}
            {phase === 'feedback' && <div className={`lr-feedback ${lastFeedback ? 'ok' : 'ng'}`}>{lastFeedback ? '○' : '×'}</div>}
            {phase === 'intro' && <div className="lr-idle">手が表示されたら<br />左右のボタン（または ← / → キー）で答えます</div>}
          </div>

          <div className="lr-answer">
            <button disabled={phase !== 'stimulus'} onClick={() => answer('L')}>
              <span>←</span>左手
            </button>
            <button disabled={phase !== 'stimulus'} onClick={() => answer('R')}>
              右手<span>→</span>
            </button>
          </div>
        </div>

        <div className="position-controls">
          {!running && (
            <>
              <button className="start-btn position-main-btn" onClick={() => start(false)}>
                {phase === 'result' && !practice ? 'もう一度（32問）' : 'はじめる（32問・約1分）'}
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
                <p className="lr-note">練習が終わりました。慣れたら「はじめる」で32問に挑戦してください。</p>
              ) : (
                <>
                  {previous && (
                    <p className="lr-note">前回：正答率 {fmtP(previous.acc)}／平均 {fmtS(previous.rt)}（くり返すと速くなる「練習効果」があります）</p>
                  )}
                  <CompareRow label="左手と右手" a={s.left.rt} b={s.right.rt} aLabel="左手" bLabel="右手" />
                  <p className="lr-mini">正答率　左手 {fmtP(s.left.acc)}／右手 {fmtP(s.right.acc)}</p>
                  <CompareRow label="手の甲と手のひら" a={s.dorsal.rt} b={s.palmar.rt} aLabel="手の甲" bLabel="手のひら" />
                  <CompareRow label="手のひら：指先が内向き／外向き" a={s.palmarMedial.rt} b={s.palmarLateral.rt} aLabel="内向き" bLabel="外向き" />
                  <p className="lr-mini">手のひらの画像では、指先が体の外側を向く回転のほうが時間がかかりやすいことが知られています。実際に手をその向きへ回すのが難しい（関節の動きの制約）ためと考えられています。</p>
                </>
              )}
            </>
          )}

          {phase === 'intro' && (
            <div className="lr-howto">
              <p><b>やり方</b></p>
              <ol>
                <li>中央に「＋」が出たあと、手が表示されます。</li>
                <li>右手か左手かを、ボタンか ← / → キー（F / J キーでも可）で答えます。</li>
                <li>手の甲・手のひら、8方向の向きで、全部で32問です。5秒で時間切れになります。</li>
              </ol>
              <p className="lr-mini">自分の手を動かさず、画面だけを見て判断するのが基本です。</p>
            </div>
          )}
        </div>
      </div>

      <div className="lr-evidence">
        <div>
          <span>REFERENCE</span>
          <b>結果の目安</b>
          <p>健康な18〜35歳の100人を対象にした研究では、正答率は約87〜89%、平均反応時間は約1.0〜1.4秒でした。年齢が上がると遅く・間違えやすくなる傾向があり、くり返すと速くなります。テストの条件（画面や答え方）でも変わるため、あくまで目安です。</p>
        </div>
        <div>
          <span>PAIN</span>
          <b>痛みとの関係</b>
          <p>25の研究をまとめた報告では、手足や顔の慢性的な痛みがある人で成績の低下が一貫して見られました。一方、腰や首など体幹の痛みでは結果が一貫していません。左右差や遅さがあっても、それだけで痛みの原因は分かりません。</p>
        </div>
        <div>
          <span>TRAINING</span>
          <b>練習すると痛みは減る？</b>
          <p>左右判断の練習は、「段階的運動イメージ」という方法の最初の段階として使われます。方法全体には痛みを和らげる可能性が示されていますが研究の質は高くなく、左右判断の練習だけで痛みが減る効果は確認されていません。</p>
        </div>
      </div>
      <p className="neuro-caution">
        参考: Parsons LM (1987, 1994) 手の左右判断と運動イメージ／Breckenridge JD ら (2019) J Pain 20(2):119-132／Bowering KJ ら (2013) J Pain 14(1):3-13／Development and validation of an open-source Hand Laterality Judgement Task (bioRxiv, 2024)。痛みやしびれが続く場合は、医療機関や専門家にご相談ください。
      </p>
    </section>
  );
}

useGLTF.preload('/models/hand-left.glb');
