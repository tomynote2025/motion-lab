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
import { LAB_GROUPS, LABS, labNo } from '../data/labs';

function GroupBand({ n }: { n: number }) {
  const g = LAB_GROUPS[n - 1];
  return (
    <div className="lab-group-band">
      <span>GROUP {n} / 3</span>
      <b>{g.title}</b>
      <p>{g.desc}</p>
    </div>
  );
}

export function LabPage() {
  useEffect(() => {
    // トップの紹介から /lab#ラボ名 で来たときは、そのラボまで移動する
    const id = window.location.hash.slice(1);
    const el = id ? document.getElementById(id) : null;
    if (el) requestAnimationFrame(() => el.scrollIntoView());
    else window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-top-pad lab-page">
      <header className="lab-index-hero">
        <div className="lab-index-copy">
          <span className="section-index">LAB MENU / {LABS.length} EXPERIENCES</span>
          <h1>知識を、<br /><em>感覚に変える。</em></h1>
          <p>自分の体で試すラボ、3Dで仕組みを見るラボ、暮らしに活かすラボの3つに分けています。はじめての方は「試して測る」から、気になるものを1つ選んでみてください。</p>
        </div>
        <nav className="lab-index-list" aria-label="体験ラボ一覧">
          {LAB_GROUPS.map((g) => (
            <div key={g.id} className="lab-index-group">
              <div className="lab-index-group-head">
                <b>{g.title}</b>
                <span>{g.desc}</span>
              </div>
              {LABS.filter((lab) => lab.group === g.id).map((lab) => (
                <a key={lab.id} href={`#${lab.id}`}>
                  <span className="lab-index-n">{labNo(lab.id)}</span>
                  <span>
                    <b>{lab.title}</b>
                    <i>{lab.desc}</i>
                    <em className="lab-index-tags">{lab.device}・{lab.time}</em>
                  </span>
                  <strong>↓</strong>
                </a>
              ))}
            </div>
          ))}
        </nav>
      </header>

      <GroupBand n={1} />
      <ProprioceptionLab />
      <LateralityLab />
      <BalanceLab />
      <NeuroLab />
      <GroupBand n={2} />
      <IapLab />
      <HomunculusLab />
      <FasciaLab />
      <FasciaNetworkLab />
      <GroupBand n={3} />
      <BreathLab />
      <PainVolumeLab />
      <NutriLab />
    </div>
  );
}
