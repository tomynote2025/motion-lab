/**
 * 本体ブログ(seitai-site / health-football.com)の記事一覧。
 * 3D骨格モデルの部位をタップしたとき、ここで紐づけた記事が表示されます。
 *
 * ▼ 記事を追加したとき
 *   1. 下の BLOG_LINKS に1件足す
 *   2. slug は本体ブログのURL末尾（例: /blog/desk-work-shoulder → 'desk-work-shoulder'）
 *   3. parts に関連する部位IDを入れる
 *   4. 本体ブログで公開したら draft を消す（draft: true の記事はここに表示されません）
 *
 * ▼ 使える部位ID
 *   neck / shoulder / elbow / wrist / thoracic / core / lumbar / hip / knee / ankle / nutrition
 */

export const BLOG_BASE = 'https://health-football.com';

export type BlogLink = {
  slug: string;
  title: string;
  category: string;
  date: string;
  parts: string[];
  /** 本体ブログで下書き(draft: true)の記事。公開したらこの行を消す */
  draft?: boolean;
};

export const BLOG_LINKS: BlogLink[] = [
  {
    slug: 'desk-work-shoulder',
    title: 'デスクワークの肩こりを、1日5分で軽くする習慣',
    category: 'セルフケア',
    date: '2026-06-10',
    parts: ['shoulder', 'neck', 'thoracic'],
  },
  {
    slug: 'low-back-pain-myth',
    title: '「安静にすれば治る」は本当？腰痛との正しい付き合い方',
    category: '身体の知識',
    date: '2026-06-03',
    parts: ['lumbar', 'core', 'hip'],
  },
  {
    slug: 'posture-and-mood',
    title: '姿勢を整えると、気持ちまで軽くなる理由',
    category: 'セルフケア',
    date: '2026-05-27',
    parts: ['thoracic', 'neck'],
  },

  // --- 以下は本体ブログで下書き中。公開したら draft の行を消してください ---
  {
    slug: 'deep-2026-08-02',
    title: '「食物繊維は摂るほど効く」は本当？腸内細菌の「菌株」がカギを握る理由',
    category: '栄養',
    date: '2026-08-02',
    parts: ['nutrition'],
    draft: true,
  },
  {
    slug: 'deep-2026-08-08',
    title: '最近イライラしやすいのは気持ちの弱さ？亜鉛不足のサインかもしれない理由',
    category: '栄養',
    date: '2026-08-08',
    parts: ['nutrition'],
    draft: true,
  },
];

/** 公開済みの記事だけを、新しい順で返す */
export const publishedLinks = BLOG_LINKS.filter((a) => !a.draft).sort((a, b) =>
  a.date < b.date ? 1 : -1,
);

export const linksByPart = (partId: string) =>
  publishedLinks.filter((a) => a.parts.includes(partId));

export const blogUrl = (slug: string) => `${BLOG_BASE}/blog/${slug}`;

export const formatDate = (d: string) => d.replace(/-/g, '.');
