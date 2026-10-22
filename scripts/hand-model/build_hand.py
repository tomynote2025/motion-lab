"""左右判断テスト用の「左手」モデルを、メタボールで作る。

blender -b --factory-startup -P build_hand.py -- <out.glb> <preview_prefix>

座標: 手の甲が +Z(手前)、指先が +Y、左手なので親指は +X 側。
右手はアプリ側で X を反転して作る。
"""
import sys, math, bpy
from mathutils import Vector, Quaternion

argv = sys.argv[sys.argv.index("--") + 1:]
OUT, PREVIEW = argv

bpy.ops.wm.read_factory_settings(use_empty=True)

mb_data = bpy.data.metaballs.new("hand_mb")
mb_data.resolution = 0.018
mb_data.render_resolution = 0.012
mb_data.threshold = 0.5
mb_obj = bpy.data.objects.new("hand_mb", mb_data)
bpy.context.collection.objects.link(mb_obj)


def capsule(a, b, r, stiff=2.0):
    a, b = Vector(a), Vector(b)
    d = b - a
    el = mb_data.elements.new(type="CAPSULE")
    el.co = (a + b) / 2
    el.radius = r
    el.size_x = d.length / 2
    el.stiffness = stiff
    q = Vector((1, 0, 0)).rotation_difference(d.normalized())
    el.rotation = q
    return el


def ellipsoid(c, r, sx, sy, sz, stiff=2.0):
    el = mb_data.elements.new(type="ELLIPSOID")
    el.co = Vector(c)
    el.radius = r
    el.size_x, el.size_y, el.size_z = sx, sy, sz
    el.stiffness = stiff
    return el


# 手のひら: 小さな玉を格子状に並べて、平たい板にする
for gx in (-0.27, -0.09, 0.09, 0.27):
    for gy in (0.12, 0.36, 0.6, 0.82):
        w = 1.0 if gy > 0.2 else 0.8
        ellipsoid((gx * (0.86 if gy < 0.2 else 1.0), gy, 0.0), 0.3 * w, 1.0, 1.0, 0.55, 2.0)
# 母指球のふくらみ
ellipsoid((0.26, 0.3, -0.05), 0.26, 1.0, 1.15, 0.7, 1.6)
# 手首〜前腕
ellipsoid((0.0, -0.02, -0.01), 0.36, 1.05, 0.7, 0.62, 1.8)  # 手首
capsule((0.0, -0.05, -0.01), (0.0, -0.95, -0.02), 0.33, 1.8)  # 前腕

tips = {}
# 指: (名前, 付け根x, 方向x, [基節,中節,末節], 太さ)
fingers = [
    ("index", 0.27, 0.07, [0.37, 0.23, 0.18], 0.148),
    ("middle", 0.09, 0.0, [0.41, 0.26, 0.19], 0.152),
    ("ring", -0.09, -0.06, [0.39, 0.24, 0.18], 0.145),
    ("little", -0.26, -0.15, [0.29, 0.18, 0.16], 0.13),
]
FLEX = math.radians(9)  # 自然な軽い屈曲(手のひら側 = -Z へ)
for name, bx, dx, lens, r in fingers:
    base_y = 0.95 if name in ("index", "middle") else (0.93 if name == "ring" else 0.86)
    capsule((bx * 0.95, base_y - 0.28, 0.0), (bx, base_y, 0.0), r * 1.15, 2.0)  # 中手骨でつなぐ
    p = Vector((bx, base_y, 0.0))
    d = Vector((dx, 1, 0)).normalized()
    ang = 0.0
    radius = r
    for i, L in enumerate(lens):
        ang += FLEX
        seg_dir = Vector((d.x, d.y * math.cos(ang), -math.sin(ang))).normalized()
        q = p + seg_dir * L
        capsule(p, q, radius, 2.0)
        p = q
        radius *= 0.92
    tips[name] = (p, seg_dir, radius)

