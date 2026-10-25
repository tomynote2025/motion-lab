# 脳の中の体の地図（ホムンクルス）の 3D モデルの作り方

1. Blender に MPFB 2 を入れ、MakeHuman のシステム素材（CC0）を展開しておく（`BLENDER_USER_RESOURCES` で場所を指定）
2. 肌と服の画像を 1024px の JPEG に縮める（服は胸のロゴを消した版を使う）
3. `BLENDER_USER_RESOURCES=<MPFBのフォルダ> blender -b -P build_homunculus.py -- ../../public/models/homunculus.glb skin.jpg cloth.jpg`

- モーフ `real`（腕を下ろした実際の体）と `brain`（脳の中の体）を持つ。three.js では real = 1 − 変形度、brain = 変形度。
- 拡大率は HomunculusLab の説明と同じ（手 3.1・顔 1.7・足 1.4・体幹 0.62・手足 0.6、唇はさらに 1.45 倍）。
- 材質は `skin_hand` `cloth_trunk` のように部位ごとに分かれていて、選んだ部位だけ色を変える。
