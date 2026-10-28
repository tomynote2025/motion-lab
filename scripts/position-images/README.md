# 関節位置覚テストの説明画像

`public/images/position/{knee,elbow,shoulder}-{start,target,repro,compare}.webp`

1. `blender -b -P render_jps.py -- <出力先> young_asian_male [knee,elbow,shoulder]`（MPFB 2 と MakeHuman のシステム素材パックが必要。手順は `../laterality-images/README.md`）
2. start / target / repro の PNG を 640px の WebP にする
3. compare は、repro の上に target を琥珀色で重ねて作る（target にだけ体がある所＝戻した位置と重ならない所だけをマスクにする）

- ひじは、この人体モデルの元の姿勢でひじが少し曲がっているため、前腕を水平にするのに骨を約45°回せばよい。
- 服は male_casualsuit04（粘土風なので模様は描かれない）。

## 見た目と素材の置き場所（2026-10-28）

- 人物は「粘土の人形風」（全身クリーム1色、髪・眉・目なし、服も同系色）。材質は `scripts/clay_style.py` にまとめてあり、各描画スクリプトが描画の直前に `restyle()` を呼ぶ。
- 素材は消えない場所に置いてある: `~/Library/Application Support/motion-lab-assets/`
  - `mpfb-user/`（`BLENDER_USER_RESOURCES` にこのフォルダを指定。MPFB 本体と MakeHuman のシステム素材入り）
  - `bodyparts3d/isa_BP3D_4.0_obj_99/`（BodyParts3D の OBJ）と `names.tsv`（ファイルIDと部位名の一覧）

## やり方の動画（public/videos/position/{knee,elbow,shoulder}.mp4・.webm・-poster.webp）

1. `BLENDER_USER_RESOURCES="$HOME/Library/Application Support/motion-lab-assets/mpfb-user" blender -b -P render_jps_video.py -- <コマの出力先> young_asian_male knee,elbow,shoulder`（EEVEE で 252 コマ、1関節 2分ほど）
2. `python3 make_jps_video.py <コマの出力先> ../../public/videos/position` — 字幕（①〜④）・「目を閉じる」の印・④で目標の位置を琥珀色で重ね、mp4 と webm にする
- 動き・角度・カメラ・スマホの位置は説明画像（render_jps.py）と同じ。区切りのフレームは render_jps_video.py の TIMELINE と make_jps_video.py の phases() を合わせてある。
