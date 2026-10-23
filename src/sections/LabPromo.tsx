import { Link } from 'react-router-dom';

const ITEMS = [
  { n: '01', t: '腹腔内圧シミュレーター', d: '横隔膜・腹壁・骨盤底の協調で体幹が支えられるしくみを、3Dの解剖モデルで体感' },
  { n: '02', t: '機能神経学ラボ', d: '眼球運動と平衡感覚を、実際にテストして確かめる' },
  { n: '03', t: '関節位置覚テスト', d: '目を閉じて同じ位置に戻せるか、スマホや目で見て差を確かめる' },
  { n: '04', t: '左右判断テスト', d: '手足の画像が右か左かを、速く正確に答える' },
  { n: '05', t: '脳の中の体の地図', d: '感覚の細かさで描いた「脳の中の体」を3Dで見る' },
  { n: '06', t: 'スマホでふらつき測定', d: '目を開けたとき・閉じたときの揺れを比べる' },
  { n: '07', t: '呼吸と自律神経', d: 'ゆっくり呼吸のガイドと、心拍のゆらぎのしくみ' },
  { n: '08', t: '痛みのボリュームつまみ', d: '危険と安全の手がかりで、痛みの感じ方が変わるしくみ' },
  { n: '09', t: '筋膜スキャナー', d: '浅筋膜と深筋膜の“滑り”をドラッグで体験' },
  { n: '10', t: '筋膜ネットワーク', d: '高密度化が離れた関節の動きへ及ぼす影響を3Dで観察' },
  { n: '11', t: '分子栄養学ラボ', d: 'PFCバランスと血糖の動きを、数値を動かして理解する' },
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
