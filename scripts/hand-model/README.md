# 左右判断テストの手モデル

`blender -b --factory-startup -P build_hand.py -- ../../public/models/hand-left.glb <確認画像の出力先prefix>`

- メタボールで作った「左手」。手の甲が +Z、指先が +Y、親指は +X 側。
- 右手はアプリ側で X を反転、手のひら側は Y 軸まわりに 180° 回して表示する。
- 外部の写真・モデルは使っていない（自作）。
