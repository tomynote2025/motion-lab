import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SkeletonModel } from '../three/SkeletonModel';
import { REGIONS } from '../data/regions';

export function BodyMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const region = REGIONS.find((r) => r.id === selected) ?? null;

  return (
    <section id="bodymap" className="section">
      <div className="section-head">
        <span className="section-index">01</span>
        <h2>
          BODY MAP<span className="jp-sub">3D骨格診断マップ</span>
        </h2>
        <p className="section-lead">
          骨格モデルの光る点をタップすると、その部位で起きがちな不調のメカニズムと、深掘り記事へのリンクが表示されます。ドラッグで回転できます。
        </p>
      </div>

      <div className="bodymap-grid">
        <div className="bodymap-canvas" aria-label="3D骨格モデル">
          <Canvas camera={{ position: [0, 0.3, 10.6], fov: 42 }} dpr={[1, 2]}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[4, 6, 6]} intensity={1.2} />
            <pointLight position={[-6, -2, 5]} color="#5E8BA8" intensity={30} />
            <pointLight position={[6, 3, -4]} color="#C0562F" intensity={20} />
            <Suspense fallback={null}>
              <SkeletonModel selected={selected} onSelect={setSelected} />
            </Suspense>
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              autoRotate={!selected}
              autoRotateSpeed={1.1}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.65}
              target={[0, -0.1, 0]}
            />
          </Canvas>
          <div className="bodymap-hint">DRAG TO ROTATE / TAP A DOT</div>
        </div>

        <div className="bodymap-panel">
          {region ? (
            <article key={region.id} className="region-card">
              <div className="region-en">{region.en}</div>
              <h3>{region.label}</h3>
              <p className="region-summary">{region.summary}</p>
              <div className="region-signs">
                <div className="signs-title">こんなサインはありませんか?</div>
                <ul>
                  {region.signs.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <a className="article-link" href={region.articleUrl} target="_blank" rel="noreferrer">
                <span className="article-label">READ ARTICLE</span>
                <span className="article-title">{region.articleTitle} →</span>
              </a>
            </article>
          ) : (
            <div className="region-empty">
              <div className="region-empty-mark">?</div>
              <p>
                気になる部位を選んでください。
                <br />
                痛みの「本当の原因」は、痛む場所とは別にあることがほとんどです。
              </p>
            </div>
          )}

          <div className="region-chips" role="tablist" aria-label="部位を選択">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                className={`chip ${selected === r.id ? 'chip-active' : ''}`}
                onClick={() => setSelected(r.id === selected ? null : r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
