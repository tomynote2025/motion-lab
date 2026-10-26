import { useEffect, useRef, useState } from 'react';
import { LabHead } from '../components/LabHead';
import { WhyQuiz } from '../components/WhyQuiz';
import { InsightResult, Predict } from '../components/Insight';

type Tab = 'saccade' | 'pursuit' | 'vestibular';

export function NeuroLab() {
  const [tab, setTab] = useState<Tab>('saccade');
  return (
    <section id="neuro" className="section">
      <LabHead
        id="neuro"
        lead="動きには、筋力だけでなく、目・耳の奥の平衡感覚・体からの感覚と、それをまとめる脳の働きが関わっています。眼の動きや平衡感覚は、医療でも神経の働きを調べる手がかりとして診察されます。3つのミニラボで、その仕組みを体験してみましょう（検査や診断ではありません）。"
        steps="上のタブから「すばやく見つける」「なめらかに追う」「視線を保つ」のどれかを選びます。測るテストでは、先に結果を予想してから始めます。"
        read="反応時間や追えた割合は、画面の大きさ・指かマウスか・慣れで大きく変わります。良い悪いの判定ではなく、同じ条件でくり返したときの「前回との比較」に使ってください。"
      />

      <div className="neuro-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'saccade'} className={tab === 'saccade' ? 'tab-active' : ''} onClick={() => setTab('saccade')}>
          すばやく見つける<span>サッケード（視線を飛ばす）</span>
        </button>
        <button role="tab" aria-selected={tab === 'pursuit'} className={tab === 'pursuit' ? 'tab-active' : ''} onClick={() => setTab('pursuit')}>
          なめらかに追う<span>追従眼球運動</span>
        </button>
        <button role="tab" aria-selected={tab === 'vestibular'} className={tab === 'vestibular' ? 'tab-active' : ''} onClick={() => setTab('vestibular')}>
          視線を保つ<span>耳の奥の平衡感覚（前庭）</span>
        </button>
      </div>

      <div className="neuro-stage">
        {tab === 'saccade' && <SaccadeTest />}
        {tab === 'pursuit' && <PursuitTest />}
        {tab === 'vestibular' && <VestibularLab />}
      </div>

      <WhyQuiz
        question="頭を左右に振っても、見ている文字がぶれずに見えるのはなぜ？"
        choices={["まばたきでごまかしているから", "耳の奥が頭の動きを感じ、目を反対向きに動かしているから", "ピントを合わせ直しているから"]}
        answer={1}
        explain="耳の奥の前庭が頭の動きを感じ取り、目を頭と反対の向きへすばやく動かして、視線を保っています（前庭動眼反射）。歩いたり走ったりしても景色がぶれにくいのは、この働きのおかげです。"
      />
      <p className="neuro-caution">
        ⚠ 体験中にめまい・吐き気・強い不快感が出た場合はすぐに中止してください。本コンテンツは学習用の体験であり、医学的診断ではありません。
      </p>
    </section>
  );
}

/* 前回の結果（この端末のブラウザにだけ保存。読めない環境では表示しない） */
function readLast(key: string): number | null {
  try {
    const v = localStorage.getItem(key);
    return v == null ? null : Number(v);
  } catch {
    return null;
  }
}

function saveLast(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* 保存できなくても体験は続けられる */
  }
}

/* ---------------- サッケード反応テスト ---------------- */

const SACCADE_ROUNDS = 8;

