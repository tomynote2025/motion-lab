import { useEffect, useRef, useState } from 'react';

/**
 * NUTRI LAB — 分子栄養学
 * PFCバランス(三大栄養素の比率と分子レベルの役割)と、
 * 超加工食品(ultra-processed food)の摂りすぎが血糖・満腹感・腸内環境・炎症に及ぼす影響を体験する。
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type Tab = 'pfc' | 'processed';

export function NutriLab() {
  const [tab, setTab] = useState<Tab>('pfc');
  return (
    <section id="nutri" className="section">
      <div className="section-head">
        <span className="section-index">05</span>
        <h2>
          NUTRI LAB<span className="jp-sub">分子栄養学ラボ</span>
        </h2>
        <p className="section-lead">
          食べたものは、分子になって体をつくり、動かします。三大栄養素(PFC)のバランスを調整し、加工食品を摂りすぎると体の中で何が起きるのか —
          スライダーで“分子の視点”から確かめてください。
        </p>
      </div>

      <div className="neuro-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'pfc'} className={tab === 'pfc' ? 'tab-active' : ''} onClick={() => setTab('pfc')}>
          PFCバランス<span>PROTEIN / FAT / CARB</span>
        </button>
        <button role="tab" aria-selected={tab === 'processed'} className={tab === 'processed' ? 'tab-active' : ''} onClick={() => setTab('processed')}>
          加工食品の影響<span>ULTRA-PROCESSED</span>
        </button>
      </div>

      {tab === 'pfc' ? <PfcLab /> : <ProcessedLab />}

      <p className="neuro-caution">
        目安値は日本人の食事摂取基準(2020)等を参考にした一般的な範囲で、必要量は年齢・活動量・目的で変わります。本コンテンツは概念を体感するための教育用モデルです。
      </p>
    </section>
  );
}

/* =============== PFCバランス =============== */

const KCAL = { p: 4, f: 9, c: 4 };

const ACTIVITIES = [
  { f: 1.2, label: 'ほとんど運動しない(デスクワーク中心)' },
  { f: 1.375, label: '軽い運動(週1〜2回)' },
  { f: 1.55, label: '中程度(週3〜5回)' },
  { f: 1.725, label: '活発(週6〜7回)' },
  { f: 1.9, label: '非常に活発(肉体労働・アスリート)' },
];

const GOALS = {
  cut: { adj: 0.85, label: '減量' },
  maintain: { adj: 1, label: '維持' },
  bulk: { adj: 1.1, label: '増量' },
} as const;
type Goal = keyof typeof GOALS;

