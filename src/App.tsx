import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LabPage } from './pages/LabPage';
import { LabDetailPage } from './pages/LabDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { PersonalTrainingPage } from './pages/PersonalTrainingPage';
import { PersonalTrainingApplyPage } from './pages/PersonalTrainingApplyPage';
import {
  PersonalTrainingAreasPage,
  PersonalTrainingBodyCarePage,
  PersonalTrainingFaqPage,
  PersonalTrainingFirstPage,
  PersonalTrainingVoicesPage,
} from './pages/PersonalTrainingInfoPages';
import { CustomCursor } from './components/CustomCursor';
import { BLOG_BASE } from './data/blogLinks';

/** ラボ以外のページでは、題名を元に戻す（ラボのページは各ページで設定する） */
function DefaultTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/lab')) document.title = 'Be:come｜からだの実験室';
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <DefaultTitle />
      <CustomCursor />
      <nav className="nav">
        <Link to="/" className="nav-logo">
          Be<span>:come</span>
          <small>からだの実験室</small>
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>
            ホーム
          </NavLink>
          <NavLink to="/lab">LAB MENU</NavLink>
          <NavLink to="/profile">PROFILE</NavLink>
        </div>
      </nav>

      <main id="top">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="/lab/:id" element={<LabDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/personal-training" element={<PersonalTrainingPage />} />
          <Route path="/personal-training/apply" element={<PersonalTrainingApplyPage />} />
          <Route path="/personal-training/first" element={<PersonalTrainingFirstPage />} />
          <Route path="/personal-training/faq" element={<PersonalTrainingFaqPage />} />
          <Route path="/personal-training/voices" element={<PersonalTrainingVoicesPage />} />
          <Route path="/personal-training/areas" element={<PersonalTrainingAreasPage />} />
          <Route path="/personal-training/body-care" element={<PersonalTrainingBodyCarePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">Be:come <small>からだの実験室</small></div>
            <div className="footer-by">
              <strong>富田 樹</strong>
              <span>理学療法士（理学療法学修士）</span>
              <span>パーソナルトレーナー</span>
              <span>ピラティスインストラクター</span>
            </div>
          </div>
          <div className="footer-actions">
            <Link to="/lab">体験一覧</Link>
            <Link to="/profile">プロフィール</Link>
            <a href={BLOG_BASE} target="_blank" rel="noreferrer">健康記事を読む ↗</a>
            <a href={`${BLOG_BASE}/contact`} target="_blank" rel="noreferrer">CONTACT ↗</a>
          </div>
        </div>
        <p className="footer-note">
          本サイトの体験コンテンツは教育を目的としたものであり、医学的な診断・治療に代わるものではありません。
          <br />
          強い痛み・しびれ・めまいがある場合は、医療機関にご相談ください。
        </p>
        <p className="footer-copy">© {new Date().getFullYear()} Etsuki Tomita / Be:come</p>
      </footer>
    </BrowserRouter>
  );
}
