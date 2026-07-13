import { useEffect, useRef, useState } from 'react';

type Tab = 'saccade' | 'pursuit' | 'vestibular';

export function NeuroLab() {
  const [tab, setTab] = useState<Tab>('saccade');
  return (
    <section id="neuro" className="section">
      <div className="section-head">
        <span className="section-index">03</span>
        <h2>
          NEURO LAB<span className="jp-sub">機能神経学ラボ</span>
        </h2>
        <p className="section-lead">
          動きの質は、筋力より先に「脳への入力」で決まります。眼球運動と前庭系は脳幹・小脳の状態を映す窓。3つのミニラボで、自分の神経系をテストしてみましょう。
        </p>
      </div>

      <div className="neuro-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'saccade'} className={tab === 'saccade' ? 'tab-active' : ''} onClick={() => setTab('saccade')}>
          サッケード<span>衝動性眼球運動</span>
        </button>
        <button role="tab" aria-selected={tab === 'pursuit'} className={tab === 'pursuit' ? 'tab-active' : ''} onClick={() => setTab('pursuit')}>
          追従眼球運動<span>スムースパースート</span>
        </button>
        <button role="tab" aria-selected={tab === 'vestibular'} className={tab === 'vestibular' ? 'tab-active' : ''} onClick={() => setTab('vestibular')}>
          前庭システム<span>OKN / VOR</span>
        </button>
      </div>

      <div className="neuro-stage">
        {tab === 'saccade' && <SaccadeTest />}
        {tab === 'pursuit' && <PursuitTest />}
        {tab === 'vestibular' && <VestibularLab />}
      </div>

      <p className="neuro-caution">
        ⚠ 体験中にめまい・吐き気・強い不快感が出た場合はすぐに中止してください。本コンテンツは学習用の体験であり、医学的診断ではありません。
      </p>
    </section>
  );
}

/* ---------------- サッケード反応テスト ---------------- */

const SACCADE_ROUNDS = 8;

function SaccadeTest() {
  const [phase, setPhase] = useState<'idle' | 'wait' | 'target' | 'done'>('idle');
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [pos, setPos] = useState({ x: 50, y: 50 });
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

  const hit = () => {
    const rt = performance.now() - shownAt.current;
    const next = [...times, rt];
    setTimes(next);
    if (round + 1 >= SACCADE_ROUNDS) {
      setPhase('done');
    } else {
      setRound(round + 1);
      scheduleNext();
    }
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const best = times.length ? Math.round(Math.min(...times)) : 0;
  const rating = avg < 420 ? '◎ 優秀 — 視覚→運動の変換が高速です' : avg < 550 ? '○ 良好 — 平均的な反応速度です' : '△ 伸びしろあり — 眼のウォームアップを習慣に';

  return (
    <div className="lab">
      <div className="lab-desc">
        <h3>サッケード反応テスト</h3>
        <p>
          サッケードは、視線をターゲットへ一瞬でジャンプさせる眼球運動。前頭葉と脳幹(上丘)が担い、読書やスポーツの「眼の速さ」の土台です。現れた光点をできるだけ速くタップ — {SACCADE_ROUNDS}回の平均反応時間を計測します。
        </p>
      </div>
      <div className="saccade-field">
        {phase === 'idle' && (
          <button className="start-btn" onClick={start}>
            テスト開始
          </button>
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
            <button className="start-btn" onClick={start}>
              もう一度
            </button>
          </div>
        )}
        {(phase === 'wait' || phase === 'target') && (
          <div className="saccade-progress">
            {round + 1} / {SACCADE_ROUNDS}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 滑動性追従(スムースパースート) ---------------- */

const PURSUIT_SECONDS = 15;

function PursuitTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
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
        setResult(totalFrames ? Math.round((hitFrames / totalFrames) * 100) : 0);
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
    result === null ? '' : result >= 75 ? '◎ 優秀 — 小脳の追従制御が滑らかです' : result >= 50 ? '○ 良好 — 練習でさらに滑らかに' : '△ 眼が跳んでいます — ゆっくり大きく追う練習を';

  return (
    <div className="lab">
      <div className="lab-desc">
        <h3>スムースパースート(滑動性追従)</h3>
        <p>
          動くものを「滑らかに」追い続ける眼球運動で、小脳と頭頂葉のチームワークが問われます。動く光点にカーソル(指)を重ね続けてください。{PURSUIT_SECONDS}
          秒間の追従率を計測します。頭は動かさず、眼だけで追うのがコツ。
        </p>
      </div>
      <div className="pursuit-field">
        {running ? (
          <canvas ref={canvasRef} className="pursuit-canvas" />
        ) : (
          <div className="lab-result">
            {result !== null && (
              <>
                <div className="result-big">{result}%</div>
                <div className="result-sub">追従率</div>
                <div className="result-rating">{rating}</div>
              </>
            )}
            <button
              className="start-btn"
              onClick={() => {
                setResult(null);
                setRunning(true);
              }}
            >
              {result === null ? 'テスト開始' : 'もう一度'}
            </button>
          </div>
        )}
      </div>
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
        <h3>前庭システム(バランスの感覚)</h3>
        <p>
          内耳の前庭は「頭がどう動いたか」を検知し、眼と姿勢を自動調整します。下の2つは前庭リハビリでも使われる定番の刺激です。
        </p>
      </div>

      <div className="vestibular-grid">
        <div className="vest-card">
          <h4>視運動性刺激(OKN)</h4>
          <p>流れるストライプを眺めると、眼が勝手に動く「視運動性眼振」が誘発されます。中央の赤い点を見つめると、視覚への依存度をテストできます。</p>
          <div className="okn-wrap">
            <canvas ref={canvasRef} className="okn-canvas" />
          </div>
          <label className="slider-row">
            <span className="slider-name">速度</span>
            <input type="range" min="-8" max="8" step="0.5" value={speed} onChange={(e) => setSpeed(+e.target.value)} />
            <span className="slider-val">{speed > 0 ? '→' : speed < 0 ? '←' : '停止'}</span>
          </label>
          <button className="chip" onClick={() => setShowDot(!showDot)}>
            {showDot ? '固視点を消す' : '固視点を表示'}
          </button>
        </div>

        <div className="vest-card">
          <h4>VOR(前庭動眼反射)ドリル</h4>
          <p>
            中央の「K」から目を離さず、メトロノームに合わせて頭を左右に振ります。文字がブレずに読めていれば、前庭と眼の連携(VOR)が機能しています。1回20〜30秒から。
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
