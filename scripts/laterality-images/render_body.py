"""MPFB(MakeHuman)の人体にポーズをつけ、首・体幹・肩の左右判断用の画像を描画する(すべて「左」側の動き)。

blender -b -P render_body.py -- <out_dir> <skin_name>
右の動きはアプリ側で左右反転して作る。人物はカメラ側(-Y)を向いて立ち、人物の左 = +X。
"""
import bpy, sys, os, math
from mathutils import Vector, Quaternion
from bl_ext.user_default.mpfb.services import HumanService, LocationService

argv = sys.argv[sys.argv.index("--") + 1:]
OUT, SKIN = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)
D = LocationService.get_user_data()
SPINE = ["spine01", "spine02", "spine03", "spine04", "spine05"]
DOWN = [("upperarm01.L", "Z", -38), ("upperarm01.R", "Z", 38)]


def person():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    h = HumanService.create_human()
    HumanService.set_character_skin(os.path.join(D, "skins", SKIN, SKIN + ".mhmat"), h, skin_type="ENHANCED_SSS")
    rig = HumanService.add_builtin_rig(h, "default")
    for kind, name in [("Clothes", "clothes/male_casualsuit04/male_casualsuit04.mhclo"),
                       ("Hair", "hair/short02/short02.mhclo"),
                       ("Eyebrows", "eyebrows/eyebrow001/eyebrow001.mhclo"),
                       ("Eyes", "eyes/high-poly/high-poly.mhclo")]:
        obj = HumanService.add_mhclo_asset(os.path.join(D, name), h, asset_type=kind, subdiv_levels=1)
        if kind in ("Hair", "Eyebrows") and obj is not None:
            m = bpy.data.materials.new(kind + "_dark")
            m.use_nodes = True
            b = m.node_tree.nodes["Principled BSDF"]
            b.inputs["Base Color"].default_value = (0.03, 0.022, 0.018, 1)
            b.inputs["Roughness"].default_value = 0.55
            obj.data.materials.clear()
            obj.data.materials.append(m)
    sub = h.modifiers.new("subd", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    return h, rig


def pose(rig, ops):
    for bone, axis, deg in ops:
        pb = rig.pose.bones[bone]
        pb.rotation_mode = "XYZ"
        e = list(pb.rotation_euler)
        e["XYZ".index(axis)] += math.radians(deg)
        pb.rotation_euler = e
    bpy.context.view_layer.update()


def setup_render():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 64
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 900
    sc.render.resolution_y = 900
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "AgX"
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.65


def area(loc, target, energy, size=1.2):
    ld = bpy.data.lights.new("l", "AREA")
    ld.energy = energy
    ld.size = size
    lo = bpy.data.objects.new("l", ld)
    bpy.context.collection.objects.link(lo)
    lo.location = loc
    lo.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return lo


def shoot(target, cam_dir, name, ortho, up=Vector((0, 0, 1))):
    sc = bpy.context.scene
    target = Vector(target)
    cd = bpy.data.cameras.new("c")
    cd.type = "ORTHO"
    cd.ortho_scale = ortho
    cam = bpy.data.objects.new("c", cd)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    pos = target + Vector(cam_dir).normalized() * 4
    cam.location = pos
    fwd = (target - pos).normalized()
    q = fwd.to_track_quat("-Z", "Y")
    cur = q @ Vector((0, 1, 0))
    want = (up - fwd * up.dot(fwd)).normalized()
    ang = math.atan2(cur.cross(want).dot(fwd), cur.dot(want))
    cam.rotation_euler = (Quaternion(fwd, ang) @ q).to_euler()
    side = fwd.cross(want).normalized()
    ls = [area(pos + want * 1.5 + side * 1.5, target, 320), area(pos - side * 2.0 + want * 0.3, target, 120), area(target - fwd * 3 + want * 2, target, 150)]
    sc.render.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)
    for o in ls + [cam]:
        bpy.data.objects.remove(o)


def bone_pos(rig, name):
    return rig.matrix_world @ rig.pose.bones[name].head


FRONT, BACK = Vector((0, -1, 0)), Vector((0, 1, 0))
NECK = ["neck01", "neck02", "head"]

jobs = [
    # (名前, ポーズ, 中心にする骨, 高さの補正, カメラ方向, 写す範囲)
    ("neck-45-front", DOWN + [(b, "Y", 15) for b in NECK], "head", 0.02, FRONT, 0.62),
    ("neck-45-back", DOWN + [(b, "Y", 15) for b in NECK], "head", 0.02, BACK, 0.62),
    ("neck-70-front", DOWN + [(b, "Y", 23) for b in NECK], "head", 0.02, FRONT, 0.62),
    ("neck-70-back", DOWN + [(b, "Y", 23) for b in NECK], "head", 0.02, BACK, 0.62),
    ("trunk-rot-front", DOWN + [(b, "Y", 7) for b in SPINE], "spine02", 0.12, FRONT, 1.25),
    ("trunk-rot-back", DOWN + [(b, "Y", 7) for b in SPINE], "spine02", 0.12, BACK, 1.25),
    ("trunk-bend-front", DOWN + [(b, "Z", -6) for b in SPINE], "spine02", 0.12, FRONT, 1.25),
    ("trunk-bend-back", DOWN + [(b, "Z", -6) for b in SPINE], "spine02", 0.12, BACK, 1.25),
    ("arm-abd-front", [("upperarm01.R", "Z", 38), ("upperarm01.L", "Z", 85)], "spine02", 0.25, FRONT, 1.55),
    ("arm-abd-back", [("upperarm01.R", "Z", 38), ("upperarm01.L", "Z", 85)], "spine02", 0.25, BACK, 1.55),
    ("arm-flex-front", [("upperarm01.R", "Z", 38), ("upperarm01.L", "Z", -38), ("upperarm01.L", "X", 95)], "spine02", 0.25, FRONT, 1.55),
    ("arm-flex-side", [("upperarm01.R", "Z", 38), ("upperarm01.L", "Z", -38), ("upperarm01.L", "X", 95)], "spine02", 0.25, Vector((1, -0.9, 0.05)), 1.55),
]

for name, ops, bone, dz, cam_dir, ortho in jobs:
    h, rig = person()
    pose(rig, ops)
    setup_render()
    t = bone_pos(rig, bone) + Vector((0, 0, dz))
    shoot(t, cam_dir, name + ".png", ortho)
    print("RENDERED", name)
print("DONE")
