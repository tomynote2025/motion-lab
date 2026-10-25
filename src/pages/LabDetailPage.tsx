import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { LAB_GROUPS, LABS, getLab, labNo } from '../data/labs';

/** ラボごとのページ（/lab/ラボ名）。部品は開いたときに読み込む */
const load = (fn: () => Promise<Record<string, ComponentType>>, name: string) =>
  lazy(() => fn().then((m) => ({ default: m[name] })));

const LAB_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  proprioception: load(() => import('../sections/ProprioceptionLab'), 'ProprioceptionLab'),
  laterality: load(() => import('../sections/LateralityLab'), 'LateralityLab'),
  balance: load(() => import('../sections/BalanceLab'), 'BalanceLab'),
  neuro: load(() => import('../sections/NeuroLab'), 'NeuroLab'),
  iap: load(() => import('../sections/IapLab'), 'IapLab'),
  homunculus: load(() => import('../sections/HomunculusLab'), 'HomunculusLab'),
  fascia: load(() => import('../sections/FasciaLab'), 'FasciaLab'),
  'fascia-network': load(() => import('../sections/FasciaNetworkLab'), 'FasciaNetworkLab'),
  breath: load(() => import('../sections/BreathLab'), 'BreathLab'),
  pain: load(() => import('../sections/PainVolumeLab'), 'PainVolumeLab'),
  nutri: load(() => import('../sections/NutriLab'), 'NutriLab'),
};

export function LabDetailPage() {
  const { id = '' } = useParams();
  const index = LABS.findIndex((l) => l.id === id);

  useEffect(() => {
    if (index < 0) return;
    window.scrollTo(0, 0);
    document.title = `${getLab(id).title}｜Be:come からだの実験室`;
  }, [id, index]);

  if (index < 0) return <Navigate to="/lab" replace />;

  const lab = LABS[index];
  const group = LAB_GROUPS.find((g) => g.id === lab.group)!;
  const inGroup = LABS.filter((l) => l.group === lab.group);
  const prev = LABS[index - 1];
  const next = LABS[index + 1];
  const Lab = LAB_COMPONENTS[id];

  return (
    <div className="page-top-pad lab-page lab-detail">
      <div className="lab-crumb">
        <Link to="/lab">← 体験ラボ一覧</Link>
        <span>
          {group.title} {inGroup.findIndex((l) => l.id === id) + 1} / {inGroup.length}
        </span>
      </div>

      <Suspense fallback={<div className="lab-loading">読み込み中…</div>}>
        <Lab />
      </Suspense>

      <nav className="lab-pager" aria-label="ほかのラボ">
        {prev ? (
          <Link to={`/lab/${prev.id}`} className="lab-pager-prev">
            <small>← 前のラボ {labNo(prev.id)}</small>
            <b>{prev.title}</b>
          </Link>
        ) : (
          <span />
        )}
        <Link to="/lab" className="lab-pager-index">一覧へ</Link>
        {next ? (
          <Link to={`/lab/${next.id}`} className="lab-pager-next">
            <small>次のラボ {labNo(next.id)} →</small>
            <b>{next.title}</b>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
