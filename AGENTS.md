# motion-lab — エージェント向け確定事項

「からだの実験室」 **lab.health-football.com**。3D骨格＋腹圧・神経・筋膜・栄養ラボの体験サイト。記事は持たず、ブログ本体（`../seitai-site`, health-football.com）へリンクする。共通ルールは親フォルダの `AGENTS.md`。更新手順はリポジトリ内 `運用手順書.md`。

- スタック: Vite + React 19 + TypeScript + @react-three/fiber + drei + react-router-dom。
- デプロイ: GitHub `tomynote2025/motion-lab` → Vercel 自動デプロイ（Vercel Team slug は `tomynote`）。**push はユーザー自身が行う**（git CLI に認証が無いため GitHub Desktop を使う）。
- 3D骨格の部位タップ → 記事リンクは `src/data/blogLinks.ts` に1件足す（draft 記事は載せない）。
- デザイン: クリーム×深緑エディトリアル。地 #f3f0e7 / 墨 #1b1b17 / 深緑 #24523e・#1e3d2f。見出し Zen Kaku Gothic New 900、数値・ラベル IBM Plex Mono。トークンは `src/index.css` の `:root`。3D骨格や断面図は深緑プレート（--stage #14271c）のまま。
- スマホ幅（375px）で横溢れゼロを維持（`@media (max-width:640px)` が末尾にある）。
- dev サーバーは親の `.claude/launch.json` の `motion-lab`（port 5188）。canvas 系はスクリーンショットで確認する。
- DNS は Xserver の**サーバーパネル側**（ns1-5.xserver.jp）で編集する。アカウント側のドメインDNS画面は使われていない。
