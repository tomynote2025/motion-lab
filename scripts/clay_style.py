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
    b.inputs["Roughness"].default_value = 0.6 if kind in ("phone", "screen") else 0.9
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
