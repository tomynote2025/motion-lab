# 共有用の画像（public/og/*.png, 1200×630）の作り方

1. 開発サーバー（port 5188）を起動した状態で `node shots.mjs <作業フォルダ>` — 各ラボの見どころの要素を切り抜いて撮る
2. 作業フォルダに、ラボごとの HTML（`template-example.html` と同じ形。題名・問いかけ・画像を差し替え、改行は `<br>` で入れる）と `hooks.json`（`[{ "id": "balance" }, …]`）を置く
3. 作業フォルダを一時的に `public/__og/` に置き、`node render.mjs <作業フォルダ> ../../public/og` で 1200×630 に撮る（撮り終えたら `public/__og/` は消す）

- 問いかけの文言は `src/data/labs.ts` の `hook` と同じにする（共有したときの説明文にも使われる）。
- ラボごとの共有用の題名・説明・画像は、ビルド後に `scripts/ogp-pages.mjs` が `dist/lab/<id>/index.html` に書き込む。