function SaccadeTest() {
  const [phase, setPhase] = useState<'idle' | 'wait' | 'target' | 'done'>('idle');
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [prev, setPrev] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<number | null | undefined>(undefined);
  const shownAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const scheduleNext = () => {
    setPhase('wait');
    timer.current = setTimeout(
      () => {
        setPos({ x: 12 + Math.random() * 76, y: 14 + Math.random() * 72 });
        shownAt.current = performance.now();
        setPhase('target');
      },
      450 + Math.random() * 900,
    );
  };

  const start = () => {
    setTimes([]);
    setRound(0);
    scheduleNext();
  };
  const again = () => {
    setPrediction(undefined);
    setTimes([]);
    setPhase('idle');
  };

  const hit = () => {
    const rt = performance.now() - shownAt.current;
    const next = [...times, rt];
    setTimes(next);
    if (round + 1 >= SACCADE_ROUNDS) {
      setPrev(readLast('neuro-saccade'));
      saveLast('neuro-saccade', Math.round(next.reduce((a, b) => a + b, 0) / next.length));
      setPhase('done');
    } else {
      setRound(round + 1);
      scheduleNext();
    }
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const best = times.length ? Math.round(Math.min(...times)) : 0;
  // 画面の大きさ・指かマウスか・機器で大きく変わるため、良し悪しの判定はしない
  const rating = '点数ではなく、自分の前回と比べるための数字です。画面の大きさや、指かマウスかで変わるので、同じ条件でくり返してください。';

  return (
    <div className="lab">
      <div className="lab-desc">
        <h3>すばやく見つける（サッケード反応テスト）</h3>
        <p>
          サッケード（衝動性眼球運動）は、視線を目標へ一瞬で飛ばす眼球運動で、前頭葉の眼球運動の領域や脳幹（上丘）などが関わります。このテストで測るのは、光点が見えてから指やマウスで押すまでの「反応時間」です。目の動きそのものではなく、見つける時間や手を動かす時間も含まれます。現れた光点をできるだけ速くタップ — {SACCADE_ROUNDS}回の平均を出します。
        </p>
      </div>
      {phase === 'idle' && (
        <div className="neuro-predict">
          <Predict
            question="光点が出てから押すまで、何ミリ秒くらいだと思いますか？"
            hint="1000ミリ秒 = 1秒"
            min={150}
            max={1200}
            step={10}
            initial={400}
            format={fmtMs}
            value={prediction}
            onChange={setPrediction}
            onStart={start}
          />
        </div>
      )}
      <div className="saccade-field">
        {phase === 'idle' && (
          <div className="neuro-idle">
            <div className="neuro-idle-demo" aria-hidden="true">
              <span className="neuro-idle-cross">+</span>
              <span className="neuro-idle-dot saccade" />
            </div>
            <p>「＋」のあと、どこかに光点が出ます。見つけたら、すぐにタップ（クリック）します。</p>
            {prediction !== undefined && (
              <button className="start-btn" onClick={start}>
                テスト開始
              </button>
            )}
          </div>
        )}
        {phase === 'wait' && <div className="saccade-fixation">+</div>}
        {phase === 'target' && (
          <button
            className="saccade-target"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onPointerDown={hit}
            aria-label="ターゲット"
          />
        )}
        {phase === 'done' && (
          <div className="lab-result">
            <div className="result-big">{avg}ms</div>
            <div className="result-sub">平均反応時間(最速 {best}ms)</div>
            <div className="result-rating">{rating}</div>
            <button className="start-btn" onClick={again}>
              もう一度（予想からやり直す）
            </button>
          </div>
        )}
        {(phase === 'wait' || phase === 'target') && (
          <div className="saccade-progress">
            {round + 1} / {SACCADE_ROUNDS}
          </div>
        )}
      </div>
      {phase === 'done' && (
        <div className="neuro-insight">
          <InsightResult
            labId="neuro"
            cardSub="すばやく見つける・8回の平均"
            title="予想と結果（8回の平均）"
            result={avg}
            prediction={prediction}
            previous={prev}
            format={fmtMs}
            min={150}
            max={1200}
            ticks={[200, 400, 600, 800, 1000, 1200]}
            gap={prediction != null ? saccadeGap(prediction, avg) : undefined}
            lowerIsCloser="左ほど速い"
            caption="この測り方（画面のどこかに出る光点を指やマウスで押す）は、画面の大きさや機器で大きく変わるため、比べられる研究の値がありません。帯は出さず、予想と前回の自分だけを並べています。"
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- 滑動性追従(スムースパースート) ---------------- */

const PURSUIT_SECONDS = 15;

function PursuitTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<number | null | undefined>(undefined);
  const pointer = useRef({ x: -999, y: -999 });

  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    let raf = 0;
    let hitFrames = 0;
    let totalFrames = 0;
    let t = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener('pointermove', onMove);

    const draw = (now: number) => {
      t += Math.min((now - last) / 1000, 0.05);
      last = now;
      if (t >= PURSUIT_SECONDS) {
        const score = totalFrames ? Math.round((hitFrames / totalFrames) * 100) : 0;
        setPrev(readLast('neuro-pursuit'));
        saveLast('neuro-pursuit', score);
        setResult(score);
        setRunning(false);
        return;
      }
      const x = w / 2 + w * 0.36 * Math.sin(t * 0.9 + 1.2);
      const y = h / 2 + h * 0.3 * Math.sin(t * 1.35);

      const dx = pointer.current.x - x;
      const dy = pointer.current.y - y;
      const onTarget = Math.hypot(dx, dy) < 46;
      totalFrames++;
      if (onTarget) hitFrames++;

      ctx.clearRect(0, 0, w, h);
      // 判定ゾーン
      ctx.beginPath();
      ctx.arc(x, y, 46, 0, Math.PI * 2);
      ctx.strokeStyle = onTarget ? 'rgba(200,242,78,0.8)' : 'rgba(91,140,255,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // ターゲット
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fillStyle = onTarget ? '#86B98C' : '#5E8BA8';
      ctx.fill();
      // スコアとタイマー
      ctx.fillStyle = 'rgba(242,241,236,0.75)';
      ctx.font = '600 14px "Zen Kaku Gothic New", sans-serif';
      ctx.fillText(`追従率 ${totalFrames ? Math.round((hitFrames / totalFrames) * 100) : 0}%`, 16, 26);
      ctx.fillText(`残り ${Math.ceil(PURSUIT_SECONDS - t)}s`, 16, 48);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
    };
  }, [running]);

  const rating =
    // 手の操作の慣れや機器で大きく変わるため、良し悪しの判定はしない
    result === null ? '' : '点数ではなく、自分の前回と比べるための数字です。手の操作の慣れや画面の大きさで変わるので、同じ条件でくり返してください。';

  return (
    <div className="lab">
      <div className="lab-desc">
        <h3>なめらかに追う（追従眼球運動）</h3>
        <p>
          動く物を滑らかに追う眼球運動（滑動性追従）には、小脳や大脳の視覚・眼球運動の領域などが関わります。このテストでは、動く光点にカーソル（指）を重ね続けられた割合を測ります。目の動きだけでなく、手の操作の正確さも含まれます。{PURSUIT_SECONDS}
          秒間、頭は動かさずに目で追いながら操作してみてください。
        </p>
      </div>
      {!running && result === null && (
        <div className="neuro-predict">
          <Predict
            question="動く光点に、何%くらい重ねていられると思いますか？"
            hint="15秒のうち、重ねていられた時間の割合"
            min={0}
            max={100}
            step={5}
            initial={60}
            format={fmtPct}
            value={prediction}
            onChange={setPrediction}
            onStart={() => setRunning(true)}
          />
        </div>
      )}
      <div className="pursuit-field">
        {running ? (
          <canvas ref={canvasRef} className="pursuit-canvas" />
        ) : (
          <div className="lab-result">
            {result === null && (
              <div className="neuro-idle">
                <div className="neuro-idle-demo" aria-hidden="true">
                  <span className="neuro-idle-dot pursuit" />
                </div>
                <p>ゆっくり動く光点に、カーソル（指）を重ね続けます。頭は動かさず、目で追いながら操作します。</p>
              </div>
            )}
            {result !== null && (
              <>
                <div className="result-big">{result}%</div>
                <div className="result-sub">光点に重ねられていた時間の割合</div>
                <div className="result-rating">{rating}</div>
              </>
            )}
            {(result !== null || prediction !== undefined) && (
            <button
              className="start-btn"
              onClick={() => {
                if (result !== null) {
                  setResult(null);
                  setPrediction(undefined);
                  return;
                }
                setRunning(true);
              }}
            >
              {result === null ? 'テスト開始' : 'もう一度（予想からやり直す）'}
            </button>
            )}
          </div>
        )}
      </div>
      {!running && result !== null && (
        <div className="neuro-insight">
          <InsightResult
            labId="neuro"
            cardSub="なめらかに追う・光点に重ねていられた割合"
            title="予想と結果"
            result={result}
            prediction={prediction}
            previous={prev}
            format={fmtPct}
            min={0}
            max={100}
            ticks={[0, 25, 50, 75, 100]}
            gap={prediction != null ? pursuitGap(prediction, result) : undefined}
            lowerIsCloser="右ほど、光点に重ねていられた"
            caption="手の操作の慣れや画面の大きさで大きく変わるため、比べられる研究の値がありません。帯は出さず、予想と前回の自分だけを並べています。"
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- 前庭システム(OKN + VOR) ---------------- */

function VestibularLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speed, setSpeed] = useState(2.5);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const [showDot, setShowDot] = useState(true);
  const showDotRef = useRef(showDot);
  showDotRef.current = showDot;

  // 視運動性刺激(OKN)ストライプ
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let offset = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      offset = (offset + speedRef.current) % 128;
      ctx.clearRect(0, 0, w, h);
      for (let x = -128 + offset; x < w + 128; x += 128) {
        ctx.fillStyle = '#14281D';
        ctx.fillRect(x, 0, 64, h);
        ctx.fillStyle = '#35553F';
        ctx.fillRect(x + 64, 0, 64, h);
      }
      if (showDotRef.current) {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#C0562F';
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // VORメトロノーム
  const [bpm, setBpm] = useState(100);
  const [vorOn, setVorOn] = useState(false);
  const [side, setSide] = useState<'L' | 'R'>('L');
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!vorOn) return;
    const beep = () => {
      const ctx = (audioRef.current ??= new AudioContext());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    };
    beep();
    const id = setInterval(() => {
      setSide((s) => (s === 'L' ? 'R' : 'L'));
      beep();
    }, 60000 / bpm);
    return () => clearInterval(id);
  }, [vorOn, bpm]);

  return (
    <div className="lab lab-vestibular">
      <div className="lab-desc">
        <h3>視線を保つ（耳の奥の平衡感覚）</h3>
        <p>
          耳の奥にある前庭は頭の動きを感じ取り、視線を安定させたり、姿勢を保ったりするのに役立っています。下の2つは、前庭リハビリで使われる刺激や運動を、体験用にしたものです。
        </p>
      </div>

      <div className="vestibular-grid">
        <div className="vest-card">
          <h4>流れるしま模様を見る（視運動性刺激）</h4>
          <p>流れるしま模様を見ると、目が自然に追っては戻る「視運動性眼振」が起こります。中央の点を見つめると、この目の動きは起こりにくくなります。見ていて揺れる感じや気分の悪さが出たら、すぐに中止してください。</p>
          <div className="okn-wrap">
            <canvas ref={canvasRef} className="okn-canvas" />
          </div>
          <label className="slider-row">
            <span className="slider-name">速度</span>
            <input type="range" min="-8" max="8" step="0.5" value={speed} onChange={(e) => setSpeed(+e.target.value)} />
            <span className="slider-val">{speed > 0 ? '→' : speed < 0 ? '←' : '停止'}</span>
          </label>
          <button className="chip" onClick={() => setShowDot(!showDot)}>
            {showDot ? '中央の点を消す' : '中央の点を表示'}
          </button>
        </div>

        <div className="vest-card">
          <h4>頭を振っても文字を見続ける（前庭動眼反射）</h4>
          <p>
            中央の「K」を見つめたまま、メトロノームに合わせて頭を小さく左右に振ります。頭が動いても文字がぶれずに見えるのは、前庭動眼反射が目を頭と反対向きに動かして、視線を保っているためです。まずは短い時間から。めまいやふらつきが出たら中止し、続く場合は医療機関にご相談ください。
          </p>
          <div className="vor-stage">
            <span className={`vor-arrow ${vorOn && side === 'L' ? 'vor-hot' : ''}`}>←</span>
            <span className="vor-letter">K</span>
            <span className={`vor-arrow ${vorOn && side === 'R' ? 'vor-hot' : ''}`}>→</span>
          </div>
          <label className="slider-row">
            <span className="slider-name">テンポ</span>
            <input type="range" min="60" max="160" step="5" value={bpm} onChange={(e) => setBpm(+e.target.value)} />
            <span className="slider-val">{bpm} BPM</span>
          </label>
          <button className={`start-btn ${vorOn ? 'stop' : ''}`} onClick={() => setVorOn(!vorOn)}>
            {vorOn ? '停止' : 'メトロノーム開始'}
          </button>
        </div>
      </div>
    </div>
  );
}

const fmtMs = (v: number) => `${Math.round(v)}ms`;
const fmtPct = (v: number) => `${Math.round(v)}%`;

/** 予想とのずれについての一言（良い悪いの判定はしない） */
function saccadeGap(pred: number, result: number) {
  const d = result - pred;
  if (Math.abs(d) < 60) return '予想とほぼ同じでした。';
  if (d > 0)
    return '予想より時間がかかりました。視線を飛ばすこと自体は一瞬ですが、光点を見つけて、手を動かして押すまでにも時間がかかります。';
  return '予想より速く押せました。目が光点をとらえる動きは、0.2秒ほどで始まるといわれます。';
}

function pursuitGap(pred: number, result: number) {
  const d = result - pred;
  if (Math.abs(d) < 10) return '予想とほぼ同じでした。';
  if (d > 0) return '予想より長く重ねていられました。';
  return '予想より短い結果でした。動きの向きが変わるところで、目と手が遅れやすくなります。';
}
