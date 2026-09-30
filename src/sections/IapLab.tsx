import { useEffect, useRef, useState } from 'react';

/**
 * 腹腔内圧(IAP)シミュレーター
 * 横隔膜・腹横筋・骨盤底筋の協調で「圧の円柱」がどう変わるかを体験する。
 */
export function IapLab() {
  const [dia, setDia] = useState(0.82); // 横隔膜の下降
  const [tva, setTva] = useState(0.8); // 腹壁の全周性拡張
  const [pf, setPf] = useState(0.8); // 骨盤底の追従
  const [frame, setFrame] = useState({ breath: 0, load: 0 });
  const [preset, setPreset] = useState('balance');
  const holdRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    let t = 0;
    let load = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      const breath = (Math.sin(t * 1.4) + 1) / 2; // 0=呼気, 1=吸気
      load += ((holdRef.current ? 1 : 0) - load) * Math.min(dt * 4, 1);
      setFrame({ breath, load });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const { breath, load } = frame;

  // --- 教育用の呼吸・支持モデル ---
  // 通常呼吸: 吸気で横隔膜と骨盤底が下降し、腹壁は全周へ拡張。呼気で一緒に戻る。
  // 負荷時: 呼吸運動を残しながら、横隔膜・腹壁・骨盤底の持続的な支持活動を加える。
  const drop = breath * (12 + 36 * dia); // 横隔膜の下降量 px
  const coordination = Math.max(
    0,
    1 - (Math.abs(dia - tva) + Math.abs(dia - pf) + Math.abs(tva - pf)) / 2.1,
  );
  const movementQuality = (dia + tva + pf) / 3;
  const breathPressure = (drop / 48) * (0.3 + 0.7 * ((tva + pf) / 2));
  const posturalPressure = load * coordination * movementQuality * 0.62;
  const pressure = Math.min(breathPressure * (1 - load * 0.25) + posturalPressure, 1);
  const support = Math.min((0.35 + pressure * 0.65) * coordination * movementQuality, 1);
  const wallExpansion = (drop / 48) * (8 + 30 * tva); // 吸気時の腹壁の全周性拡張
  const floorDescent = (drop / 48) * (6 + 22 * pf) * (1 - load * pf * 0.42); // 吸気で下降、負荷時は支持活動を加える
  const stress = Math.max(0, load * 0.95 - support); // 負荷に対する不足分
  const bend = stress * 30; // 脊柱のたわみ
  const mmhg = Math.round(6 + pressure * 84);
  const stability = Math.round(support * 100);

  const applyPreset = (id: string, values: [number, number, number]) => {
    setPreset(id);
    setDia(values[0]);
    setTva(values[1]);
    setPf(values[2]);
  };

  const changeValue = (setter: (value: number) => void, value: number) => {
    setPreset('custom');
    setter(value);
  };

  // --- SVGジオメトリ ---
  const diaY = 158 + drop;
  const domeH = 52 - drop * 0.45;
  const spineSegs = Array.from({ length: 7 }, (_, i) => {
    const y = 122 + i * 42;
    const dx = Math.sin((i / 6) * Math.PI) * bend;
    return { y, dx };
  });
  const wallX = 150 - wallExpansion;
  const floorY = 432 + floorDescent;

  const cavityPath = `
    M 152 ${diaY + 4}
    C 200 ${diaY - domeH + 10}, 272 ${diaY - domeH + 10}, 318 ${diaY + 4}
    L 318 424
    C 276 ${floorY}, 200 ${floorY}, 160 420
    C ${wallX + 6} 340, ${wallX + 6} 250, 152 ${diaY + 4}
    Z`;

  const gaugeCirc = 2 * Math.PI * 52;

  return (
    <section id="iap" className="section">
      <div className="section-head">
        <span className="section-index">01 / CORE PRESSURE</span>
        <h2>
          IAP LAB<span className="jp-sub">腹腔内圧シミュレーター</span>
        </h2>
        <p className="section-lead">
          腹圧は「お腹を固める力」だけではありません。横隔膜・腹壁・骨盤底が呼吸に合わせて協調し、体幹を全方向から支えることで、脊柱と関節にかかる負担を分散します。まず3つの状態を比べてから、スライダーで違いを確かめてください。
        </p>
      </div>

      <div className="iap-canister" aria-label="腹圧を作る3つの要素">
        <div><span>01 / CEILING</span><b>横隔膜</b><p>吸気で収縮・下降し、呼気で上昇する「天井」</p></div>
        <i>＋</i>
        <div><span>02 / WALL</span><b>腹壁</b><p>吸気で前・側方・後方へ広がり、呼気で戻る「壁」</p></div>
        <i>＋</i>
        <div><span>03 / FLOOR</span><b>骨盤底</b><p>吸気で下降、呼気で上昇し、負荷時は支持する「床」</p></div>
        <strong>＝ 360°の支持</strong>
      </div>

      <div className="iap-compare">
        <div className="iap-compare-head"><span>STEP 01</span><b>状態を選んで、違いを比較する</b></div>
        <div className="iap-presets">
          <button className={preset === 'balance' ? 'active' : ''} onClick={() => applyPreset('balance', [0.82, 0.8, 0.8])}><span>◎</span><b>呼吸と支持が協調</b><small>3つが同じリズムで動く</small></button>
          <button className={preset === 'brace' ? 'active' : ''} onClick={() => applyPreset('brace', [0.18, 0.95, 0.28])}><span>△</span><b>お腹だけ固める</b><small>横隔膜と骨盤底が追従しない</small></button>
          <button className={preset === 'leak' ? 'active' : ''} onClick={() => applyPreset('leak', [0.82, 0.28, 0.18])}><span>△</span><b>協調が崩れる</b><small>壁と床が圧を受け止めない</small></button>
        </div>
      </div>

      <div className="iap-grid">
        <div className="iap-stage">
          <svg viewBox="0 0 470 540" className="iap-svg" role="img" aria-label="腹腔内圧の断面モデル">
            <defs>
              <radialGradient id="pressureGrad" cx="50%" cy="55%" r="65%">
                <stop offset="0%" stopColor="#C0562F" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#C0562F" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#C0562F" stopOpacity="0.08" />
              </radialGradient>
            </defs>

            {/* 重り */}
            <g
              style={{
                opacity: load,
                transform: `translateY(${(1 - load) * -18}px)`,
                transition: 'opacity .1s linear',
              }}
            >
              <rect x="185" y={46 + stress * 16} width="140" height="30" rx="6" fill="#efeadc" />
              <text x="255" y={67 + stress * 16} textAnchor="middle" fontSize="15" fontWeight="700" fill="#14271c">
                40kg
              </text>
              <path
                d={`M 255 ${80 + stress * 16} L 255 100`}
                stroke="#efeadc"
                strokeWidth="3"
                markerEnd="none"
              />
            </g>

            {/* 腹腔(圧の可視化) */}
            <path d={cavityPath} fill="url(#pressureGrad)" opacity={0.15 + pressure * 0.8} />
            <path d={cavityPath} fill="none" stroke="#C0562F" strokeOpacity={0.25 + pressure * 0.5} strokeWidth="1.5" />

            {/* 圧の矢印 */}
            {[0, 90, 180, 270].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 235 300)`} opacity={0.25 + pressure * 0.75}>
                <line
                  x1="235"
                  y1={300 - 28 - pressure * 20}
                  x2="235"
                  y2={300 - 46 - pressure * 46}
                  stroke="#ffd8d3"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d={`M 228 ${300 - 42 - pressure * 46} L 235 ${300 - 54 - pressure * 46} L 242 ${300 - 42 - pressure * 46}`}
                  fill="none"
                  stroke="#ffd8d3"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}

            {/* 脊柱 */}
            {spineSegs.map((s, i) => (
              <rect
                key={i}
                x={330 + s.dx}
                y={s.y}
                width="26"
                height="30"
                rx="7"
                fill={stress > 0.25 ? '#C0562F' : '#ddd6c4'}
                style={{ transition: 'fill .2s' }}
              />
            ))}

            {/* 横隔膜 */}
            <path
              d={`M 148 ${diaY} C 200 ${diaY - domeH}, 272 ${diaY - domeH}, 322 ${diaY}`}
              fill="none"
              stroke="#5E8BA8"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* 腹横筋(前壁) */}
            <path
              d={`M 150 ${diaY + 8} C ${wallX} 260, ${wallX} 340, 158 418`}
              fill="none"
              stroke="#86B98C"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* 骨盤底筋 */}
            <path
              d={`M 158 424 C 200 ${floorY + 10}, 278 ${floorY + 10}, 320 428`}
              fill="none"
              stroke="#C9982F"
              strokeWidth="9"
              strokeLinecap="round"
            />

            {/* ラベル */}
            <text x="118" y={diaY - domeH - 8} className="iap-label" fill="#5E8BA8">
              横隔膜
            </text>
            <text x={wallX - 46} y="300" className="iap-label" fill="#86B98C">
              腹壁
            </text>
            <text x="180" y={floorY + 34} className="iap-label" fill="#C9982F">
              骨盤底筋
            </text>
            <text x="392" y="110" className="iap-label" fill="#ddd6c4">
              脊柱
            </text>

            {/* 呼吸インジケータ */}
            <text x="24" y="36" className="iap-breath" fill="#a4b8ab">
              {breath > 0.5 ? '↓ 吸気(息を吸う)' : '↑ 呼気(息を吐く)'}
            </text>
            <text x="24" y="57" className="iap-phase-note" fill="#a4b8ab">
              {breath > 0.5 ? '横隔膜・骨盤底は下降 / 腹壁は全周へ広がる' : '横隔膜・骨盤底は上昇 / 腹壁は内側へ戻る'}
            </text>
          </svg>
        </div>

        <div className="iap-controls">
          <div className="iap-control-head"><span>STEP 02</span><b>数値を動かして観察する</b></div>
          <div className="iap-gauges">
            <div className="gauge">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E1D2" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#C0562F"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCirc}
                  strokeDashoffset={gaugeCirc * (1 - pressure)}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="56" textAnchor="middle" className="gauge-num" fill="#1B1B17">
                  {mmhg}
                </text>
                <text x="60" y="76" textAnchor="middle" className="gauge-unit" fill="#7E8F84">
                  mmHg
                </text>
              </svg>
              <span>腹腔内圧</span>
            </div>
            <div className="gauge">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E1D2" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={stress > 0.25 ? '#C0562F' : '#86B98C'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={gaugeCirc}
                  strokeDashoffset={gaugeCirc * (1 - stability / 100)}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="56" textAnchor="middle" className="gauge-num" fill="#1B1B17">
                  {stability}
                </text>
                <text x="60" y="76" textAnchor="middle" className="gauge-unit" fill="#7E8F84">
                  安定性
                </text>
              </svg>
              <span>体幹の安定性</span>
            </div>
          </div>

          <label className="slider-row">
            <span className="slider-name" style={{ color: '#5E8BA8' }}>
              横隔膜の下降
            </span>
            <input type="range" min="0" max="1" step="0.01" value={dia} onChange={(e) => changeValue(setDia, +e.target.value)} />
            <span className="slider-val">{Math.round(dia * 100)}%</span>
          </label>
          <label className="slider-row">
            <span className="slider-name" style={{ color: '#86B98C' }}>
              腹壁の広がり
            </span>
            <input type="range" min="0" max="1" step="0.01" value={tva} onChange={(e) => changeValue(setTva, +e.target.value)} />
            <span className="slider-val">{Math.round(tva * 100)}%</span>
          </label>
          <label className="slider-row">
            <span className="slider-name" style={{ color: '#C9982F' }}>
              骨盤底の追従
            </span>
            <input type="range" min="0" max="1" step="0.01" value={pf} onChange={(e) => changeValue(setPf, +e.target.value)} />
            <span className="slider-val">{Math.round(pf * 100)}%</span>
          </label>

          <button
            className="load-btn"
            onPointerDown={() => (holdRef.current = true)}
            onPointerUp={() => (holdRef.current = false)}
            onPointerLeave={() => (holdRef.current = false)}
          >
            STEP 03　長押しで負荷を加える（40kg）
          </button>

          <div className={`iap-verdict ${stress > 0.25 ? 'bad' : pressure > 0.55 ? 'good' : ''}`}>
            {stress > 0.25
              ? '⚠ 負荷に対して支持が不足しています。脊柱が代わりにたわむ様子を確認してください。'
              : support > 0.55 && coordination > 0.72
                ? '◎ 吸気で3つが一緒に下降・拡張し、呼気で一緒に戻っています。負荷時も呼吸を残しながら支持できる状態です。'
                : coordination < 0.55
                  ? '△ 動くタイミングが揃っていません。ひとつを強く固めるのではなく、3つの数値を近づけてみましょう。'
                  : '吸気では横隔膜と骨盤底が下降し、腹壁が全周へ広がります。呼気では3つが一緒に元の位置へ戻ります。'}
          </div>
          <p className="iap-disclaimer">※ 数値は仕組みを理解するための教育用モデルで、実測値や医学的診断を示すものではありません。</p>
        </div>
      </div>
    </section>
  );
}
