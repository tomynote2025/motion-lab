# 左右判断テストの手足画像

`public/images/laterality/*.webp` は、MakeHuman の Blender 版（MPFB 2.0.18）で作った人体から、左手・左足だけを残して描画したもの。右はアプリ側で左右反転する。

## 作り直す手順

1. MPFB 2 を Blender に入れる（extensions.blender.org の「MPFB」）。普段の設定を汚さないなら `BLENDER_USER_RESOURCES=<作業用フォルダ>` を付けて `blender --command extension install-file -r user_default -e <mpfb.zip>`
2. MakeHuman のシステム素材パック（makehuman_system_assets_cc0.zip）を MPFB のユーザーデータフォルダに展開
3. `blender -b -P render_parts.py -- <出力先> young_asian_male`
4. 出力の PNG を、透明部分で切り抜いて正方形にし、640px の WebP にする

## ライセンス

MakeHuman で書き出したモデル・素材は CC0（表記不要・商用可）。


## 前腕と手・腕全体（render_limbs.py）

- `blender -b -P render_limbs.py -- <出力先> young_asian_male`
- 前腕と手: ひじから先を切り出し、手の甲の向きから描画。
- 腕全体: 姿勢は変えず、二の腕の途中（肩から3割下）で切る。肩の盛り上がり・わきの下を含めないため。腕の軸に直角な向きから描く（骨組みで腕をねじると皮膚がよじれるので使わない）。
- 足は render_feet.py（なめらかにし、甲はすねが画面外へ抜ける斜め上の角度）。

## すねから先・脚全体（render_legs.py）

- `blender -b -P render_legs.py -- <出力先> young_asian_male`
- すねから先はひざのすぐ下、脚全体は太ももの途中（股関節から3割下）で切る。
- 向きは「前から」と「内側から（土踏まず・親指の側）」。後ろからはかかとしか見えず左右の手がかりが少ないため使わない。
- カメラはほぼ水平にして上の切り口を見せず、さらに画像の上端を高さの5%だけまっすぐ切りそろえている。

## 見た目と素材の置き場所（2026-10-28）

- 人物は「粘土の人形風」（全身クリーム1色、髪・眉・目なし、服も同系色）。材質は `scripts/clay_style.py` にまとめてあり、各描画スクリプトが描画の直前に `restyle()` を呼ぶ。
- 素材は消えない場所に置いてある: `~/Library/Application Support/motion-lab-assets/`
  - `mpfb-user/`（`BLENDER_USER_RESOURCES` にこのフォルダを指定。MPFB 本体と MakeHuman のシステム素材入り）
  - `bodyparts3d/isa_BP3D_4.0_obj_99/`（BodyParts3D の OBJ）と `names.tsv`（ファイルIDと部位名の一覧）
