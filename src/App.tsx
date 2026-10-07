import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LabPage } from './pages/LabPage';
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

export default function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      <nav className="nav">
        <Link to="/" className="nav-logo">
          BODY<span> LAB</span>
          <small>からだの実験室</small>
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>
            ホーム
          </NavLink>
          <NavLink to="/lab">LAB MENU</NavLink>
          <NavLink to="/profile">PROFILE</NavLink>
          <NavLink to="/personal-training" className="nav-training">出張パーソナル</NavLink>
        </div>
      </nav>

      <main id="top">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lab" element={<LabPage />} />
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
            <div className="footer-logo">BODY LAB</div>
            <p className="footer-by">富田 樹 — 理学療法士 / パーソナルトレーナー</p>
          </div>
          <div className="footer-actions">
            <Link to="/lab">体験一覧</Link>
            <Link to="/profile">プロフィール</Link>
            <Link to="/personal-training">出張パーソナル</Link>
            <Link to="/personal-training/first">初めての方へ</Link>
            <Link to="/personal-training/faq">よくある質問</Link>
            <a href={BLOG_BASE} target="_blank" rel="noreferrer">健康記事を読む ↗</a>
            <a href={`${BLOG_BASE}/contact`} target="_blank" rel="noreferrer">CONTACT ↗</a>
          </div>
        </div>
        <p className="footer-note">
          本サイトの体験コンテンツは教育を目的としたものであり、医学的な診断・治療に代わるものではありません。
          <br />
          強い痛み・しびれ・めまいがある場合は、医療機関にご相談ください。
        </p>
        <p className="footer-copy">© {new Date().getFullYear()} Etsuki Tomita / Body Lab</p>
      </footer>
    </BrowserRouter>
  );
}
