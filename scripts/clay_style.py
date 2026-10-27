"""人物画像の共通設定: MPFB の読み込みと「粘土の人形風」の材質（2026-10-28 に決定）。

- 全身をクリーム1色にし、髪・眉・目・まつげは描かない（顔立ちや服の柄で写真風にならないように）。
- 服も同系色にして形だけ残す。スマホと椅子はサイトの深緑・セージ。
- MPFB は拡張機能の入れ方で読み込み先が変わるので、両方を試す。
- 素材の置き場所: ~/Library/Application Support/motion-lab-assets/mpfb-user（BLENDER_USER_RESOURCES に指定する）
"""
import bpy

try:
    from bl_ext.blender_org.mpfb.services import HumanService, LocationService  # noqa: F401
except ImportError:
    from bl_ext.user_default.mpfb.services import HumanService, LocationService  # noqa: F401

COLORS = {
    "body": "#e9e2d2",
    "nail": "#fbf8f2",
    "nail_rim": "#9a8b6e",
    "cloth": "#d9d1bd",
    "phone": "#24523e",
    "screen": "#3d6b55",
    "chair": "#8fb8a0",
}
HIDE = ("short02", "eyebrow", "high-poly", "eyelash", "eyes", "teeth", "tongue")


def _srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


_cache = {}


def _mat(kind):
    if kind in _cache and _cache[kind].name in bpy.data.materials:
        return _cache[kind]
    m = bpy.data.materials.new(f"clay_{kind}")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*_srgb(COLORS[kind]), 1)
    b.inputs["Roughness"].default_value = 0.6 if kind in ("phone", "screen") else 0.3 if kind == "nail" else 0.9
    b.inputs["Specular IOR Level"].default_value = 0.2
    _cache[kind] = m
    return m


def restyle():
    """描画の直前に呼ぶ。場面の中の人物・服・スマホ・椅子を粘土風の材質に置き換える"""
    _cache.clear()
    for o in bpy.data.objects:
        if o.type != "MESH":
            continue
        n = o.name.lower()
        if any(k in n for k in HIDE):
            o.hide_render = True
            continue
        names = " ".join((m.name.lower() if m else "") for m in o.data.materials)
        if "phone_screen" in names:
            kind = "screen"
        elif "phone" in names:
            kind = "phone"
        elif "chair" in names:
            kind = "chair"
        elif "suit" in n or "casual" in n or "cloth" in n:
            kind = "cloth"
        else:
            kind = "body"
        o.data.materials.clear()
        o.data.materials.append(_mat(kind))
        # 爪（mark_nails で頂点に記録した nail_e）は、つやのある明るい色と、まわりの細い縁で見せる
        if kind == "body" and o.data.attributes.get("nail_e") is not None:
            o.data.materials.clear()
            o.data.materials.append(_nail_body_mat())


# ---------- 爪 ----------
# 左右判断の手足の画像では、爪が向きの大事な手がかりになる（2026-10-28 ユーザー指摘）。
# MakeHuman の人体には関節の目印（頂点グループ joint-l-finger-N-M など）があるので、
# 第1関節（DIP）から指先までの甲側の面を「爪」にし、そのまわりを「縁」にする。

def _mixed_coords(h):
    """形のキー（体形の設定）を混ぜた後の頂点の位置。描画される形と同じ"""
    keys = h.data.shape_keys
    if not keys:
        return [v.co.copy() for v in h.data.vertices]
    basis = keys.reference_key
    out = [kb.co.copy() for kb in basis.data]
    for kb in keys.key_blocks:
        if kb == basis or kb.value == 0 or kb.mute:
            continue
        rel = kb.relative_key
        for i, (a, b) in enumerate(zip(kb.data, rel.data)):
            out[i] += (a.co - b.co) * kb.value
    return out


def joint_center(h, name, coords=None):
    from mathutils import Vector
    coords = coords or _mixed_coords(h)
    gi = h.vertex_groups[name].index
    pts = [coords[v.index] for v in h.data.vertices if any(g.group == gi for g in v.groups)]
    return sum(pts, Vector()) / len(pts)


def nail_digits(h, part, side="l"):
    """part = "hand" / "foot"。各指の (第1関節, 指先) の位置。keep_region などで目印を消す前に呼ぶ"""
    co = _mixed_coords(h)
    out = []
    if part == "hand":
        for n in range(1, 6):
            out.append((joint_center(h, f"joint-{side}-finger-{n}-3", co), joint_center(h, f"joint-{side}-finger-{n}-4", co)))
    else:
        out.append((joint_center(h, f"joint-{side}-toe-1-2", co), joint_center(h, f"joint-{side}-toe-1-3", co)))
        for n in range(2, 6):
            out.append((joint_center(h, f"joint-{side}-toe-{n}-3", co), joint_center(h, f"joint-{side}-toe-{n}-4", co)))
    return out


