import { useEffect, useRef, useState } from 'react';
import { LabHead } from '../components/LabHead';
import { OpenOnPhone } from '../components/OpenOnPhone';

/**
 * POSITION LAB — 関節位置覚テスト(ひざ・ひじ・肩)
 *
 * 目を開けて目標の位置で止める → 目を閉じて戻す → 目を閉じたまま同じ位置へ、で「ずれ」を見る。
 * 測り方は2つ: スマホを手足に当てて角度を測る / 家族や目印を使って目で見て確かめる。
 * やり方の画像は MakeHuman(MPFB 2, CC0)の人体を Blender で描画したもの(public/images/position/)。
 *
 * 根拠(文言の範囲):
 *  - 座ってひざの角度を再現するテストで、健康な人の誤差は平均で約4°(39人)。日を変えると数度変わり、
 *    最小可検変化は約7°(20人, 50°の目標)。ひざの再現誤差に影響する要因は26研究のメタ分析あり。
 *  - 肩: 健康な人でも3〜6°程度ずれ、年齢とともに大きくなる(44人など)。
 *  - スマホの傾きセンサーでの再現誤差の測定は、腰や首では信頼性が高い報告がある。ひざ・ひじは中程度、肩は研究が少ない。
 */

type Joint = 'knee' | 'elbow' | 'shoulder';
type Mode = 'phone' | 'visual';
type Phase = 'idle' | 'start' | 'target' | 'return' | 'repro' | 'rest' | 'done' | 'unsupported' | 'denied';

const IMG = '/images/position/';
const TRIALS = 3;

const JOINTS: Record<
  Joint,
  { label: string; setup: string; target: string; back: string; repro: string; visual: string[]; moveWord: string }
> = {
  knee: {
    label: 'ひざ',
    setup: '椅子に深く座り、ひざを直角にします。スマホを片方のすねの前に、長い辺がすねに沿うように当てます（手で押さえるか、ゆるいバンドで固定）。',
    target: '目を開けたまま、ひざをゆっくり伸ばし、好きな高さで止めて3秒待ちます。',
    back: '目を閉じて、足をはじめの位置（ひざが直角）に戻します。',
    repro: '目を閉じたまま、さっきの高さまで伸ばして止めます。',
    visual: [
      '家族に横から見てもらい、目標の高さと、目を閉じて戻した高さを比べてもらいます。',
      'ひとりで行うときは、スマホを横に置いて動画を撮り、あとで見比べます。',
      '床にテープを貼り、かかとの真下の位置に印をつけると、差が分かりやすくなります。',
    ],
    moveWord: '伸ばす',
  },
  elbow: {
    label: 'ひじ',
    setup: '立つか座って、スマホを手に持ち、腕を体の横に下ろします。長い辺が前腕に沿うように持ちます。',
    target: '目を開けたまま、ひじを曲げて前腕を持ち上げ、好きな角度で止めて3秒待ちます。',
    back: '目を閉じて、腕をはじめの位置（体の横）に下ろします。',
    repro: '目を閉じたまま、さっきの角度までひじを曲げて止めます。',
    visual: [
      '家族に横から見てもらい、目標の角度と、目を閉じて戻した角度を比べてもらいます。',
      '机の横に立ち、目標のときの手の高さに付箋を貼ると、差が分かりやすくなります。',
    ],
    moveWord: '曲げる',
  },
  shoulder: {
    label: '肩',
    setup: '立って、スマホを手に持ち、ひじを伸ばしたまま腕を体の横に下ろします。長い辺が腕に沿うように持ちます。',
    target: '目を開けたまま、ひじを伸ばして腕を前に上げ、好きな高さで止めて3秒待ちます。',
    back: '目を閉じて、腕をはじめの位置（体の横）に下ろします。',
    repro: '目を閉じたまま、さっきの高さまで腕を上げて止めます。',
    visual: [
      '壁の前に立ち、目標の高さで指先が触れる位置に、目印のテープを貼ります。',
      '目を閉じて腕を下ろし、目を閉じたまま同じ高さへ上げます。目を開けて、指先と目印の差を見ます。',
      '家族に横から見てもらう方法でもかまいません。',
    ],
    moveWord: '上げる',
  },
};

const STEPS: { key: 'start' | 'target' | 'back' | 'compare'; img: string; title: string }[] = [
  { key: 'start', img: 'start', title: 'はじめの位置' },
  { key: 'target', img: 'target', title: '目を開けて、目標の位置で止める' },
  { key: 'back', img: 'start', title: '目を閉じて、はじめの位置へ戻す' },
  { key: 'compare', img: 'compare', title: '目を閉じたまま同じ位置へ → 差を見る' },
];

type MotionPermission = { requestPermission?: () => Promise<'granted' | 'denied'> };

