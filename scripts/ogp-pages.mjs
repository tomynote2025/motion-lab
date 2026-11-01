// ビルド後に、ラボごとの HTML（dist/lab/<id>/index.html）を作る。
// SPA でも LINE や X などで共有したときに、ラボごとの題名・説明・画像（public/og/<id>.png）が出るようにするため。
// Vercel は実在するファイルを書き換えより先に返すので、/lab/balance ではこの HTML が使われる。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://lab.health-football.com';
const dist = new URL('../dist/', import.meta.url);
const base = readFileSync(new URL('index.html', dist), 'utf8');
const src = readFileSync(new URL('../src/data/labs.ts', import.meta.url), 'utf8');

const labs = [...src.matchAll(/\{ id: '([^']+)'.*?title: '([^']+)', desc: '([^']+)'.*?hook: '([^']+)' \}/g)].map((m) => ({
  id: m[1],
  title: m[2],
  desc: m[3],
  hook: m[4],
}));
if (labs.length !== 11) throw new Error(`labs.ts からラボを読めませんでした（${labs.length}件）`);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function page({ title, description, path, image }) {
  const url = `${SITE}${path}`;
  const tags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Be:come からだの実験室" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE}${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="canonical" href="${url}" />`,
  ].join('\n    ');
  return base
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace('</head>', `    ${tags}\n  </head>`);
}

const home = {
  title: 'Be:come｜からだの実験室',
  description: '3D骨格マップと11の体験ラボ。関節の位置感覚・左右判断・ふらつき・腹圧・呼吸・痛み・食事バランスを、自分で試して確かめる体験サイトです。',
  path: '/',
  image: '/og/home.png',
};
writeFileSync(new URL('index.html', dist), page(home));

mkdirSync(new URL('lab/', dist), { recursive: true });
writeFileSync(new URL('lab/index.html', dist), page({ ...home, title: '体験ラボ一覧｜Be:come からだの実験室', path: '/lab' }));

mkdirSync(new URL('profile/', dist), { recursive: true });
writeFileSync(
  new URL('profile/index.html', dist),
  page({
    ...home,
    title: 'プロフィール｜Be:come からだの実験室',
    description: '理学療法士・パーソナルトレーナー 富田 樹（とみた えつき）の経歴、資格、研修歴、情報発信の方針。',
    path: '/profile',
  }),
);

for (const lab of labs) {
  const dir = new URL(`lab/${lab.id}/`, dist);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    new URL('index.html', dir),
    page({
      title: `${lab.title}｜Be:come からだの実験室`,
      description: `${lab.hook} ${lab.desc}。自分で試して確かめる体験ラボ。`,
      path: `/lab/${lab.id}`,
      image: `/og/${lab.id}.png`,
    }),
  );
}
console.log(`OGP: ${labs.length} ラボのページを書き出しました`);
