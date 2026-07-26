import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { BlogPage } from './pages/BlogPage';
import { ArticlePage } from './pages/ArticlePage';
import { LabPage } from './pages/LabPage';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <Link to="/" className="nav-logo">
          からだの<span>保健室</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>
            ホーム
          </NavLink>
          <NavLink to="/blog">記事</NavLink>
          <NavLink to="/lab">体験ラボ</NavLink>
        </div>
      </nav>

      <main id="top">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<ArticlePage />} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="*" element={<ArticlePage />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-logo">からだの保健室</div>
        <p className="footer-by">tomy / 理学療法士・修士</p>
        <p>
          本サイトの記事および体験コンテンツは一般的な情報提供・教育を目的としたものであり、医学的な診断・治療に代わるものではありません。
          <br />
          強い痛み・しびれ・めまいがある場合は、医療機関にご相談ください。
        </p>
      </footer>
    </BrowserRouter>
  );
}