function PfcLab() {
  const [kcal, setKcal] = useState(2000);
  const [pRaw, setPRaw] = useState(25);
  const [fRaw, setFRaw] = useState(25);
  const [cRaw, setCRaw] = useState(50);

  // 個人プロフィール
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState(35);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(65);
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState<Goal>('maintain');

  // Mifflin-St Jeor 式による基礎代謝(BMR)→ 活動量 → 総消費カロリー(TDEE)
  const bmr = Math.round(sex === 'male' ? 10 * weight + 6.25 * height - 5 * age + 5 : 10 * weight + 6.25 * height - 5 * age - 161);
  const tdee = Math.round(bmr * activity);
  const targetKcal = clamp(Math.round((tdee * GOALS[goal].adj) / 50) * 50, 1200, 3200);
  const proteinTarget = Math.round(weight * 1.6); // 目安 1.6 g/kg
  const applied = kcal === targetKcal;

  const sum = pRaw + fRaw + cRaw || 1;
  const pPct = (pRaw / sum) * 100;
  const fPct = (fRaw / sum) * 100;
  const cPct = (cRaw / sum) * 100;

  const gP = Math.round((kcal * (pPct / 100)) / KCAL.p);
  const gF = Math.round((kcal * (fPct / 100)) / KCAL.f);
  const gC = Math.round((kcal * (cPct / 100)) / KCAL.c);

  // 目安レンジ(一般成人)
  const inP = pPct >= 13 && pPct <= 25;
  const inF = fPct >= 20 && fPct <= 30;
  const inC = cPct >= 50 && cPct <= 65;
  const balanced = inP && inF && inC;

  const verdict = balanced
    ? '◎ バランス良好。エネルギー源(糖質)・体をつくる材料(たんぱく質)・ホルモンや細胞膜(脂質)が過不足なく揃っています。'
    : fPct > 35
      ? '⚠ 脂質が多め。脂質は9kcal/gと高密度。摂りすぎは総カロリー過多と中性脂肪の増加につながります。'
      : cPct > 65
        ? '⚠ 糖質が多め。血糖の乱高下を招きやすく、余った糖は中性脂肪として蓄えられます。'
        : pPct < 13
          ? '⚠ たんぱく質が不足気味。筋・酵素・ホルモン・免疫の材料が足りず、代謝が落ちやすくなります。'
          : '○ おおむね許容範囲。目安レンジ(P13-25% / F20-30% / C50-65%)に寄せると理想的です。';

  const R = 92;
  const C = 2 * Math.PI * R;
  const off = (before: number) => -(before / 100) * C;

  const macros = [
    { key: 'P', name: 'たんぱく質', pct: pPct, g: gP, color: '#C0562F', role: 'アミノ酸に分解 → 筋・酵素・ホルモン・免疫の材料', ok: inP },
    { key: 'F', name: '脂質', pct: fPct, g: gF, color: '#C9982F', role: '脂肪酸に分解 → 細胞膜・ホルモン・脂溶性ビタミンの吸収', ok: inF },
    { key: 'C', name: '炭水化物', pct: cPct, g: gC, color: '#5E8BA8', role: 'グルコースに分解 → 脳と筋の即時エネルギー', ok: inC },
  ];

  return (
    <>
      <div className="profile-card">
        <div className="profile-head">
          <div>
            <b>あなたに合わせる</b>
            <span>身長・体重・年齢から1日の消費カロリー(TDEE)を計算</span>
          </div>
          <div className="seg">
            <button className={sex === 'male' ? 'seg-on' : ''} onClick={() => setSex('male')}>
              男性
            </button>
            <button className={sex === 'female' ? 'seg-on' : ''} onClick={() => setSex('female')}>
              女性
            </button>
          </div>
        </div>

        <div className="profile-inputs">
          <label className="pf-field">
            <span>身長</span>
            <input type="number" min="120" max="220" value={height} onChange={(e) => setHeight(clamp(+e.target.value || 0, 0, 250))} />
            <em>cm</em>
          </label>
          <label className="pf-field">
            <span>体重</span>
            <input type="number" min="30" max="200" value={weight} onChange={(e) => setWeight(clamp(+e.target.value || 0, 0, 300))} />
            <em>kg</em>
          </label>
          <label className="pf-field">
            <span>年齢</span>
            <input type="number" min="10" max="100" value={age} onChange={(e) => setAge(clamp(+e.target.value || 0, 0, 120))} />
            <em>歳</em>
          </label>
          <label className="pf-field pf-select">
            <span>活動量</span>
            <select value={activity} onChange={(e) => setActivity(+e.target.value)}>
              {ACTIVITIES.map((a) => (
                <option key={a.f} value={a.f}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <div className="pf-field pf-goal">
            <span>目的</span>
            <div className="seg">
              {(Object.keys(GOALS) as Goal[]).map((g) => (
                <button key={g} className={goal === g ? 'seg-on' : ''} onClick={() => setGoal(g)}>
                  {GOALS[g].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-result">
          <div className="pf-metric">
            <span>基礎代謝(BMR)</span>
            <b>{bmr}</b>
            <em>kcal</em>
          </div>
          <div className="pf-metric">
            <span>消費カロリー(TDEE)</span>
            <b>{tdee}</b>
            <em>kcal</em>
          </div>
          <div className="pf-metric hl">
            <span>目標({GOALS[goal].label})</span>
            <b>{targetKcal}</b>
            <em>kcal</em>
          </div>
          <button className={`start-btn ${applied ? 'applied' : ''}`} onClick={() => setKcal(targetKcal)} disabled={applied}>
            {applied ? '✓ 反映済み' : 'この目標を反映'}
          </button>
        </div>
        <p className="profile-hint">
          目安のたんぱく質量 <b>{proteinTarget}g/日</b>(体重×1.6g)。数値を変えるとリアルタイムで再計算します。
        </p>
      </div>

      <div className="nutri-grid">
        <div className="iap-stage nutri-stage">
        <svg viewBox="0 0 260 260" className="nutri-donut" role="img" aria-label="PFCバランスのドーナツチャート">
          <circle cx="130" cy="130" r={R} fill="none" stroke="#E6E1D2" strokeWidth="30" />
          <circle cx="130" cy="130" r={R} fill="none" stroke="#C0562F" strokeWidth="30" strokeDasharray={`${(pPct / 100) * C} ${C}`} strokeDashoffset={off(0)} transform="rotate(-90 130 130)" />
          <circle cx="130" cy="130" r={R} fill="none" stroke="#C9982F" strokeWidth="30" strokeDasharray={`${(fPct / 100) * C} ${C}`} strokeDashoffset={off(pPct)} transform="rotate(-90 130 130)" />
          <circle cx="130" cy="130" r={R} fill="none" stroke="#5E8BA8" strokeWidth="30" strokeDasharray={`${(cPct / 100) * C} ${C}`} strokeDashoffset={off(pPct + fPct)} transform="rotate(-90 130 130)" />
          <text x="130" y="122" textAnchor="middle" className="donut-kcal" fill="#1B1B17">
            {kcal}
          </text>
          <text x="130" y="146" textAnchor="middle" className="donut-unit" fill="#7E8F84">
            kcal / 日
          </text>
        </svg>

        <div className="macro-legend">
          {macros.map((m) => (
            <div key={m.key} className="macro-item">
              <span className="macro-dot" style={{ background: m.color }} />
              <div className="macro-text">
                <div className="macro-head">
                  <b style={{ color: m.color }}>{m.name}</b>
                  <span>
                    {Math.round(m.pct)}% ・ {m.g}g
                  </span>
                </div>
                <div className="macro-role">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="iap-controls">
        <label className="slider-row">
          <span className="slider-name">総カロリー</span>
          <input type="range" min="1200" max="3200" step="50" value={kcal} onChange={(e) => setKcal(+e.target.value)} />
          <span className="slider-val">{kcal}</span>
        </label>
        <label className="slider-row">
          <span className="slider-name" style={{ color: '#C0562F' }}>
            たんぱく質
          </span>
          <input type="range" min="5" max="60" step="1" value={pRaw} onChange={(e) => setPRaw(+e.target.value)} />
          <span className="slider-val">{Math.round(pPct)}%</span>
        </label>
        <label className="slider-row">
          <span className="slider-name" style={{ color: '#C9982F' }}>
            脂質
          </span>
          <input type="range" min="5" max="60" step="1" value={fRaw} onChange={(e) => setFRaw(+e.target.value)} />
          <span className="slider-val">{Math.round(fPct)}%</span>
        </label>
        <label className="slider-row">
          <span className="slider-name" style={{ color: '#5E8BA8' }}>
            炭水化物
          </span>
          <input type="range" min="5" max="80" step="1" value={cRaw} onChange={(e) => setCRaw(+e.target.value)} />
          <span className="slider-val">{Math.round(cPct)}%</span>
        </label>

        <div className="fascia-note">
          <b>PFC</b>は Protein(たんぱく質)・Fat(脂質)・Carbohydrate(炭水化物)。同じカロリーでも比率で体の作られ方が変わります。目安レンジは
          <b> P 13-25% / F 20-30% / C 50-65%</b>(1g あたり P・C=4kcal、F=9kcal)。
        </div>

        <div className={`iap-verdict ${balanced ? 'good' : ''}`}>{verdict}</div>
      </div>
      </div>
    </>
  );
}

/* =============== 加工食品の影響:血糖と腸内環境 =============== */

function ProcessedLab() {
  const [proc, setProc] = useState(0.65); // 超加工食品の割合
  const [animT, setAnimT] = useState(1); // 曲線の描画進捗 0..1
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const eat = () => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const dur = 3200;
    setAnimT(0);
    const loop = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setAnimT(p);
      if (p < 1) raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };

  // 血糖モデル(食後 0〜3時間, mg/dL)
  const glucose = (h: number, p: number) => {
    const base = 90;
    const amp = 30 + 60 * p; // 加工度が高いほど鋭いスパイク
    const tpeak = 1.0 - 0.42 * p;
    const width = 0.5 - 0.16 * p;
    const spike = amp * Math.exp(-((h - tpeak) ** 2) / (2 * width * width));
    const under = 26 * p * Math.exp(-((h - (tpeak + 1.05)) ** 2) / (2 * 0.4 * 0.4)); // 反応性低血糖
    return clamp(base + spike - under, 62, 200);
  };

  const W = 470;
  const Hh = 300;
  const x0 = 52;
  const x1 = 452;
  const gTop = 200;
  const gBot = 62;
  const yTop = 40;
  const yBot = 268;
  const xForH = (h: number) => x0 + (h / 3) * (x1 - x0);
  const yForG = (g: number) => yBot - ((g - gBot) / (gTop - gBot)) * (yBot - yTop);

  const buildPath = (p: number, upto: number) => {
    const maxH = 3 * upto;
    let d = '';
    for (let h = 0; h <= maxH + 0.001; h += 0.06) {
      const hh = Math.min(h, 3);
      d += `${d ? 'L' : 'M'} ${xForH(hh).toFixed(1)} ${yForG(glucose(hh, p)).toFixed(1)} `;
    }
    return d;
  };

  const peak = Math.round(90 + (30 + 60 * proc)); // おおよそのピーク
  const cursorH = 3 * animT;
  const cursorG = Math.round(glucose(Math.min(cursorH, 3), proc));

  const diversity = Math.round(90 - 55 * proc); // 腸内細菌の多様性
  const inflammation = Math.round(12 + 73 * proc); // 慢性炎症リスク
  const satiety = (3.2 - 2.1 * proc).toFixed(1); // 満腹感の持続(時間)

  const gaugeCirc = 2 * Math.PI * 52;

  const verdict =
    proc > 0.6
      ? '⚠ 精製糖・精製油が血糖を急上昇 → インスリン過剰 → 余った糖は中性脂肪に。その後の急降下(反応性低血糖)がすぐの空腹を呼び、食べすぎの悪循環に。食物繊維の欠如で腸内細菌の多様性も低下します。'
      : proc > 0.3
        ? '○ ほどほど。加工食品が増えるほど血糖の振れ幅が大きくなり、満腹感が続きにくくなります。'
        : '◎ 未加工〜低加工中心。血糖はゆるやかに上下し、食物繊維が腸内細菌を養い、短鎖脂肪酸が腸バリアと免疫を支えます。';

  return (
    <div className="nutri-grid">
      <div className="iap-stage">
        <svg viewBox={`0 0 ${W} ${Hh}`} className="iap-svg" role="img" aria-label="食後血糖の推移グラフ">
          {/* グリッド */}
          {[70, 100, 140, 180].map((g) => (
            <g key={g}>
              <line x1={x0} y1={yForG(g)} x2={x1} y2={yForG(g)} stroke="#2E4A3B" strokeWidth="1" strokeDasharray="3 4" />
              <text x={x0 - 8} y={yForG(g) + 4} textAnchor="end" fontSize="10" fill="#7E8F84">
                {g}
              </text>
            </g>
          ))}
          {[0, 1, 2, 3].map((h) => (
            <text key={h} x={xForH(h)} y={yBot + 20} textAnchor="middle" fontSize="10" fill="#7E8F84">
              {h}h
            </text>
          ))}
          <text x={x0 - 8} y="30" textAnchor="end" fontSize="10" fill="#7E8F84">
            mg/dL
          </text>

          {/* 正常域の帯 */}
          <rect x={x0} y={yForG(140)} width={x1 - x0} height={yForG(70) - yForG(140)} fill="#5E8BA8" opacity="0.06" />

          {/* 未加工食(参照, 薄い) */}
          <path d={buildPath(0.05, 1)} fill="none" stroke="#86B98C" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
          {/* 現在の加工度(アニメーション) */}
          <path d={buildPath(proc, animT)} fill="none" stroke={proc > 0.55 ? '#C0562F' : '#86B98C'} strokeWidth="3.5" strokeLinecap="round" />

          {/* 現在地カーソル */}
          <circle cx={xForH(Math.min(cursorH, 3))} cy={yForG(glucose(Math.min(cursorH, 3), proc))} r="5" fill="#EFEADC" />

          <text x={x1} y="30" textAnchor="end" fontSize="12" fontWeight="700" fill="#EFEADC">
            {cursorG} mg/dL
          </text>
          <text x={x1} y="266" textAnchor="end" fontSize="10" fill="#86B98C" opacity="0.7">
            ---- 未加工食
          </text>
        </svg>
      </div>

      <div className="iap-controls">
        <div className="iap-gauges">
          <div className="gauge">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E1D2" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={proc > 0.55 ? '#C0562F' : '#86B98C'} strokeWidth="10" strokeLinecap="round" strokeDasharray={gaugeCirc} strokeDashoffset={gaugeCirc * (1 - clamp((peak - 90) / 100, 0, 1))} transform="rotate(-90 60 60)" />
              <text x="60" y="56" textAnchor="middle" className="gauge-num" fill="#1B1B17">
                {peak}
              </text>
              <text x="60" y="76" textAnchor="middle" className="gauge-unit" fill="#7E8F84">
                mg/dL
              </text>
            </svg>
            <span>血糖ピーク</span>
          </div>
          <div className="gauge">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E1D2" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={diversity > 55 ? '#86B98C' : '#C0562F'} strokeWidth="10" strokeLinecap="round" strokeDasharray={gaugeCirc} strokeDashoffset={gaugeCirc * (1 - diversity / 100)} transform="rotate(-90 60 60)" />
              <text x="60" y="56" textAnchor="middle" className="gauge-num" fill="#1B1B17">
                {diversity}
              </text>
              <text x="60" y="76" textAnchor="middle" className="gauge-unit" fill="#7E8F84">
                %
              </text>
            </svg>
            <span>腸内細菌の多様性</span>
          </div>
        </div>

        <div className="nutri-bars">
          <MiniBar label="満腹感の持続" value={`${satiety} h`} pct={clamp((+satiety / 3.2) * 100, 0, 100)} color="#5E8BA8" />
          <MiniBar label="慢性炎症リスク" value={`${inflammation}%`} pct={inflammation} color="#C0562F" />
        </div>

        <label className="slider-row">
          <span className="slider-name" style={{ color: '#C0562F' }}>
            加工食品の割合
          </span>
          <input type="range" min="0" max="1" step="0.01" value={proc} onChange={(e) => setProc(+e.target.value)} />
          <span className="slider-val">{Math.round(proc * 100)}%</span>
        </label>

        <button className="start-btn" onClick={eat}>
          食べる → 血糖の推移を見る
        </button>

        <div className="fascia-note">
          <b>超加工食品</b>(精製糖・精製油・食品添加物)は消化が速く、血糖を急上昇させます。<b>インスリン</b>が過剰に出て糖を脂肪に変え、その反動の急降下がすぐの空腹を招きます。加えて
          <b>食物繊維</b>の不足で腸内細菌の多様性が落ち、短鎖脂肪酸が減って腸バリア・免疫・炎症に影響します。
        </div>

        <div className={`iap-verdict ${proc <= 0.3 ? 'good' : proc > 0.6 ? 'bad' : ''}`}>{verdict}</div>
      </div>
    </div>
  );
}

function MiniBar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className="minibar">
      <div className="minibar-head">
        <span>{label}</span>
        <b style={{ color }}>{value}</b>
      </div>
      <div className="minibar-track">
        <div className="minibar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
