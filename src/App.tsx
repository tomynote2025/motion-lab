import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LabPage } from './pages/LabPage';
import { CustomCursor } from './components/CustomCursor';
import { BLOG_BASE } from './data/blogLinks';

export default function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      <nav className="nav">
        <Link to="/" className="nav-logo">
          からだの<span>実験室</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>
            ホーム
          </NavLink>
          <NavLink to="/lab">体験ラボ</NavLink>
          <a href={BLOG_BASE} target="_blank" rel="noreferrer">
            ブログ ↗
          </a>
        </div>
      </nav>

      <main id="top">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-logo">からだの実験室</div>
        <p className="footer-by">tomy / 冨田 悦樹 — 整体師・パーソナルトレーナー</p>
        <p>
          記事は本体ブログで公開しています →{' '}
          <a href={BLOG_BASE} target="_blank" rel="noreferrer" className="footer-link">
            health-football.com
          </a>
        </p>
        <p className="footer-note">
          本サイトの体験コンテンツは教育を目的としたものであり、医学的な診断・治療に代わるものではありません。
          <br />
          強い痛み・しびれ・めまいがある場合は、医療機関にご相談ください。
        </p>
      </footer>
    </BrowserRouter>
  );
}
