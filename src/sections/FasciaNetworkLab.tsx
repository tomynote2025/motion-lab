import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { FasciaNetworkModel, type FasciaPattern } from '../three/FasciaNetworkModel';
import { LabHead, LabMore } from '../components/LabHead';
import { WhyQuiz } from '../components/WhyQuiz';

/**
 * FASCIA NETWORK — 筋膜は全身をつなぐ一枚のシート、を実際の動きを通じて体感するセクション。
 *
 * 「腰が痛い・肩が痛い・首が痛い。原因はそこ？」から入り、動かすと離れた場所の硬さが見える3パターン:
 *   腰が痛い ← 太もも裏（前屈）／肩が痛い ← おなか（腕を上げる）／首が痛い ← 二の腕（首を横に倒す）
 * 選んだ場所が高密度化(硬さ)しているほど、目的の関節が動かず、別の場所が代わりに動いて負担が集まる。
 */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const MOVE_DURATION = 1.6; // 秒

const PATTERNS: Record<
  FasciaPattern,
  { chip: string; pain: string; short: string; where: string; chain: string[]; move: string; romLabel: string; strainAt: string; note: string; cause: string; verdict: [string, string, string] }
> = {
  leg: {
    chip: '腰が痛い',
    pain: '腰',
    short: '太もも裏',
    where: '太もも裏（ハムストリングス）',
    chain: ['太もも裏', 'おしり', '腰'],
    move: '前屈してみる',
    romLabel: '前屈の深さ',
    strainAt: '腰',
    note: '太ももの裏から殿部・腰までは、筋膜でつながっています。太もも裏の筋膜が硬くなる（滑りにくくなる）と股関節が曲がりにくく、その分を腰が丸まって補うため、腰に負担が集まります。',
    cause: '例えば、太もも裏の肉離れのあとや、座りっぱなしの時間が長い生活。',
    verdict: [
      '◎ 太もも裏の筋膜がやわらかいと、股関節を中心に深く前屈でき、腰に負担は集まりません。',
      '○ 股関節の動きが少し減り、腰の丸まりが増えています。太もも裏の筋膜の硬さ（滑りにくさ）が、腰に負担をかけ始めています。',
      '⚠ 股関節があまり曲がらず、腰が大きく丸まって補っています。太もも裏の筋膜の硬さ（滑りにくさ）が、腰の痛みを引き起こしている可能性があります。',
    ],
  },
  abdomen: {
    chip: '肩が痛い',
    pain: '肩',
    short: 'おなか',
    where: 'おなか（腹部の前面）',
    chain: ['おなか', '胸（大胸筋）', '腕のつけ根', '肩'],
    move: '腕を上げてみる',
    romLabel: '腕の上がり方',
    strainAt: '肩',
    note: 'おなかの前の筋膜は、胸の筋肉（大胸筋）を通って腕までつながっています。おなかの筋膜が硬くなる（滑りにくくなる）と、腕を上げるときに前が突っ張って上がりきらず、肩に負担が集まります。腰を反らせて補うこともあります。',
    cause: '例えば、おなかの手術（帝王切開・盲腸など）のあとや、前かがみの姿勢が長い生活。',
    verdict: [
      '◎ おなかの筋膜がやわらかいと、腕は真上近くまで上がり、肩に負担は集まりません。',
      '○ 腕の上がり方が少し減り、腰を反らせて補い始めています。おなかの筋膜の硬さ（滑りにくさ）が、肩に負担をかけ始めています。',
      '⚠ 腕が上がりきらず、肩に負担が集まっています。おなかの筋膜の硬さ（滑りにくさ）が、肩の痛みを引き起こしている可能性があります。',
    ],
  },
  arm: {
    chip: '首が痛い',
    pain: '首',
    short: '二の腕',
    where: '二の腕（上腕の外側）',
    chain: ['二の腕', '肩の上（僧帽筋）', '首'],
    move: '首を横に倒してみる',
    romLabel: '首の倒れ方',
    strainAt: '首',
    note: '腕の筋膜は、肩の上（僧帽筋）を通って首までつながっています。二の腕の筋膜が硬くなる（滑りにくくなる）と、首を反対側へ倒すときに引っ張られて倒しにくく、首に負担が集まります。',
    cause: '例えば、腕の骨折でギプスを付けていたあとや、腕の使いすぎ。',
    verdict: [
      '◎ 二の腕の筋膜がやわらかいと、首を横に十分倒せ、首に負担は集まりません。',
      '○ 首の倒れ方が少し小さくなっています。二の腕の筋膜の硬さ（滑りにくさ）が、首に負担をかけ始めています。',
      '⚠ 首があまり倒れず、首に負担が集まっています。二の腕の筋膜の硬さ（滑りにくさ）が、首の痛みを引き起こしている可能性があります。',
    ],
  },
};

