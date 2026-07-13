import { Hero } from './sections/Hero';
import { BodyMap } from './sections/BodyMap';
import { IapLab } from './sections/IapLab';
import { NeuroLab } from './sections/NeuroLab';
import { FasciaLab } from './sections/FasciaLab';
import { NutriLab } from './sections/NutriLab';

export default function App() {
  return (
    <>
      <nav className="nav">
        <a href="#top" className="nav-logo">
          MOTION<span>LAB</span>
        </a>
        <div className="nav-links">
          <a href="#bodymap">Body Map</a>
          <a href="#iap">IAP Lab</a>
          <a href="#neuro">Neuro Lab</a>
          <a href="#fascia">Fascia Lab</a>
          <a href="#nutri">Nutri Lab</a>
        </div>
      </nav>

      <main id="top">
        <Hero />
        <BodyMap />
        <IapLab />
        <NeuroLab />
        <FasciaLab />
        <NutriLab />
      </main>

      <footer className="footer">
        <div className="footer-logo">MOTION LAB</div>
        <p>
          本サイトの体験コンテンツは教育目的のデモであり、医学的な診断・治療に代わるものではありません。
          <br />
          強い痛み・しびれ・めまいがある場合は、医療機関にご相談ください。
        </p>
        <p className="footer-note">記事リンクは src/data/regions.ts で差し替えられます。</p>
      </footer>
    </>
  );
}
