import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LAB_GROUPS, LABS, labNo } from '../data/labs';

/** 体験ラボの一覧（各ラボは /lab/ラボ名 の別ページ） */
export function LabPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 以前の URL（/lab#balance など）で来たときは、そのラボのページへ移す
    const id = window.location.hash.slice(1);
    if (id && LABS.some((l) => l.id === id)) {
      navigate(`/lab/${id}`, { replace: true });
      return;
    }
    window.scrollTo(0, 0);
    document.title = '体験ラボ一覧｜Be:come からだの実験室';
  }, [navigate]);

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
                <Link key={lab.id} to={`/lab/${lab.id}`}>
                  <span className="lab-index-n">{labNo(lab.id)}</span>
                  <span>
                    <b>{lab.title}</b>
                    <i>{lab.desc}</i>
                    <em className="lab-index-tags">{lab.device}・{lab.time}</em>
                  </span>
                  <strong>→</strong>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </header>
    </div>
  );
}
