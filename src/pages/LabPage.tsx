import { useEffect } from 'react';
import { IapLab } from '../sections/IapLab';
import { NeuroLab } from '../sections/NeuroLab';
import { FasciaLab } from '../sections/FasciaLab';
import { NutriLab } from '../sections/NutriLab';

export function LabPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-top-pad">
      <div className="section lab-intro">
        <span className="section-index">LAB</span>
        <h1>
          からだを、<em>さわって</em>学ぶ。
        </h1>
        <p className="section-lead">
          腹圧・眼と平衡感覚・筋膜の滑り・栄養バランス。文章では掴みにくい仕組みを、スライダーやドラッグで動かしながら体感できます。
        </p>
      </div>

      <IapLab />
      <NeuroLab />
      <FasciaLab />
      <NutriLab />
    </div>
  );
}
