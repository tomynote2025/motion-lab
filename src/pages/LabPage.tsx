import { useEffect } from 'react';
import { IapLab } from '../sections/IapLab';
import { NeuroLab } from '../sections/NeuroLab';
import { ProprioceptionLab } from '../sections/ProprioceptionLab';
import { LateralityLab } from '../sections/LateralityLab';
import { HomunculusLab } from '../sections/HomunculusLab';
import { BalanceLab } from '../sections/BalanceLab';
import { BreathLab } from '../sections/BreathLab';
import { PainVolumeLab } from '../sections/PainVolumeLab';
import { FasciaLab } from '../sections/FasciaLab';
import { FasciaNetworkLab } from '../sections/FasciaNetworkLab';
import { NutriLab } from '../sections/NutriLab';

const LABS = [
  { n: '01', href: '#iap', en: 'CORE PRESSURE', title: '腹腔内圧', desc: '呼吸と体幹安定の関係' },
  { n: '02', href: '#neuro', en: 'NEUROLOGY', title: '眼と前庭機能', desc: '見る・動く・平衡感覚' },
  { n: '03', href: '#proprioception', en: 'POSITION SENSE', title: '位置再現ゲーム', desc: '関節位置を覚えて再現' },
  { n: '04', href: '#laterality', en: 'LEFT / RIGHT', title: '左右判断テスト', desc: '手の左右を見分ける速さ' },
  { n: '05', href: '#homunculus', en: 'BODY MAP IN THE BRAIN', title: '脳の中の体の地図', desc: '感覚の細かさと体の地図' },
  { n: '06', href: '#balance', en: 'BALANCE', title: 'スマホでふらつき測定', desc: '目を開けて・閉じて比べる' },
  { n: '07', href: '#breath', en: 'BREATHING', title: '呼吸と自律神経', desc: 'ゆっくり呼吸と心拍のゆらぎ' },
  { n: '08', href: '#pain', en: 'PAIN', title: '痛みのボリュームつまみ', desc: '痛みを調整する手がかり' },
  { n: '09', href: '#fascia', en: 'FASCIA LAYERS', title: '筋膜の層', desc: '浅筋膜と深筋膜の滑走' },
  { n: '10', href: '#fascia-network', en: 'FASCIA NETWORK', title: '筋膜ネットワーク', desc: '離れた場所への影響' },
  { n: '11', href: '#nutri', en: 'NUTRITION', title: '分子栄養学', desc: 'PFCと食事の変化' },
];

export function LabPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-top-pad lab-page">
      <header className="lab-index-hero">
        <div className="lab-index-copy">
          <span className="section-index">LAB MENU / 11 EXPERIENCES</span>
          <h1>知識を、<br /><em>感覚に変える。</em></h1>
          <p>腹圧・眼と平衡感覚・脳の中の体・呼吸・痛み・筋膜・栄養。気になる実験を選び、スライダーや3Dモデルを動かして身体のしくみを確かめてください。</p>
        </div>
        <nav className="lab-index-list" aria-label="体験ラボ一覧">
          {LABS.map((lab) => (
            <a key={lab.href} href={lab.href}>
              <span className="lab-index-n">{lab.n}</span>
              <span><small>{lab.en}</small><b>{lab.title}</b><i>{lab.desc}</i></span>
              <strong>↓</strong>
            </a>
          ))}
        </nav>
      </header>

      <IapLab />
      <NeuroLab />
      <ProprioceptionLab />
      <LateralityLab />
      <HomunculusLab />
      <BalanceLab />
      <BreathLab />
      <PainVolumeLab />
      <FasciaLab />
      <FasciaNetworkLab />
      <NutriLab />
    </div>
  );
}
