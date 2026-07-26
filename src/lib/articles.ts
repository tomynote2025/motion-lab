import { marked } from 'marked';

/**
 * 記事の読み込み。
 * src/content/articles/ に .md を置くだけで自動的に記事一覧・記事ページに載ります。
 * ファイル名がそのままURLになります(例: neck-straight.md → /blog/neck-straight)。
 */

export type Article = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  /** 関連する体の部位 (src/data/regions.ts の id)。3D骨格モデルからこの記事へ辿れます */
  parts: string[];
  /** note等の元記事URL(任意) */
  source?: string;
  html: string;
};

/** 簡易フロントマター解析(--- で囲まれた見出し部分) */
function parseFrontmatter(raw: string): { data: Record<string, string | string[]>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };

  const data: Record<string, string | string[]> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    const rawVal = line.slice(i + 1).trim();
    if (!key) continue;

    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      data[key] = rawVal
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      data[key] = rawVal.replace(/^['"]|['"]$/g, '');
    }
  }
  return { data, body: m[2] };
}

const str = (v: string | string[] | undefined, fallback = '') =>
  typeof v === 'string' ? v : Array.isArray(v) ? v.join(', ') : fallback;

const files = import.meta.glob('../content/articles/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

marked.setOptions({ breaks: true, gfm: true });

export const ARTICLES: Article[] = Object.entries(files)
  .filter(([path]) => !/\/README\.md$/i.test(path)) // 書き方メモは記事として扱わない
  .map(([path, raw]) => {
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    const { data, body } = parseFrontmatter(raw);
    const parts = Array.isArray(data.parts) ? data.parts : data.parts ? [String(data.parts)] : [];
    return {
      slug,
      title: str(data.title, slug),
      date: str(data.date),
      category: str(data.category, '健康'),
      excerpt: str(data.excerpt),
      parts,
      source: str(data.source) || undefined,
      html: marked.parse(body) as string,
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export const getArticle = (slug?: string) => ARTICLES.find((a) => a.slug === slug);

export const articlesByPart = (partId: string) => ARTICLES.filter((a) => a.parts.includes(partId));

/** 2026-07-14 → 2026.07.14 */
export const formatDate = (d: string) => d.replace(/-/g, '.');
