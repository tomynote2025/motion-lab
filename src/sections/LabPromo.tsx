import { Link } from 'react-router-dom';
import { LAB_GROUPS, LABS, labNo } from '../data/labs';


export function LabPromo() {
  return (
    <section id="lab-promo" className="section">
      <div className="lab-promo">
        <div className="lab-promo-head">
          <span className="section-index">02</span>
          <h2>
            体験ラボ<span className="jp-sub">INTERACTIVE LAB</span>
          </h2>
          <p className="section-lead">
            体の感覚を、自分で試して確かめる実験室です。目を閉じて角度を合わせる、スマホでふらつきを測る、3Dで腹圧や筋膜の仕組みを見る — 読むだけでは掴みにくいことを、{LABS.length}のラボで体験できます。
          </p>
          <Link to="/lab" className="cta-primary">
            ラボへ行く →
          </Link>
        </div>

        <div className="lab-promo-list">
          {LAB_GROUPS.map((g) => (
            <div key={g.id}>
              <div className="lab-promo-group">{g.title}</div>
              {LABS.filter((l) => l.group === g.id).map((l) => (
                <Link key={l.id} to={`/lab#${l.id}`} className="lab-promo-item">
                  <span className="lab-promo-n">{labNo(l.id)}</span>
                  <div>
                    <b>{l.title}</b>
                    <p>{l.desc}</p>
                  </div>
                  <span className="lab-promo-go">→</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