# 親指(手のひら側へ少し回り込む)
thumb_pts = [Vector((0.33, 0.25, -0.06)), Vector((0.6, 0.52, -0.06)), Vector((0.78, 0.76, -0.05)), Vector((0.9, 0.95, -0.04))]
radii = [0.19, 0.155, 0.14]
for i in range(3):
    capsule(thumb_pts[i], thumb_pts[i + 1], radii[i], 2.0)
tips["thumb"] = (thumb_pts[3], (thumb_pts[3] - thumb_pts[2]).normalized(), radii[2])

# メタボールをメッシュへ
bpy.context.view_layer.objects.active = mb_obj
mb_obj.select_set(True)
bpy.ops.object.convert(target="MESH")
hand = bpy.context.view_layer.objects.active
hand.name = "hand"
for p_ in hand.data.polygons:
    p_.use_smooth = True
sm = hand.modifiers.new("sm", "SMOOTH")
sm.factor = 0.9
sm.iterations = 30
bpy.ops.object.modifier_apply(modifier="sm")
mod = hand.modifiers.new("dec", "DECIMATE")
mod.ratio = 0.35
bpy.ops.object.modifier_apply(modifier="dec")


def mat(name, hexc, rough):
    h = hexc.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [(x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*c, 1)
    b.inputs["Roughness"].default_value = rough
    return m

skin = mat("skin", "#e3cdb4", 0.6)
nailm = mat("nail", "#f3e6d8", 0.25)
hand.data.materials.append(skin)

# 爪(甲側 = +Z、指先の少し手前)
for name, (tip, dirv, r) in tips.items():
    dirv = Vector(dirv).normalized()
    up = Vector((0, 0, 1))
    side = dirv.cross(up).normalized()
    nrm = side.cross(dirv).normalized()  # 甲側を向く法線
    if nrm.z < 0:
        nrm = -nrm
    center = tip - dirv * (r * 0.72) + nrm * (r * 0.66)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1, location=center)
    nail = bpy.context.active_object
    nail.name = f"nail_{name}"
    # 長軸 = 指の向き、薄さ = 法線方向
    rot = Quaternion(Vector((0, 1, 0)).rotation_difference(dirv))
    nail.rotation_mode = "QUATERNION"
    nail.rotation_quaternion = rot
    nail.scale = (r * 0.52, r * 0.68, r * 0.1)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    # 法線方向に薄くするため、再度回転を合わせ直す(簡易: 甲側に押し付ける)
    for v in nail.data.vertices:
        off = v.co.dot(nrm)
        v.co -= nrm * off * 0.75
    nail.data.materials.append(nailm)
    for p_ in nail.data.polygons:
        p_.use_smooth = True

# 全体を結合
bpy.ops.object.select_all(action="DESELECT")
for o in bpy.data.objects:
    if o.type == "MESH":
        o.select_set(True)
bpy.context.view_layer.objects.active = hand
bpy.ops.object.join()
hand = bpy.context.view_layer.objects.active
print("FACES", len(hand.data.polygons))

bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
print("EXPORTED", OUT)

# 確認用の画像(甲側・手のひら側)
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "MATERIAL"
for m in bpy.data.materials:
    m.diffuse_color = m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value if m.use_nodes else m.diffuse_color
scene.render.resolution_x = 600
scene.render.resolution_y = 800
scene.render.film_transparent = False
world = bpy.data.worlds.new("w"); scene.world = world
cam_data = bpy.data.cameras.new("cam"); cam_data.type = "ORTHO"; cam_data.ortho_scale = 3.1
cam = bpy.data.objects.new("cam", cam_data); bpy.context.collection.objects.link(cam)
scene.camera = cam
for label, loc, rot in [("dorsal", (0.1, 0.55, 5), (0, 0, 0)), ("palmar", (0.1, 0.55, -5), (0, math.pi, 0))]:
    cam.location = loc
    cam.rotation_euler = rot
    scene.render.filepath = f"{PREVIEW}-{label}.png"
    bpy.ops.render.render(write_still=True)
print("RENDERED")