export function FasciaNetworkLab() {
  const [pattern, setPattern] = useState<FasciaPattern>('leg');
  const START_STIFFNESS = 0.8; // 「痛い」状態から始め、原因がわかったら硬さを下げて比べる
  const [densification, setDensification] = useState(START_STIFFNESS);
  const [revealed, setRevealed] = useState(false); // 一度動かして、硬い場所が見えたか
  const [progress, setProgress] = useState(0);
  const [animPhase, setAnimPhase] = useState<'idle' | 'moving'>('idle');
  const animPhaseRef = useRef(animPhase);
  const moveStart = useRef(0);
  const controls = useRef<OrbitControlsImpl>(null);
  animPhaseRef.current = animPhase;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (animPhaseRef.current === 'moving') {
        const t = (performance.now() - moveStart.current) / 1000;
        const p = clamp(t / MOVE_DURATION, 0, 1);
        setProgress(p);
        if (p >= 1) setAnimPhase('idle');
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const move = () => {
    controls.current?.reset(); // 動きが見やすい正面のカメラに戻す（向きはパターンごとに体を回して合わせる）
    moveStart.current = performance.now();
    setAnimPhase('moving');
    setRevealed(true);
  };
  const reset = () => {
    setAnimPhase('idle');
    setProgress(0);
  };
  const choose = (id: FasciaPattern) => {
    if (animPhaseRef.current === 'moving') return;
    reset();
    setPattern(id);
    setRevealed(false);
    setDensification(START_STIFFNESS);
  };

  const done = progress >= 0.999;
  const moving = animPhase === 'moving';
  const P = PATTERNS[pattern];

  // 数字だと測定値に見えるので、状態は言葉で示す
  const level = densification < 0.25 ? 0 : densification < 0.55 ? 1 : 2;
  const glideWord = ['なめらか', 'やや硬い', '硬い'][level];
  const romWord = ['大きい', 'やや小さい', '小さい'][level];
  const resistWord = ['やわらかい', 'やや硬い', '硬い'][level];

  return (
    <section id="fascia-network" className="section">
      <LabHead
        id="fascia-network"
        lead="筋膜の治療法のひとつ（Fascial Manipulation®）では、筋膜を体の各部の張力と動きをつなぐシステムとして考えます。張力が集まるとされる場所を「協調中心」と呼び、痛む場所から離れた所にも原因の候補があると考えます。光る点は、その考え方を理解するための仮の候補点です。"
        steps="痛む場所（腰・肩・首）を選んで動かすと、離れた所にある硬い場所と、そこからのつながりが現れます。そのあと、硬い場所のスライダーをやわらかくして、もう一度動かすと比べられます。"
        read="離れた場所の硬さが、別の関節の動きにも影響しうる、という考え方を表したモデルです。仮説の段階で、実際の評価は専門家の触診などで行われます。"
      />

      <div className="fascia-assessment-flow" aria-label="Stecco法の評価プロセス">
        <div><span>01</span><b>症状と経過を聞く</b><p>痛む場所だけでなく、過去の症状や負荷の履歴を整理</p></div>
        <i>→</i>
        <div><span>02</span><b>運動を比較する</b><p>どの方向・関節で運動協調が変化するかを観察</p></div>
        <i>→</i>
        <div><span>03</span><b>候補点を絞る</b><p>離れた部位も含め、張力が集まるCCの仮説を立てる</p></div>
        <i>→</i>
        <div><span>04</span><b>触診で確認する</b><p>専門家が組織の反応を確認して初めて判断する</p></div>
      </div>

      <div className="bodymap-grid">
        <div className="bodymap-canvas" aria-label="筋膜の高密度化と動きの3Dモデル">
          <Canvas camera={{ position: [0, 0.3, 10.6], fov: 42 }} dpr={[1, 2]}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[4, 6, 6]} intensity={1.2} />
            <pointLight position={[-6, -2, 5]} color="#5E8BA8" intensity={30} />
            <pointLight position={[6, 3, -4]} color="#C0562F" intensity={20} />
            <Suspense fallback={null}>
              <FasciaNetworkModel pattern={pattern} densification={densification} progress={progress} revealed={revealed} onSelectPattern={choose} />
            </Suspense>
            <OrbitControls
              ref={controls}
              enablePan={false}
              enableZoom={false}
              autoRotate={animPhase === 'idle' && progress === 0}
              autoRotateSpeed={0.7}
              minPolarAngle={Math.PI / 2.8}
              maxPolarAngle={Math.PI / 1.8}
              target={[0, -0.1, 0]}
            />
          </Canvas>
          <div className="bodymap-hint">DRAG TO ROTATE</div>
        </div>

        <div className="iap-controls">
          <div className="fascia-task-label"><span>STEP 01</span><b>痛む場所を選ぶ</b></div>
          <div className="region-chips" role="tablist" aria-label="痛む場所を選択">
            {(Object.keys(PATTERNS) as FasciaPattern[]).map((id) => (
              <button key={id} className={`chip ${pattern === id ? 'chip-active' : ''}`} disabled={moving} onClick={() => choose(id)}>
                {PATTERNS[id].chip}
              </button>
            ))}
          </div>

          <div className="fascia-task-label"><span>STEP 02</span><b>動かして、原因を探す</b></div>
          <button className={`fascia-demo-btn ${moving ? 'playing' : ''}`} onClick={moving || done ? reset : move}>
            {moving ? '■ 動いています…' : done ? '↺ 元に戻す' : `▶ ${P.move}`}
          </button>

          {done && <div className={`iap-verdict ${level === 2 ? 'bad' : level === 0 ? 'good' : ''}`}>{P.verdict[level]}</div>}

          <div className="fascia-note">
            {!revealed ? (
              <>
                <b>{P.chip}。原因は{P.pain}？</b>
                <br />
                「▶ {P.move}」を押して、どこが突っ張るかを見てみましょう。
              </>
            ) : (
              <>
                <b className="fascia-why">なぜ{P.short}？</b>
                <span className="fascia-chain">
                  {P.chain.map((c, i) => (
                    <span key={c}>
                      {i > 0 && <i>→</i>}
                      {c}
                    </span>
                  ))}
                </span>
                {P.note}
                <span className="fascia-cause">
                  <b>なぜ筋膜が硬くなる？</b>
                  過去の手術やケガ（骨折など）、ギプスなどで動かさなかった期間、同じ動きのくり返し（使いすぎ）がきっかけになると考えられています。{P.cause}
                </span>
              </>
            )}
          </div>

          {revealed && (
            <>
              <div className="fascia-task-label"><span>STEP 03</span><b>{P.short}の筋膜の硬さを変えて、もう一度動かす</b></div>
              <label className="slider-row">
                <span className="slider-name" style={{ color: '#C0562F' }}>
                  {P.short}の筋膜の硬さ
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={densification}
                  disabled={moving}
                  aria-label={`${P.short}の筋膜の硬さ（滑りにくさ）`}
                  onChange={(e) => {
                    setDensification(+e.target.value);
                    reset();
                  }}
                />
                <span className="slider-val">{resistWord}</span>
              </label>

              <div className="iap-gauges">
                <Gauge value={1 - densification} label={`${P.short}の筋膜の滑り（モデル）`} display={glideWord} color="#86B98C" />
                <Gauge value={1 - densification * 0.75} label={`${P.romLabel}（モデル）`} display={romWord} color="#5E8BA8" />
              </div>
            </>
          )}

        </div>
      </div>

      <WhyQuiz
        question="このモデルの考え方では、痛む場所と、動きを乱す原因の候補は同じ？"
        choices={["必ず同じ場所", "同じとは限らない", "必ず離れた場所"]}
        answer={1}
        explain="筋膜を体全体のつながりとして考える立場では、痛む場所から離れた所も原因の候補に入れます。ただし、これは提唱者らの考え方で、検証はまだ限られています。実際には、問診や動きの検査で一つずつ確かめていきます。"
      />
      <LabMore>
        <p className="neuro-caution">
          参考: Fascial Manipulation® Institute by Stecco が示す「協調中心」「高密度化」「全身を多因子的に評価する」方法論を単純化しています。これらは提唱者らによる考え方で、検証はまだ限られています。筋膜のつながりのうち、太もも裏〜腰（後ろのライン）と、胸〜おなか（前のライン）は解剖の研究で連続が確かめられていますが、腕〜首を含め、硬さが離れた場所の動きや痛みを起こすかどうかの検証は限られています（Wilke J ら 2016, Arch Phys Med Rehabil 97:454-461）。3パターンの動きの変化はモデル上の表現で、表示している点は正式なCCマップではなく、選択点と痛みの因果関係を示すものでもありません。実際の判断には問診・運動検査・専門的な触診が必要です。3D骨格: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan（抜き出し・軽量化して使用）。
        </p>
      </LabMore>
    </section>
  );
}

function Gauge({ value, label, display, color }: { value: number; label: string; display: string; color: string }) {
  const circ = 2 * Math.PI * 52;
  const v = clamp(value, 0, 1);
  return (
    <div className="gauge">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E1D2" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - v)}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="62" textAnchor="middle" className={display.length > 4 ? 'gauge-word gauge-word-sm' : 'gauge-word'} fill="#1B1B17">
          {display}
        </text>
        <text x="60" y="80" textAnchor="middle" className="gauge-unit" fill="#7E8F84">
          目安
        </text>
      </svg>
      <span>{label}</span>
    </div>
  );
}
