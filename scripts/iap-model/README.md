# IAP LAB 3D モデルの作り方

1. BodyParts3D の `isa_BP3D_4.0_obj_99.zip`（約143MB）を https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/ から取得
2. `parts.json` に書いたファイルID の OBJ だけを1つのフォルダに展開
3. `blender -b --factory-startup -P build_iap.py -- <OBJフォルダ> parts.json ../../public/models/iap-torso.glb`

- 座標: 1/250 に縮小、高さ 1000mm を原点。three.js では前 = +Z。
- 腹横筋は BodyParts3D に無いので、腹壁は外腹斜筋（external oblique）で代用している。
- 出典表記は `public/models/iap-torso.ATTRIBUTION.txt` と IAP LAB の注記に入れてある。
