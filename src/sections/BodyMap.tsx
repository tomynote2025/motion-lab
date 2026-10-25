import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SkeletonModel } from '../three/SkeletonModel';
import { REGIONS } from '../data/regions';
import { linksByPart, blogUrl, formatDate, BLOG_BASE } from '../data/blogLinks';

const SYSTEM_REGIONS = REGIONS.filter((r) => r.kind === 'system');

export function BodyMap() {
  // 右の欄が空にならないよう、最初は相談の多い「腰」を選んでおく
  const [selected, setSelected] = useState<string | null>('lumbar');
  const region = REGIONS.find((r) => r.id === selected) ?? null;
  const related = region ? linksByPart(region.id) : [];

  return (
    <section id="bodymap" className="section">
      <div className="section-head">
        <span className="section-index">01</span>
        <h2>
          BODY MAP<span className="jp-sub">気になる部位から読む</span>
        </h2>
        <p className="section-lead">
          骨格モデルの光る点をタップすると、その部位で起きやすい不調のしくみと、関連する記事が表示されます。ドラッグで回転できます。
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
            <article
              key={region.id}
              className={`region-card ${region.kind === 'system' ? 'is-system' : ''}`}
            >
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

              <div className="region-articles">
                <div className="region-articles-title">この部位に関連する記事</div>
                {related.length > 0 ? (
                  related.map((a) => (
                    <a
                      key={a.slug}
                      className="article-link"
                      href={blogUrl(a.slug)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="article-label">
                        {a.category} ・ {formatDate(a.date)}
                      </span>
                      <span className="article-title">{a.title} →</span>
                    </a>
                  ))
                ) : (
                  <p className="region-articles-empty">
                    この部位の記事は準備中です。
                    <br />
                    <a href={`${BLOG_BASE}/blog`} target="_blank" rel="noreferrer">
                      ブログの記事一覧を見る →
                    </a>
                  </p>
                )}
              </div>
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
            {REGIONS.filter((r) => r.kind !== 'system').map((r) => (
              <button
                key={r.id}
                className={`chip ${selected === r.id ? 'chip-active' : ''}`}
                onClick={() => setSelected(r.id === selected ? null : r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {SYSTEM_REGIONS.length > 0 && (
            <div className="system-chips">
              <span className="system-chips-label">全身にかかわるテーマ</span>
              <div className="region-chips">
                {SYSTEM_REGIONS.map((r) => (
                  <button
                    key={r.id}
                    className={`chip chip-system ${selected === r.id ? 'chip-active' : ''}`}
                    onClick={() => setSelected(r.id === selected ? null : r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="bodymap-credit">
        3Dモデル: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan（骨・肋軟骨・歯を抜き出し、軽量化して使用）
      </p>
    </section>
  );
}
