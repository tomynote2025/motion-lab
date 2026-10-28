"""render_jps_video.py で描いたコマに、字幕・「目を閉じる」の印・ずれの重ねを付けて動画にする。

python3 make_jps_video.py <コマのフォルダ> <出力フォルダ> [knee,elbow,shoulder]
→ <出力フォルダ>/<関節>.mp4（640×640、24fps、音なし・繰り返し再生用）と <関節>.webm

区切り(フレーム)は render_jps_video.py の TIMELINE と合わせてある。
"""
import os, sys, subprocess, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SRC, OUT = sys.argv[1], sys.argv[2]
ONLY = sys.argv[3].split(",") if len(sys.argv) > 3 else ["knee", "elbow", "shoulder"]
os.makedirs(OUT, exist_ok=True)
FONT = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"
BG = (20, 39, 28)
AMBER = np.array([232, 176, 98])
SIZE = 640
TARGET_FRAME = 80  # 目標の位置で止まっているコマ（ずれの重ねに使う）

WORDS = {
    "knee": ("ひざを伸ばして止める", "同じ高さまで伸ばす"),
    "elbow": ("ひじを曲げて止める", "同じ角度まで曲げる"),
    "shoulder": ("腕を前に上げて止める", "同じ高さまで上げる"),
}


def phases(joint):
    move, repro = WORDS[joint]
    return [
        (1, 23, "", "はじめの位置", False),
        (24, 89, "1", f"目を開けて、{move}", False),
        (90, 137, "2", "目を閉じて、はじめの位置へ戻す", True),
        (138, 169, "3", f"目を閉じたまま、{repro}", True),
        (170, 229, "4", "目を開けて、ずれを確かめる", False),
        (230, 252, "", "はじめの位置", False),
    ]


def load(path):
    im = Image.open(path).convert("RGBA")
    return im.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def compose(joint):
    src = os.path.join(SRC, joint)
    files = sorted(f for f in os.listdir(src) if f.endswith(".png"))
    target = np.asarray(load(os.path.join(src, f"f_{TARGET_FRAME:04d}.png"))).astype(float)
    f_cap = ImageFont.truetype(FONT, 25)
    f_num = ImageFont.truetype(FONT, 20)
    f_badge = ImageFont.truetype(FONT, 19)
    tmp = tempfile.mkdtemp()
    for n, name in enumerate(files, start=1):
        cur = load(os.path.join(src, name))
        frame = Image.new("RGBA", (SIZE, SIZE), (*BG, 255))
        frame.alpha_composite(cur)
        ph = next(p for p in phases(joint) if p[0] <= n <= p[1])
        start, end, num, text, closed = ph
        # 4: 目標の位置を琥珀色で重ねる（だんだん出す）
        if num == "4":
            k = min(1.0, (n - start) / 8)
            c = np.asarray(cur).astype(float)
            only_t = np.clip((target[..., 3] - c[..., 3]) / 255, 0, 1)
            shade = target[..., :3].mean(-1, keepdims=True) / 255
            col = (AMBER * (0.78 + 0.22 * shade)).clip(0, 255)
            over = np.dstack([col, only_t * 200 * k]).astype(np.uint8)
            frame.alpha_composite(Image.fromarray(over, "RGBA"))
        d = ImageDraw.Draw(frame)
        # 下の字幕
        d.rectangle((0, SIZE - 74, SIZE, SIZE), fill=(14, 29, 21, 235))
        x = 26
        if num:
            d.ellipse((x, SIZE - 52, x + 32, SIZE - 20), fill=(143, 184, 160))
            w = d.textlength(num, font=f_num)
            d.text((x + 16 - w / 2, SIZE - 49), num, font=f_num, fill=BG)
            x += 46
        d.text((x, SIZE - 52), text, font=f_cap, fill=(239, 234, 220))
        # 進み具合の線
        d.rectangle((0, SIZE - 4, int(SIZE * n / len(files)), SIZE), fill=(143, 184, 160))
        # 目を閉じている間の印
        if closed:
            label = "目を閉じる"
            w = d.textlength(label, font=f_badge)
            d.rounded_rectangle((SIZE - w - 52, 20, SIZE - 20, 56), radius=18, fill=(232, 176, 98))
            d.text((SIZE - w - 36, 27), label, font=f_badge, fill=(20, 39, 28))
        if num == "4":
            label = "目標の位置"
            d.rounded_rectangle((20, 20, 40, 40), radius=4, fill=tuple(int(v) for v in AMBER))
            d.text((48, 18), label, font=f_badge, fill=(239, 234, 220))
        frame.convert("RGB").save(os.path.join(tmp, f"c_{n:04d}.png"))
    base = os.path.join(OUT, joint)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "24", "-i", os.path.join(tmp, "c_%04d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "27", "-preset", "slow", "-movflags", "+faststart",
                    base + ".mp4"], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "24", "-i", os.path.join(tmp, "c_%04d.png"),
                    "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "38", "-row-mt", "1", base + ".webm"], check=True)
    # 最初のコマを、読み込み中に出す画像にする
    Image.open(os.path.join(tmp, "c_0001.png")).save(base + "-poster.webp", quality=82)
    print(joint, os.path.getsize(base + ".mp4") // 1024, "KB mp4 /", os.path.getsize(base + ".webm") // 1024, "KB webm")


for j in ONLY:
    compose(j)
