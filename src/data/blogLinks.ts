/**
 * 本体ブログ(seitai-site / health-football.com)の記事一覧。
 * 本体ブログで非公開にした記事（desk-work-shoulder・low-back-pain-myth・posture-and-mood、2026-11-02）は載せない。
 * 3D骨格モデルの部位をタップしたとき、ここで紐づけた記事が表示されます。
 *
 * ▼ 記事を追加したとき
 *   1. 下の BLOG_LINKS に1件足す
 *   2. slug は本体ブログのURL末尾（例: /blog/eye-strain-neck → 'eye-strain-neck'）
 *   3. parts に関連する部位IDを、labs に関連する体験ラボのIDを入れる
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
  /** 3D骨格マップの部位ID（どの部位にも当てはまらなければ空） */
  parts: string[];
  /** 記事を出す体験ラボのID（src/data/labs.ts の id） */
  labs?: string[];
  /** 本体ブログで下書き(draft: true)の記事。公開したらこの行を消す */
  draft?: boolean;
};

export const BLOG_LINKS: BlogLink[] = [
  {
    slug: 'protein-intake',
    title: 'プロテインより先に見直したい、たんぱく質のとり方',
    category: '栄養',
    date: '2026-11-04',
    parts: ['nutrition'],
    labs: ['nutri'],
  },
  {
    slug: 'wrist-thumb-pain',
    title: 'スマホを持つと、親指の付け根が痛い。手首の「腱鞘炎」との付き合い方',
    category: '身体の知識',
    date: '2026-11-02',
    parts: ['wrist'],
  },
  {
    slug: 'tennis-elbow',
    title: '肘の外側が痛い「テニス肘」は、テニスをしない人にも多い',
    category: '身体の知識',
    date: '2026-10-30',
    parts: ['elbow'],
  },
  {
    slug: 'balance-not-just-strength',
    title: 'バランスが悪いのは筋力不足とは限らない',
    category: '身体の知識',
    date: '2026-10-28',
    parts: ['ankle'],
    labs: ['balance'],
  },
  {
    slug: 'old-ankle-sprain',
    title: '古い捻挫が、今の膝やお尻の使い方に響いていることがある',
    category: '身体の知識',
    date: '2026-10-26',
    parts: ['ankle', 'knee'],
    labs: ['proprioception', 'balance'],
  },
  {
    slug: 'knee-pain-squat',
    title: '膝が痛い人がやりがちなNGスクワット',
    category: 'トレーニング',
    date: '2026-10-23',
    parts: ['knee'],
  },
  {
    slug: 'core-training-bracing',
    title: 'お腹をへこませる体幹トレ、それだけだともったいない',
    category: 'トレーニング',
    date: '2026-10-21',
    parts: ['core', 'lumbar'],
    labs: ['iap'],
  },
  {
    slug: 'stretching-still-stiff',
    title: 'ストレッチしても硬いままなのはなぜ？',
    category: '身体の知識',
    date: '2026-10-19',
    parts: [],
    labs: ['fascia', 'fascia-network'],
  },
  {
    slug: 'sit-up-straight',
    title: '「背筋を伸ばして」で姿勢がよくならない理由',
    category: '身体の知識',
    date: '2026-10-16',
    parts: ['thoracic', 'lumbar'],
  },
  {
    slug: 'pain-science',
    title: '「痛みの科学」は今こう考えられている',
    category: '海外トレンド',
    date: '2026-10-14',
    parts: ['lumbar'],
    labs: ['pain'],
  },
  {
    slug: 'eye-exercises',
    title: '30秒でできる、眼のエクササイズ3つ',
    category: 'セルフケア',
    date: '2026-10-12',
    parts: ['neck'],
    labs: ['neuro'],
  },
  {
    slug: 'iron-fatigue-women',
    title: '疲れやすい女性は、まず鉄を疑ってみる',
    category: '栄養',
    date: '2026-10-09',
    parts: ['nutrition'],
    labs: ['nutri'],
  },
  {
    slug: 'groin-pain-football',
    title: 'サッカー選手に多い「足の付け根の痛み」。キックと切り返しから考える予防法',
    category: 'トレーニング',
    date: '2026-10-07',
    parts: ['hip'],
  },
  {
    slug: 'eye-strain-neck',
    title: '目の疲れと首こりはつながっている',
    category: '身体の知識',
    date: '2026-10-05',
    parts: ['neck'],
    labs: ['neuro'],
  },
  {
    slug: 'shoulder-stiffness-not-shoulder',
    title: '肩こりの原因、実は「肩じゃない」かもしれない',
    category: '身体の知識',
    date: '2026-10-02',
    parts: ['shoulder', 'neck', 'thoracic'],
    labs: ['fascia-network'],
  },

  // --- 以下は本体ブログで下書き中。公開したら draft の行を消してください ---
  // （公開順は ブログ原稿/サイト用/公開スケジュール.md）
  {
    slug: 'deep-2026-08-02',
    title: '「食物繊維は摂るほど効く」は本当？腸内細菌の「菌株」がカギを握る理由',
    category: '栄養',
    date: '2026-08-02',
    parts: ['nutrition'],
    labs: ['nutri'],
    draft: true,
  },
  {
    slug: 'deep-2026-08-08',
    title: '最近イライラしやすいのは気持ちの弱さ？亜鉛不足のサインかもしれない理由',
    category: '栄養',
    date: '2026-08-08',
    parts: ['nutrition'],
    labs: ['nutri'],
    draft: true,
  },
];

/** 公開済みの記事だけを、新しい順で返す */
export const publishedLinks = BLOG_LINKS.filter((a) => !a.draft).sort((a, b) =>
  a.date < b.date ? 1 : -1,
);

/** 部位ごとの記事（新しい順に最大3件） */
export const linksByPart = (partId: string) =>
  publishedLinks.filter((a) => a.parts.includes(partId)).slice(0, 3);

/** ラボごとの記事（新しい順に最大3件） */
export const linksByLab = (labId: string) =>
  publishedLinks.filter((a) => a.labs?.includes(labId)).slice(0, 3);

export const blogUrl = (slug: string) => `${BLOG_BASE}/blog/${slug}`;

export const formatDate = (d: string) => d.replace(/-/g, '.');