def _subdivide(h, levels=2):
    """爪の輪郭をなめらかにするため、先に面を細かく分けておく（体形の設定は混ぜたまま確定する）"""
    bpy.ops.object.select_all(action="DESELECT")
    h.select_set(True)
    bpy.context.view_layer.objects.active = h
    if h.data.shape_keys:
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    m = h.modifiers.new("nail_subd", "SUBSURF")
    m.levels = levels
    bpy.ops.object.modifier_apply(modifier=m.name)


def _nail_body_mat():
    """肌（粘土色）に、頂点の値 nail_e（爪の楕円の中=1未満）で爪と縁を描き分ける材質"""
    m = bpy.data.materials.new("clay_body_nail")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Specular IOR Level"].default_value = 0.25
    att = nt.nodes.new("ShaderNodeAttribute")
    att.attribute_name = "nail_e"
    att.attribute_type = "GEOMETRY"

    def ramp(points):
        r = nt.nodes.new("ShaderNodeValToRGB")
        cr = r.color_ramp
        cr.interpolation = "LINEAR"
        for _ in range(len(cr.elements), len(points)):
            cr.elements.new(0.5)
        for el, (pos, col) in zip(cr.elements, points):
            el.position = pos
            el.color = col
        nt.links.new(att.outputs["Fac"], r.inputs["Fac"])
        return r

    def c(hexcol):
        return (*_srgb(hexcol), 1)

    # nail_e: 0〜0.86=爪 / 0.92〜1.14=縁 / 1.24〜=肌（値の範囲を 0〜2 → 0〜1 に縮めて使う）
    mp = nt.nodes.new("ShaderNodeMapRange")
    mp.inputs["From Min"].default_value = 0.0
    mp.inputs["From Max"].default_value = 2.0
    nt.links.new(att.outputs["Fac"], mp.inputs["Value"])
    col = ramp([(0.0, c(COLORS["nail"])), (0.43, c(COLORS["nail"])), (0.46, c(COLORS["nail_rim"])), (0.57, c(COLORS["nail_rim"])), (0.62, c(COLORS["body"]))])
    rough = ramp([(0.0, (0.28, 0.28, 0.28, 1)), (0.46, (0.28, 0.28, 0.28, 1)), (0.6, (0.9, 0.9, 0.9, 1))])
    nt.links.new(mp.outputs["Result"], col.inputs["Fac"])
    nt.links.new(mp.outputs["Result"], rough.inputs["Fac"])
    nt.links.new(col.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(rough.outputs["Color"], b.inputs["Roughness"])
    return m


def mark_nails(h, digits, dorsal, a0=0.8, ha=0.38, width=0.62):
    """dorsal = 甲の向き（手の甲・足の甲の法線）。頂点ごとに nail_e（爪の楕円の中心=0・輪郭=1・外側ほど大きい）を記録する。
    爪の形は、指の軸の向き（a: 第1関節=0・指先=1）と横幅（指の太さに対する割合）の楕円。甲側の面だけに付ける。"""
    from mathutils import Vector
    _subdivide(h)
    me = h.data
    me.update()
    cos = [v.co.copy() for v in me.vertices]
    nos = [v.normal.copy() for v in me.vertices]
    val = [9.0] * len(cos)
    dorsal = Vector(dorsal).normalized()
    for dip, tip in digits:
        axis = tip - dip
        L = axis.length
        u = axis / L
        d0 = (dorsal - u * dorsal.dot(u)).normalized()
        lat = u.cross(d0)
        seg = []
        for i, co in enumerate(cos):
            v = co - dip
            a = v.dot(u) / L
            if -0.2 < a < 1.8:
                rd, rl = v.dot(d0), v.dot(lat)
                # 隣の指を含めないよう、指の軸のすぐ近くだけを見る
                if (rd * rd + rl * rl) ** 0.5 < L * 0.75:
                    seg.append((i, a, rd, rl))
        if not seg:
            continue
        rs = sorted((rd * rd + rl * rl) ** 0.5 for _, a, rd, rl in seg if 0.3 < a < 0.9)
        R = rs[int(len(rs) * 0.7)] if rs else L * 0.4
        # 切り口をふさいだあとに面の表裏が逆になることがあるので、外向きかどうかを確かめて向きをそろえる
        out = sum(nos[i].dot((d0 * rd + lat * rl).normalized()) for i, a, rd, rl in seg if (rd * rd + rl * rl) > (0.3 * R) ** 2)
        flip = -1.0 if out < 0 else 1.0
        for i, a, rd, rl in seg:
            # 甲側を向いている面だけ（関節の目印の位置は指ごとに少しずれるので、位置ではなく面の向きで決める）
            if nos[i].dot(d0) * flip < 0.3:
                continue
            e = (((a - a0) / ha) ** 2 + (rl / (width * R)) ** 2) ** 0.5
            if e < val[i]:
                val[i] = e
    att = me.attributes.get("nail_e") or me.attributes.new("nail_e", "FLOAT", "POINT")
    for d, x in zip(att.data, val):
        d.value = min(x, 2.0)
    return sum(1 for x in val if x < 1)
