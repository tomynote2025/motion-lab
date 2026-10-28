"""関節位置覚テスト(ひざ・ひじ・肩)のやり方を見せる動画のコマ(PNG)を描く。

BLENDER_USER_RESOURCES=<MPFBのフォルダ> blender -b -P render_jps_video.py -- <out_dir> young_asian_male [knee,elbow,shoulder]
→ <out_dir>/<関節>/f_0001.png … を書き出す。字幕・目を閉じる印・ずれの重ねは make_jps_video.py で付けて動画にする。

人物・カメラ・スマホの置き方は説明画像(render_jps.py)と同じ。動き:
  はじめの位置 → 目を開けて目標へ → 止める → 目を閉じて戻す → 目を閉じたまま再現(少し手前で止まる) → 止める → はじめへ
"""
import bpy, sys, os
from mathutils import Vector, Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render_jps as J  # noqa: E402  部品だけ使う（画像の描画は走らない）
from clay_style import restyle  # noqa: E402

OUT = J.OUT
FPS = 24
# (フレーム, 状態) 状態: 0=はじめ / 1=目標 / 2=再現。間は滑らかに動く。make_jps_video.py の字幕と合わせる
TIMELINE = [(1, 0), (24, 0), (54, 1), (90, 1), (118, 0), (138, 0), (170, 2), (230, 2), (252, 0)]
FRAME_END = 252

# 関節ごとの設定: 動かす骨・軸・はじめからの回転量(目標/再現)・カメラ
JOINTS = {
    "knee": dict(bone="lowerleg01.L", axis="X", target=-45, repro=-37, phone_bone="lowerleg02.L"),
    "elbow": dict(bone="lowerarm01.L", axis="X", target=45, repro=37, phone_bone="wrist.L"),
    "shoulder": dict(bone="upperarm01.L", axis="X", target=78, repro=70, phone_bone="wrist.L"),
}


def parent_to_bone(objs, rig, bone):
    """スマホを骨に付けて、一緒に動くようにする(今の位置を保つ)"""
    pb = rig.pose.bones[bone]
    bone_mat = rig.matrix_world @ pb.matrix @ Matrix.Translation((0, rig.data.bones[bone].length, 0))
    for o in objs:
        mw = o.matrix_world.copy()
        o.parent = rig
        o.parent_type = "BONE"
        o.parent_bone = bone
        o.matrix_parent_inverse = bone_mat.inverted()
        o.matrix_world = mw


def camera(target, ortho):
    sc = bpy.context.scene
    target = Vector(target)
    cd = bpy.data.cameras.new("c")
    cd.type = "ORTHO"
    cd.ortho_scale = ortho
    cam = bpy.data.objects.new("c", cd)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    pos = target + J.CAM.normalized() * 5
    cam.location = pos
    cam.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
    J.area(pos + Vector((0, 0, 2)) + Vector((0, -1.5, 0)), target, 380)
    J.area(pos + Vector((0, 2, 0.5)), target, 120)
    J.area(target + Vector((-2, 1, 2.5)), target, 160)


def video_render():
    sc = bpy.context.scene
    J.setup_render()
    for name in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            sc.render.engine = name
            break
        except TypeError:
            continue
    try:
        sc.eevee.taa_render_samples = 32
    except AttributeError:
        pass
    sc.render.resolution_x = 720
    sc.render.resolution_y = 720
    sc.render.fps = FPS
    sc.frame_start = 1
    sc.frame_end = FRAME_END
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"


def make(joint):
    cfg = JOINTS[joint]
    h, rig = J.person()
    if joint == "knee":
        J.pose(rig, J.DOWN + J.SIT)
    else:
        J.pose(rig, J.DOWN)

    # スマホ(はじめの姿勢で置いて、骨に付ける)
    before = set(bpy.data.objects)
    if joint == "knee":
        k, _ = J.bone_world(rig, "lowerleg01.L")
        _, a = J.bone_world(rig, "lowerleg02.L")
        hip, _ = J.bone_world(rig, "upperleg01.L")
        shin = (a - k).normalized()
        front = shin.cross(Vector((1, 0, 0))).normalized()
        if front.y > 0:
            front = -front
        J.phone(k + (a - k) * 0.42 + front * 0.065, shin, front)
    else:
        w0, w1 = J.bone_world(rig, "wrist.L")
        l0, l1 = J.bone_world(rig, "lowerarm02.L")
        fore = (l1 - J.bone_world(rig, "lowerarm01.L")[0]).normalized()
        side = Vector((1, 0, 0))
        J.phone(w1 + fore * 0.05 - side * 0.015, fore, side)
    parent_to_bone([o for o in bpy.data.objects if o not in before], rig, cfg["phone_bone"])
    if joint == "knee":
        J.chair(hip.z - 0.06, hip.y - 0.25)

    # 動き(骨の回転にキーを打つ)
    pb = rig.pose.bones[cfg["bone"]]
    pb.rotation_mode = "XYZ"
    idx = "XYZ".index(cfg["axis"])
    base = pb.rotation_euler[idx]
    import math
    for frame, state in TIMELINE:
        delta = (0, cfg["target"], cfg["repro"])[state]
        e = list(pb.rotation_euler)
        e[idx] = base + math.radians(delta)
        pb.rotation_euler = e
        pb.keyframe_insert("rotation_euler", index=idx, frame=frame)

    video_render()
    if joint == "knee":
        camera(Vector((0, hip.y - 0.25, hip.z - 0.05)), 1.75)
    else:
        camera(Vector((0.1, -0.1, 1.15)), 1.45 if joint == "elbow" else 1.7)
    restyle()
    out = os.path.join(OUT, joint)
    os.makedirs(out, exist_ok=True)
    bpy.context.scene.render.filepath = os.path.join(out, "f_")
    bpy.ops.render.render(animation=True)


for j in J.ONLY:
    make(j)
print("DONE")
