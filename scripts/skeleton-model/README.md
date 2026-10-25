# 骨格マップの 3D モデルの作り方

1. BodyParts3D の `isa_BP3D_4.0_obj_99.zip`（約143MB）を https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/ から取得して展開
2. `blender -b --factory-startup -P build_skeleton.py -- <OBJフォルダ> parts.json ../../public/models/skeleton.glb 90000`

- `parts.json` は OBJ 先頭の「English name」から骨・肋軟骨・歯を選んだ一覧（bone 203 / cart 14 / tooth 28）。
- 座標: 身長 1706mm を 6.45 に縮め、足裏を y=-3.05 に置く。前 = +Z、+X = 体の左。
- 骨格マップの光る点（`src/data/regions.ts` の position）は、この座標で骨の位置に合わせてある。
- 出典表記は `public/models/skeleton.ATTRIBUTION.txt` と骨格マップの注記に入れてある。
