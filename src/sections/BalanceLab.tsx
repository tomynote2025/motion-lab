import { useEffect, useRef, useState } from 'react';
import { LabHead } from '../components/LabHead';
import { OpenOnPhone } from '../components/OpenOnPhone';

/**
 * BALANCE LAB — スマホでふらつき測定(目を開けて/閉じて)
 *
 * スマホを胸に当てて足をそろえて立ち、加速度センサーで揺れの大きさを20秒ずつ測る。
 * 根拠(文言の範囲):
 *  - 目を閉じると視覚の手がかりがなくなり、足裏などの感覚と平衡感覚でバランスをとる(Romberg の考え方)。
 *  - スマホや加速度計での静止立位の揺れの測定は、小規模な研究で一定の信頼性・妥当性が示されている
 *    (例: 無線加速度計で開眼/閉眼・硬い床/柔らかい床の差を検出、ICC 0.74〜0.97)。ただし研究の質は低〜中程度。
 *  - スマホでの基準値はないため、同じ人の「開眼と閉眼の比較」だけを示す。
 */

type Phase = 'intro' | 'countdown1' | 'open' | 'countdown2' | 'closed' | 'result' | 'unsupported' | 'denied';

const MEASURE_S = 20;
const COUNTDOWN_S = 3;
const SKIP_S = 1.5; // 測り始めの姿勢が落ち着くまでは使わない

type MotionPermission = { requestPermission?: () => Promise<'granted' | 'denied'> };

function beep(ctx: AudioContext | null, freq: number, times = 1) {
  if (!ctx) return;
  for (let i = 0; i < times; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + i * 0.28;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.22);
  }
}

const rms = (xs: number[]) => (xs.length ? Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / xs.length) : NaN);