function beep(ctx: AudioContext | null, freq: number, times = 1) {
  if (!ctx) return;
  for (let i = 0; i < times; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + i * 0.25;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

function say(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 1.05;
    synth.speak(u);
  } catch {
    /* 読み上げが使えなくても、音の合図で進められる */
  }
}

const PROMPT: Record<Exclude<Phase, 'idle' | 'done' | 'unsupported' | 'denied'>, (j: (typeof JOINTS)[Joint]) => string> = {
  start: () => 'はじめの位置で、じっとしてください',
  target: (j) => `目を開けたまま、${j.moveWord}位置で止めてください`,
  return: () => '目を閉じて、はじめの位置に戻してください',
  repro: () => '目を閉じたまま、さっきの位置で止めてください',
  rest: () => '目を開けて、はじめの位置に戻してください',
};

export function ProprioceptionLab() {
  const [joint, setJoint] = useState<Joint>('knee');
  const [mode, setMode] = useState<Mode>('phone');
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [angle, setAngle] = useState<number | null>(null);
  const [errors, setErrors] = useState<number[]>([]);
  const phaseRef = useRef<Phase>('idle');
  const grav = useRef<[number, number, number] | null>(null);
  const hist = useRef<{ t: number; a: number }[]>([]);
  const startAngle = useRef(0);
  const targetAngle = useRef(0);
  const phaseStart = useRef(0);
  const gotEvent = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const errorsRef = useRef<number[]>([]);
  const jointRef = useRef<Joint>('knee');
  jointRef.current = joint;

  const def = JOINTS[joint];

  const go = (p: Phase) => {
    phaseRef.current = p;
    phaseStart.current = performance.now();
    hist.current = [];
    setPhase(p);
    if (p in PROMPT) say(PROMPT[p as keyof typeof PROMPT](JOINTS[jointRef.current]));
    // 手順の画像を、測定の段階に合わせて切り替える
    setStep(p === 'target' ? 1 : p === 'return' ? 2 : p === 'repro' ? 3 : 0);
  };

  // 傾きセンサー: スマホの長い辺(y軸)と重力の向きのなす角を「手足の角度」として使う
  useEffect(() => {
    const onMotion = (e: DeviceMotionEvent) => {
      const g = e.accelerationIncludingGravity;
      if (!g || g.x == null || g.y == null || g.z == null) return;
      gotEvent.current = true;
      const v: [number, number, number] = [g.x, g.y, g.z];
      if (!grav.current) grav.current = [...v];
      const s = grav.current;
      for (let i = 0; i < 3; i++) s[i] = s[i] * 0.85 + v[i] * 0.15;
      const n = Math.hypot(s[0], s[1], s[2]) || 1;
      const a = (Math.acos(Math.max(-1, Math.min(1, s[1] / n))) * 180) / Math.PI;
      setAngle(a);
      const now = performance.now();
      hist.current.push({ t: now, a });
      while (hist.current.length && now - hist.current[0].t > 1500) hist.current.shift();
      tick(a, now);
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 1.5秒間の揺れが2°以内なら「止まっている」とみなす */
  const steady = (now: number) => {
    const h = hist.current;
    if (h.length < 8 || now - h[0].t < 1300) return false;
    const as = h.map((x) => x.a);
    return Math.max(...as) - Math.min(...as) < 2;
  };

  const tick = (a: number, now: number) => {
    const p = phaseRef.current;
    if (now - phaseStart.current < 1200) return; // 読み上げの間は判定しない
    const moved = Math.abs(a - startAngle.current);
    if (p === 'start' && steady(now)) {
      startAngle.current = a;
      beep(audio.current, 660);
      go('target');
    } else if (p === 'target' && moved > 12 && steady(now)) {
      targetAngle.current = a;
      beep(audio.current, 880);
      go('return');
    } else if (p === 'return' && moved < 8 && steady(now)) {
      beep(audio.current, 660);
      go('repro');
    } else if (p === 'repro' && moved > 12 && steady(now)) {
      // 正: 行き過ぎ / 負: 手前で止まった
      const err = Math.abs(a - startAngle.current) - Math.abs(targetAngle.current - startAngle.current);
      const next = [...errorsRef.current, err];
      errorsRef.current = next;
      setErrors(next);
      beep(audio.current, 880, 2);
      if (next.length >= TRIALS) {
        phaseRef.current = 'done';
        setPhase('done');
        setStep(3);
        say(`終わりです。目を開けてください。平均のずれは、${Math.round(next.reduce((s, x) => s + Math.abs(x), 0) / next.length)}度でした`);
      } else {
        go('rest');
      }
    } else if (p === 'rest' && moved < 8 && steady(now)) {
      go('target');
    }
  };

  const startMeasure = async () => {
    const DME = (window as unknown as { DeviceMotionEvent?: MotionPermission }).DeviceMotionEvent;
    if (!DME) {
      setPhase('unsupported');
      return;
    }
    if (typeof DME.requestPermission === 'function') {
      try {
        if ((await DME.requestPermission()) !== 'granted') {
          setPhase('denied');
          return;
        }
      } catch {
        setPhase('denied');
        return;
      }
    }
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audio.current = audio.current ?? new Ctx();
      await audio.current.resume();
    } catch {
      audio.current = null;
    }
    errorsRef.current = [];
    setErrors([]);
    grav.current = null;
    gotEvent.current = false;
    go('start');
    window.setTimeout(() => {
      if (!gotEvent.current && phaseRef.current === 'start') {
        phaseRef.current = 'unsupported';
        setPhase('unsupported');
      }
    }, 1800);
  };

  const stopMeasure = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* noop */
    }
    phaseRef.current = 'idle';
    setPhase('idle');
  };

  const running = phase === 'start' || phase === 'target' || phase === 'return' || phase === 'repro' || phase === 'rest';
  const meanAbs = errors.length ? errors.reduce((s, x) => s + Math.abs(x), 0) / errors.length : NaN;
  const cur = STEPS[step];
  const stepText = [def.setup, def.target, def.back, def.repro][step];

  const status =
    phase === 'start' ? 'はじめの位置で、じっとしてください（自動で記録します）' :
    phase === 'target' ? `目を開けたまま、${def.moveWord}位置で止めて、じっとしてください` :
    phase === 'return' ? '目を閉じて、はじめの位置に戻してください' :
    phase === 'repro' ? '目を閉じたまま、さっきの位置で止めてください' :
    phase === 'rest' ? `目を開けて、はじめの位置に戻してください（${errors.length + 1}回目へ）` :
    phase === 'unsupported' ? 'このデバイスでは傾きセンサーを読み取れませんでした。スマホのブラウザで開くか、「目で見て確かめる」をお試しください。' :
    phase === 'denied' ? '動きセンサーの使用が許可されませんでした。もう一度「はじめる」を押し、確認で「許可」を選んでください。' :
    '';

  return (
    <section id="proprioception" className="section">
      <LabHead
        id="proprioception"
        lead="目を閉じていても、手足がどの位置にあるかはある程度分かります。筋肉や腱、関節から脳へ届く「固有感覚」のおかげです。目を開けて決めた角度を覚え、目を閉じたまま同じ角度に戻せるかを試します。"
        steps="関節を選び、スマホを手足に当てて「はじめる」。音声の合図に合わせて、目を閉じたまま同じ角度で止めます（3回）。スマホがなければ「目で見て確かめる」でも試せます。"
        read="目標とのずれ（°）が小さいほど、同じ位置に戻せています。健康な人でも、ひざで平均約4°、肩で3〜6°ほどずれるのがふつうです。"
      />

      <div className="position-notice">
        <b>はじめる前に</b>
        <p>病気やけがの診断ではありません。ひざや肩に痛みがある場合は、無理のない範囲で行い、痛みが強くなるときは中止してください。</p>
      </div>

      <div className="pos-toolbar">
        <div className="region-chips" role="radiogroup" aria-label="関節">
          {(Object.keys(JOINTS) as Joint[]).map((j) => (
            <button key={j} className={`chip ${joint === j ? 'chip-active' : ''}`} disabled={running} onClick={() => { setJoint(j); setStep(0); setErrors([]); errorsRef.current = []; setPhase('idle'); }}>
              {JOINTS[j].label}
            </button>
          ))}
        </div>
        <div className="iap-mode-toggle">
          <button className={mode === 'phone' ? 'active good' : ''} disabled={running} onClick={() => setMode('phone')}>スマホで測る</button>
          <button className={mode === 'visual' ? 'active good' : ''} disabled={running} onClick={() => { stopMeasure(); setMode('visual'); }}>目で見て確かめる</button>
        </div>
      </div>

      <div className="position-grid">
        <div className="position-stage pos-stage">
          <div className="position-stage-head">
            <span>STEP {step + 1} / 4</span>
            <b>{cur.title}</b>
          </div>
          <div className="pos-img-wrap">
            <img className="pos-img" src={`${IMG}${joint}-${cur.img}.webp`} alt={`${def.label}：${cur.title}`} />
            {step >= 2 && <span className="pos-eyes">目を閉じる</span>}
            {cur.key === 'compare' && <span className="pos-legend"><i />目標の位置</span>}
          </div>
          <p className="pos-step-text">{stepText}</p>
          <div className="pos-step-tabs">
            {STEPS.map((s, i) => (
              <button key={s.key} className={i === step ? 'active' : ''} disabled={running} onClick={() => setStep(i)}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="position-controls">
          {mode === 'phone' ? (
            <>
              {running ? (
                <button className="lr-sub-btn" onClick={stopMeasure}>中止する</button>
              ) : (
                <>
                {phase === 'idle' && (
                  <OpenOnPhone id="proprioception" text="角度はスマホの傾きセンサーで測ります。パソコンでは「目で見て確かめる」を使うか、スマホでQRコードを読み取ってください。" />
                )}
                <button className="start-btn position-main-btn" onClick={startMeasure}>
                  {phase === 'done' ? 'もう一度（3回）' : 'はじめる（3回）'}
                </button>
                </>
              )}
              {status && <p className={`pos-status ${phase === 'unsupported' || phase === 'denied' ? 'warn' : ''}`}>{status}</p>}
              {running && angle != null && (
                <div className="pos-live">
                  <span>いまのスマホの傾き</span>
                  <b>{Math.round(angle)}°</b>
                </div>
              )}
              {errors.length > 0 && (
                <div className="position-result">
                  <span>目標とのずれ（{errors.length} / {TRIALS} 回）</span>
                  <strong>{Number.isFinite(meanAbs) ? meanAbs.toFixed(1) : '—'}<small>° 平均</small></strong>
                  <ul className="pos-errors">
                    {errors.map((e, i) => (
                      <li key={i}>
                        {i + 1}回目：{Math.abs(e).toFixed(1)}°{Math.abs(e) < 1 ? '（ほぼぴったり）' : e > 0 ? '（行き過ぎ）' : '（手前で止まった）'}
                      </li>
                    ))}
                  </ul>
                  {phase === 'done' && (
                    <p>目安：健康な人でも、座ったひざの再現で平均約4°、肩で3〜6°ほどずれます。同じ人でも日によって数度変わる（ひざでは約7°までは測定のばらつきの範囲）ので、くり返して比べるときは、同じ姿勢・同じスマホの当て方で行ってください。</p>
                  )}
                </div>
              )}
              <div className="lr-howto">
                <p><b>測り方のポイント</b></p>
                <ol>
                  <li>「はじめる」を押したら、画面の指示と音声に合わせて動かします。止めると自動で記録され、音が鳴ります。</li>
                  <li>目を閉じている間は、音と読み上げで次の動作を知らせます。音が出るようにしておいてください。</li>
                  <li>スマホは、手足の向きに沿わせてずれないように当てます。測っているのはスマホの傾きなので、当て方が変わると数値も変わります。</li>
                </ol>
                <p className="lr-mini">センサーの値は画面の中で計算するだけで、どこにも送信・保存しません。</p>
              </div>
            </>
          ) : (
            <div className="lr-howto">
              <p><b>目で見て確かめる方法（{def.label}）</b></p>
              <ol>
                {def.visual.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
              <p className="lr-mini">何度か繰り返し、毎回どちらにずれるか（行き過ぎか、手前で止まるか）も見てみましょう。左右で比べるのもおすすめです。</p>
            </div>
          )}
        </div>
      </div>

      <div className="lr-evidence">
        <div>
          <span>SENSE</span>
          <b>固有感覚とは</b>
          <p>筋肉や腱、関節にあるセンサーが、手足の位置や動きを脳に伝えています。目を閉じても自分の手足の位置がだいたい分かるのは、この感覚のおかげです。</p>
        </div>
        <div>
          <span>REFERENCE</span>
          <b>結果の目安</b>
          <p>座ってひざの角度を再現するテストでは、健康な人でも平均で約4°ずれました。肩でも3〜6°ほどずれ、年齢とともに大きくなる傾向があります。日によっても変わり、ある研究ではひざで約7°までの差は測定のばらつきの範囲とされています。</p>
        </div>
        <div>
          <span>SMARTPHONE</span>
          <b>スマホで測れるの？</b>
          <p>スマホの傾きセンサーで再現のずれを測る方法は、腰や首では信頼性が高いという報告があります。ひざやひじは中程度で、肩の研究はまだ少ない段階です。ここでの数値は、同じ人がくり返し比べるための目安です。</p>
        </div>
      </div>
      <p className="neuro-caution">
        参考: Factors that influence the angular error in active knee angle reproduction tests: a systematic review and meta-analysis (2024)／Test–retest reliability of a knee joint position sense measurement method in sitting and prone position／Reliability of the active knee joint position sense test and influence of limb dominance and sex (Sci Rep, 2023)／Variability of shoulder girdle proprioception in 44 healthy volunteers (2019)／Test–retest reliability of an iPhone inclinometer application to assess the lumbar joint repositioning error (2021)。画像は MakeHuman（MPFB 2、CC0）で作成。
      </p>
    </section>
  );
}
