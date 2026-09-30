import { useRef, useState } from 'react';

type Phase = 'preview' | 'reproduce' | 'result';

const TARGETS = [32, 48, 63, 78, 104, 119, 136, 151];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function nextTarget(previous: number) {
  const options = TARGETS.filter((value) => Math.abs(value - previous) > 22);
  return options[Math.floor(Math.random() * options.length)];
}

function Arm({ angle, color, opacity = 1 }: { angle: number; color: string; opacity?: number }) {
  const rad = (angle * Math.PI) / 180;
  const elbow = { x: 170 + Math.cos(rad) * 105, y: 178 - Math.sin(rad) * 105 };
  const hand = { x: elbow.x + Math.cos(rad) * 62, y: elbow.y - Math.sin(rad) * 62 };

  return (
    <g opacity={opacity}>
      <line x1="170" y1="178" x2={elbow.x} y2={elbow.y} stroke={color} strokeWidth="18" strokeLinecap="round" />
      <line x1={elbow.x} y1={elbow.y} x2={hand.x} y2={hand.y} stroke={color} strokeWidth="14" strokeLinecap="round" />
      <circle cx="170" cy="178" r="14" fill={color} />
      <circle cx={elbow.x} cy={elbow.y} r="12" fill={color} />
      <circle cx={hand.x} cy={hand.y} r="11" fill={color} />
    </g>
  );
}

export function ProprioceptionLab() {
  const [phase, setPhase] = useState<Phase>('preview');
  const [target, setTarget] = useState(48);
  const [angle, setAngle] = useState(90);
  const [scores, setScores] = useState<number[]>([]);
  const stageRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + (170 / 420) * rect.width;
    const cy = rect.top + (178 / 300) * rect.height;
    const degree = (Math.atan2(cy - clientY, clientX - cx) * 180) / Math.PI;
    setAngle(Math.round(clamp(degree, 15, 165)));
  };

  const startReproduction = () => {
    setAngle(90);
    setPhase('reproduce');
  };

  const check = () => {
    setScores((current) => [...current, Math.abs(target - angle)]);
    setPhase('result');
  };

  const next = () => {
    setTarget((current) => nextTarget(current));
    setAngle(90);
    setPhase('preview');
  };

  const reset = () => {
    setScores([]);
    setTarget(nextTarget(target));
    setAngle(90);
    setPhase('preview');
  };

  const error = Math.abs(target - angle);
  const average = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
  const resultTone = error <= 5 ? 'good' : error <= 12 ? '' : 'bad';

  return (
    <section id="proprioception" className="section">
      <div className="section-head">
        <span className="section-index">03 / POSITION SENSE</span>
        <h2>POSITION LAB<span className="jp-sub">位置再現ゲーム</span></h2>
        <p className="section-lead">関節がどの位置にあるかを感じる能力は、固有感覚の一部です。見本の腕の角度を覚え、見本が消えたあとに同じ位置を再現して、角度の誤差を確認します。</p>
      </div>

      <div className="position-notice"><b>この体験で測るもの</b><p>画面上での位置再現には、視覚記憶・注意・マウスや指の操作も関係します。実際の関節位置覚検査や医学的診断ではありません。</p></div>

      <div className="position-grid">
        <div className={`position-stage phase-${phase}`}>
          <div className="position-stage-head"><span>TRIAL {Math.min(scores.length + 1, 3)} / 3</span><b>{phase === 'preview' ? '見本の角度を覚える' : phase === 'reproduce' ? '見本と同じ角度を再現する' : '見本と再現位置を比較する'}</b></div>
          <svg
            ref={stageRef}
            viewBox="0 0 420 300"
            role="img"
            aria-label="腕の角度を再現するモデル"
            onPointerDown={(event) => {
              if (phase !== 'reproduce') return;
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              updateFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (dragging.current && phase === 'reproduce') updateFromPointer(event.clientX, event.clientY);
            }}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            <path d="M 55 178 A 115 115 0 0 0 285 178" fill="none" stroke="#2e4a3b" strokeWidth="1" strokeDasharray="4 8" />
            {[30, 60, 90, 120, 150].map((tick) => {
              const rad = (tick * Math.PI) / 180;
              return <circle key={tick} cx={170 + Math.cos(rad) * 115} cy={178 - Math.sin(rad) * 115} r="2.5" fill="#6f8779" />;
            })}
            {(phase === 'preview' || phase === 'result') && <Arm angle={target} color="#C9982F" opacity={phase === 'result' ? 0.55 : 1} />}
            {(phase === 'reproduce' || phase === 'result') && <Arm angle={angle} color="#8FB8A0" />}
            <circle cx="170" cy="178" r="25" fill="none" stroke="#8fb8a055" />
            <text x="170" y="235" textAnchor="middle" className="position-svg-label">
              {phase === 'preview' ? 'TARGET' : phase === 'reproduce' ? 'DRAG THE ARM' : `ERROR ${error}°`}
            </text>
          </svg>
          {phase === 'reproduce' && <p className="position-drag-hint">腕をドラッグして角度を合わせてください</p>}
        </div>

        <div className="position-controls">
          <div className="position-steps">
            <div className={phase === 'preview' ? 'active' : ''}><span>01</span><b>覚える</b></div>
            <div className={phase === 'reproduce' ? 'active' : ''}><span>02</span><b>再現する</b></div>
            <div className={phase === 'result' ? 'active' : ''}><span>03</span><b>比べる</b></div>
          </div>

          {phase === 'preview' && <button className="start-btn position-main-btn" onClick={startReproduction}>角度を覚えた → 見本を隠す</button>}

          {phase === 'reproduce' && (
            <>
              <label className="slider-row position-slider"><span>腕の角度</span><input type="range" min="15" max="165" value={angle} onChange={(event) => setAngle(+event.target.value)} /><span className="slider-val">{angle}°</span></label>
              <button className="start-btn position-main-btn" onClick={check}>この位置で決定</button>
            </>
          )}

          {phase === 'result' && (
            <>
              <div className={`position-result ${resultTone}`}><span>今回の誤差</span><strong>{error}<small>°</small></strong><p>{error <= 5 ? '見本にかなり近い位置です。' : error <= 12 ? '少し位置のずれがあります。' : '見本との位置差が大きくなりました。'}</p></div>
              {scores.length < 3 ? <button className="start-btn position-main-btn" onClick={next}>次の角度へ</button> : <button className="start-btn position-main-btn" onClick={reset}>もう一度試す</button>}
            </>
          )}

          <div className="position-score"><span>完了</span><b>{scores.length} / 3</b><span>平均誤差</span><b>{scores.length ? `${average.toFixed(1)}°` : '—'}</b></div>
        </div>
      </div>
    </section>
  );
}
