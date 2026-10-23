# 左右判断テストの手足画像

`public/images/laterality/*.webp` は、MakeHuman の Blender 版（MPFB 2.0.18）で作った人体から、左手・左足だけを残して描画したもの。右はアプリ側で左右反転する。

## 作り直す手順

1. MPFB 2 を Blender に入れる（extensions.blender.org の「MPFB」）。普段の設定を汚さないなら `BLENDER_USER_RESOURCES=<作業用フォルダ>` を付けて `blender --command extension install-file -r user_default -e <mpfb.zip>`
2. MakeHuman のシステム素材パック（makehuman_system_assets_cc0.zip）を MPFB のユーザーデータフォルダに展開
3. `blender -b -P render_parts.py -- <出力先> young_asian_male`
4. 出力の PNG を、透明部分で切り抜いて正方形にし、640px の WebP にする

## ライセンス

MakeHuman で書き出したモデル・素材は CC0（表記不要・商用可）。

## 首・体幹・肩と腕（render_body.py）

- `blender -b -P render_body.py -- <出力先> young_asian_male` で、左向き・左側の動きの12枚を描画する（右はアプリで左右反転）。
- 服は male_casualsuit04、髪は short02（黒っぽく色を上書き）、骨組みは default。
- **服の胸の MakeHuman ロゴは消してから描画している。** 素材パックの `clothes/male_casualsuit04/male_casualsuit04_diffuse.png` の胸の円（中心 1147,341・半径150px、2048px画像）に、後ろ身ごろの同じ高さ（中心 365,341）の無地の生地を貼って消した。左右非対称な柄は、反転すると左右判断の手がかりになるため。
- 出力の PNG は 640px の WebP にして `public/images/laterality/<名前>-left.webp` に置く。