export function BalanceLab() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [remain, setRemain] = useState(0);
  const [trace, setTrace] = useState<number[]>([]);
  const [result, setResult] = useState<{ open: number; closed: number } | null>(null);
  const phaseRef = useRef<Phase>('intro');
  const phaseStart = useRef(0);
  const samples = useRef<{ open: number[]; closed: number[] }>({ open: [], closed: [] });
  const grav = useRef<[number, number, number] | null>(null);
  const gotEvent = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const timer = useRef(0);
  const traceBuf = useRef<number[]>([]);

  const setP = (p: Phase) => {
    phaseRef.current = p;
    phaseStart.current = performance.now();
    setPhase(p);
  };

  // 加速度を受け取り、ゆっくりした成分(重力・持ち方の傾き)を引いた揺れの大きさを記録する
  useEffect(() => {
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      gotEvent.current = true;
      const v: [number, number, number] = [a.x, a.y, a.z];
      if (!grav.current) grav.current = [...v];
      const g = grav.current;
      for (let i = 0; i < 3; i++) g[i] = g[i] * 0.96 + v[i] * 0.04;
      const d = Math.hypot(v[0] - g[0], v[1] - g[1], v[2] - g[2]);
      const p = phaseRef.current;
      if ((p === 'open' || p === 'closed') && (performance.now() - phaseStart.current) / 1000 > SKIP_S) {
        samples.current[p].push(d);
      }
      traceBuf.current.push(d);
      if (traceBuf.current.length > 160) traceBuf.current.shift();
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, []);

  // 画面の更新(残り秒数・波形)と、段階の切り替え
  useEffect(() => {
    if (phase === 'intro' || phase === 'result' || phase === 'unsupported' || phase === 'denied') return;
    const total = phase === 'countdown1' || phase === 'countdown2' ? COUNTDOWN_S : MEASURE_S;
    const tick = () => {
      const el = (performance.now() - phaseStart.current) / 1000;
      setRemain(Math.max(0, Math.ceil(total - el)));
      setTrace([...traceBuf.current]);
      if (phase === 'countdown1' && el > 1.5 && !gotEvent.current) {
        setP('unsupported');
        return;
      }
      if (el >= total) {
        if (phase === 'countdown1') {
          beep(audio.current, 880);
          setP('open');
        } else if (phase === 'open') {
          beep(audio.current, 660, 2);
          setP('countdown2');
        } else if (phase === 'countdown2') {
          beep(audio.current, 880);
          setP('closed');
        } else if (phase === 'closed') {
          beep(audio.current, 520, 3);
          const r = { open: rms(samples.current.open), closed: rms(samples.current.closed) };
          setResult(r);
          setP('result');
        }
        return;
      }
      timer.current = requestAnimationFrame(tick);
    };
    timer.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timer.current);
  }, [phase]);

  const start = async () => {
    // iPhone は、ボタンを押したときに動きセンサーの許可を求める必要がある
    const DME = (window as unknown as { DeviceMotionEvent?: MotionPermission }).DeviceMotionEvent;
    if (!DME) {
      setP('unsupported');
      return;
    }
    if (typeof DME.requestPermission === 'function') {
      try {
        const res = await DME.requestPermission();
        if (res !== 'granted') {
          setP('denied');
          return;
        }
      } catch {
        setP('denied');
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
    samples.current = { open: [], closed: [] };
    grav.current = null;
    setResult(null);
    beep(audio.current, 520);
    setP('countdown1');
  };

  const stop = () => {
    cancelAnimationFrame(timer.current);
    setP('intro');
  };

  const running = phase === 'countdown1' || phase === 'open' || phase === 'countdown2' || phase === 'closed';
  const ratio = result ? result.closed / result.open : NaN;
  const maxBar = result ? Math.max(result.open, result.closed) : 1;
  const traceMax = Math.max(0.3, ...trace);
  const tracePath = trace.map((v, i) => `${(i / 159) * 400},${110 - (v / traceMax) * 95}`).join(' ');

  const stageTitle =
    phase === 'countdown1' ? '目を開けたまま、まっすぐ前を見る' :
    phase === 'open' ? '目を開けて、静かに立つ' :
    phase === 'countdown2' ? 'このあと、目を閉じます' :
    phase === 'closed' ? '目を閉じて、静かに立つ（音が鳴るまで）' :
    phase === 'result' ? '測定が終わりました' : 'スマホを胸に当てて立ちます';

  return (
    <section id="balance" className="section">
      <LabHead
        id="balance"
        lead="立っているとき、体は目（視覚）・足裏などの感覚・耳の奥の平衡感覚を組み合わせてバランスをとっています。目を閉じると視覚の手がかりがなくなり、残りの感覚だけで立つことになります。スマホの動きセンサーで、その違いを比べます。"
        steps="スマホを両手で胸の中央に当てて立ち、「はじめる」。目を開けて20秒、音の合図で目を閉じて20秒、そのまま静かに立ちます。"
        read="目を閉じたときの揺れが、開けたときの何倍かが出ます。目を閉じると揺れが増えるのはふつうの反応です。数字は、同じ人が同じやり方でくり返し比べるための目安です。"
      />

      <div className="position-notice bal-safety">
        <b>安全のために</b>
        <p>壁や椅子のそばで、できれば誰かに近くにいてもらって行ってください。ふらつきやめまいを感じたら、すぐに目を開けて中止してください。転びやすい方・めまいのある方・妊娠中の方は行わないでください。</p>
      </div>

      <div className="position-grid">
        <div className={`position-stage bal-stage phase-${phase}`}>
          <div className="position-stage-head">
            <span>{phase === 'open' ? 'EYES OPEN' : phase === 'closed' ? 'EYES CLOSED' : 'BALANCE TEST'}</span>
            <b>{stageTitle}</b>
          </div>

          <div className="bal-center">
            {running ? (
              <>
                <div className="bal-count">{remain}</div>
                <p>{phase === 'closed' ? '音が鳴ったら目を開けてください' : phase === 'countdown2' ? '音が鳴ったら目を閉じます' : '体をまっすぐ、力を抜いて'}</p>
              </>
            ) : phase === 'unsupported' ? (
              <p className="bal-msg">このデバイスでは動きセンサーを読み取れませんでした。スマホ（iPhone・Android）のブラウザで開いてください。</p>
            ) : phase === 'denied' ? (
              <p className="bal-msg">動きセンサーの使用が許可されませんでした。もう一度「はじめる」を押し、表示される確認で「許可」を選んでください。</p>
            ) : phase === 'result' && result ? (
              <div className="bal-result">
                <div className="bal-bar-row"><i>目を開けて</i><span className="lr-bar"><span style={{ width: `${(result.open / maxBar) * 100}%` }} /></span><b>{result.open.toFixed(2)}</b></div>
                <div className="bal-bar-row"><i>目を閉じて</i><span className="lr-bar alt"><span style={{ width: `${(result.closed / maxBar) * 100}%` }} /></span><b>{result.closed.toFixed(2)}</b></div>
                <p className="lr-mini">数値は揺れの大きさ（加速度の変動、m/s²）。同じ人・同じやり方で比べるための目安です。</p>
              </div>
            ) : (
              <ol className="bal-steps">
                <li>足をそろえて立ち、スマホを両手で胸の中央に当てます。</li>
                <li>「はじめる」を押すと、3秒後から目を開けたまま20秒測ります。</li>
                <li>音が2回鳴ったら目を閉じ、3秒後から20秒測ります。</li>
                <li>音が3回鳴ったら終了です。目を開けてください。</li>
              </ol>
            )}
          </div>

          <svg className="bal-trace" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={tracePath} fill="none" stroke={phase === 'closed' ? '#e0a95b' : '#8fb8a0'} strokeWidth="2" />
          </svg>
        </div>

        <div className="position-controls">
          {!running && phase !== 'result' && (
            <OpenOnPhone id="balance" text="この測定はスマホの動きセンサーを使うため、パソコンでは測れません。スマホのカメラでQRコードを読み取ってください。" />
          )}
          {running ? (
            <button className="lr-sub-btn" onClick={stop}>中止する</button>
          ) : (
            <button className="start-btn position-main-btn" onClick={start}>
              {phase === 'result' ? 'もう一度測る' : 'はじめる（約50秒）'}
            </button>
          )}

          {phase === 'result' && result && Number.isFinite(ratio) && (
            <div className="position-result">
              <span>目を閉じたときの揺れ ÷ 目を開けたときの揺れ</span>
              <strong>{ratio.toFixed(1)}<small> 倍</small></strong>
              <p>
                {ratio < 1.2
                  ? '目を閉じても、揺れはあまり変わりませんでした。'
                  : ratio < 2
                    ? '目を閉じると、揺れが少し大きくなりました。視覚の手がかりがなくなると揺れが増えるのは、ふつうの反応です。'
                    : '目を閉じると、揺れがかなり大きくなりました。立つときに視覚に頼る割合が大きいのかもしれません。気になる場合は、日を変えて同じやり方で測り直してみてください。'}
              </p>
            </div>
          )}

          <div className="lr-howto">
            <p><b>この測定で分かること・分からないこと</b></p>
            <ol>
              <li>目を開けたとき・閉じたときの揺れの違い（視覚にどれくらい頼っているかの目安）が分かります。</li>
              <li>スマホの持ち方・立ち方・床の硬さで数値は変わります。比べるときは同じやり方で。</li>
              <li>病気の診断や転倒しやすさの判定はできません。</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="lr-evidence">
        <div>
          <span>ROMBERG</span>
          <b>目を閉じて比べる理由</b>
          <p>目を閉じると、足裏などの感覚と耳の奥の平衡感覚だけでバランスをとることになります。目を開けたときと比べることで、立つときに視覚がどれくらい役立っているかが見えてきます。医療で使われるロンベルグ検査も同じ考え方です。</p>
        </div>
        <div>
          <span>SENSOR</span>
          <b>スマホで測れるの？</b>
          <p>体に付けた加速度センサーで静かに立ったときの揺れを測る方法は、小規模な研究で一定の信頼性が示されています。ただしスマホでの研究は数が少なく、質も高くありません。決まった基準値もないため、ここでは同じ人の開眼と閉眼の比較だけを示しています。</p>
        </div>
        <div>
          <span>DATA</span>
          <b>データの扱い</b>
          <p>センサーの値は、この画面の中で計算するだけです。どこにも送信・保存しません。</p>
        </div>
      </div>
      <p className="neuro-caution">
        参考: Saunders NW ら (2015) Reliability and validity of a wireless accelerometer for the assessment of postural sway／Inertial sensor reliability and validity for static and dynamic balance in healthy adults: a systematic review (Sensors, 2021)。ふらつきやめまいが続く場合は、医療機関にご相談ください。
      </p>
    </section>
  );
}
