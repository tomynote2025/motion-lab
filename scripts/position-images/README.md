# 関節位置覚テストの説明画像

`public/images/position/{knee,elbow,shoulder}-{start,target,repro,compare}.webp`

1. `blender -b -P render_jps.py -- <出力先> young_asian_male [knee,elbow,shoulder]`（MPFB 2 と MakeHuman のシステム素材パックが必要。手順は `../laterality-images/README.md`）
2. start / target / repro の PNG を 640px の WebP にする
3. compare は、repro の上に target を「違う部分だけ」琥珀色で薄く重ねて作る（色の差が大きい所と、target にだけ体がある所をマスクにする）

- ひじは、この人体モデルの元の姿勢でひじが少し曲がっているため、前腕を水平にするのに骨を約45°回せばよい。
- 服は male_casualsuit04（胸のロゴを消した版）。
