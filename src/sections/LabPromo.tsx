import { Link } from 'react-router-dom';

const ITEMS = [
  { n: '01', t: '腹腔内圧シミュレーター', d: '横隔膜と腹横筋を操作して、体幹が安定するしくみを体感' },
  { n: '02', t: '機能神経学ラボ', d: '眼球運動と平衡感覚を、実際にテストして確かめる' },
  { n: '03', t: '筋膜スキャナー', d: '浅筋膜と深筋膜の“滑り”をドラッグで体験' },
  { n: '04', t: '分子栄養学ラボ', d: 'PFCバランスと血糖の動きを、数値を動かして理解する' },
];

export function LabPromo() {
  return (
    <section id="lab-promo" className="section">
      <div className="lab-promo">
        <div className="lab-promo-head">
          <span className="section-index">02</span>
          <h2>
            INTERACTIVE LAB<span className="jp-sub">体験して学ぶ</span>
          </h2>
          <p className="section-lead">
            読むだけでは掴みにくい「腹圧」「筋膜の滑り」「眼と平衡感覚」を、実際に触って動かしながら理解できる実験室です。
          </p>
          <Link to="/lab" className="cta-primary">
            ラボへ行く →
          </Link>
        </div>

        <div className="lab-promo-list">
          {ITEMS.map((i) => (
            <div key={i.n} className="lab-promo-item">
              <span className="lab-promo-n">{i.n}</span>
              <div>
                <b>{i.t}</b>
                <p>{i.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
