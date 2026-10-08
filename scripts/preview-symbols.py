"""按 FlagCN.vue / PartyEmblem.vue 的同一套几何参数栅格化，供人工核对图形。

用法：python scripts/preview-symbols.py
产物：_symbol-check.png

约定：所有辅助函数返回**未缩放的画布坐标**，只在最终绘制时乘 SCALE。
"""

import math

from PIL import Image, ImageDraw

SCALE = 3
W, H = 700, 300

img = Image.new("RGB", (W * SCALE, H * SCALE), "#14171c")
draw = ImageDraw.Draw(img)


def star_points(cx, cy, r, rotation_deg, steps=10):
    """五角星顶点：与 FlagCN.vue 的 starPath 同一算法"""
    inner = r * 0.381966
    pts = []
    for i in range(steps):
        rad = r if i % 2 == 0 else inner
        ang = math.radians(-90 + i * 36 + rotation_deg)
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    return pts


def arc_points(cx, cy, r, deg_from, deg_to, n=160):
    """顺时针采样圆弧（屏幕坐标，y 向下，角度增大即为顺时针）"""
    out = []
    for i in range(n + 1):
        d = deg_from + (deg_to - deg_from) * i / n
        a = math.radians(d)
        out.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return out


def poly(points, color):
    draw.polygon([(x * SCALE, y * SCALE) for x, y in points], fill=color)


def stroke(points, width, color):
    """折线描边 + 圆头端点（points 为未缩放画布坐标）"""
    draw.line(
        [(x * SCALE, y * SCALE) for x, y in points],
        fill=color,
        width=int(round(width * SCALE)),
        joint="curve",
    )
    rr = width * SCALE / 2
    for x, y in (points[0], points[-1]):
        draw.ellipse(
            [x * SCALE - rr, y * SCALE - rr, x * SCALE + rr, y * SCALE + rr], fill=color
        )


# ---------------- 五星红旗 ----------------
FLAG_X, FLAG_Y, FLAG_S = 40, 40, 10

draw.rectangle(
    [
        FLAG_X * SCALE,
        FLAG_Y * SCALE,
        (FLAG_X + 30 * FLAG_S) * SCALE,
        (FLAG_Y + 20 * FLAG_S) * SCALE,
    ],
    fill="#ee1c25",
)

BIG = (5, 5, 3)
SMALL = [(10, 2, 1), (12, 4, 1), (12, 7, 1), (10, 9, 1)]

for cx, cy, r in [BIG] + SMALL:
    rot = 0 if (cx, cy, r) == BIG else math.degrees(math.atan2(BIG[1] - cy, BIG[0] - cx)) + 90
    poly([(FLAG_X + x * FLAG_S, FLAG_Y + y * FLAG_S) for x, y in star_points(cx, cy, r, rot)], "#ffde00")

# ---------------- 党徽（简化示意） ----------------
EM_X, EM_Y, EM_S = 430, 90, 2.0
OFF = (1, -12)  # 组件里的 translate(1, -12)
GOLD = "#f2c94c"


def ept(x, y):
    """党徽内部坐标（含 translate）→ 未缩放画布坐标"""
    return (EM_X + (x + OFF[0]) * EM_S, EM_Y + (y + OFF[1]) * EM_S)


# 金徽红底
x0, y0 = ept(0, 0)
x1, y1 = ept(100, 100)
draw.rounded_rectangle(
    [x0 * SCALE, y0 * SCALE, x1 * SCALE, y1 * SCALE],
    radius=int(12 * EM_S * SCALE),
    fill="#c81f2c",
)

# 镰刀刀身：月牙形（外弧半径 40、内弧半径 56），两端自然收成尖
def arc_center(ax, ay, bx, by, radius, sweep_pos):
    """求经过 A、B 两点、半径为 radius 的圆心；sweep_pos=True 取顺时针那一侧"""
    dx, dy = bx - ax, by - ay
    chord = math.hypot(dx, dy)
    mx, my = (ax + bx) / 2, (ay + by) / 2
    h = math.sqrt(max(radius * radius - (chord / 2) ** 2, 0.0))
    ux, uy = dx / chord, dy / chord
    sign = 1 if sweep_pos else -1
    return (mx + sign * h * (-uy), my + sign * h * ux)


# ⚠ 以下端点一律用**未加 OFF 的原始局部坐标**，统一由 ept() 施加偏移，
#   否则会重复偏移（曾因此让刀身整体上移 12 个单位，看起来像刀柄断开）。
ax, ay = 40.7, 76.9
bx, by = 82.0, 28.0
ix, iy = 44.5, 72.3

co = arc_center(ax, ay, bx, by, 40.0, True)
ci = arc_center(ix, iy, bx, by, 56.0, True)

a_from = math.degrees(math.atan2(ay - co[1], ax - co[0]))
a_to = math.degrees(math.atan2(by - co[1], bx - co[0]))
if a_to < a_from:
    a_to += 360
outer = arc_points(co[0], co[1], 40.0, a_from, a_to)

b_from = math.degrees(math.atan2(by - ci[1], bx - ci[0]))
b_to = math.degrees(math.atan2(iy - ci[1], ix - ci[0]))
if b_to > b_from:
    b_to -= 360
inner = arc_points(ci[0], ci[1], 56.0, b_from, b_to)

# 多边形闭合处即为刀身末端的钝口
poly([ept(x, y) for x, y in outer + inner], GOLD)

# 镰刀刀柄：从钝口中央接出
stroke([ept(42.6, 74.6), ept(51, 97)], 11, GOLD)

# 锤柄：M 72 72 L 36 34
stroke([ept(72, 72), ept(36, 34)], 9, GOLD)

# 锤头：rect(15,23,34,14) rotate(-45 32 30)
hx, hy, hw, hh = 15, 23, 34, 14
rcx, rcy = 32 + OFF[0], 30 + OFF[1]
ang = math.radians(-45)
corners = []
for ox, oy in [(hx, hy), (hx + hw, hy), (hx + hw, hy + hh), (hx, hy + hh)]:
    ox, oy = ox + OFF[0], oy + OFF[1]
    rx = rcx + (ox - rcx) * math.cos(ang) - (oy - rcy) * math.sin(ang)
    ry = rcy + (ox - rcx) * math.sin(ang) + (oy - rcy) * math.cos(ang)
    corners.append(ept(rx - OFF[0], ry - OFF[1]))
poly(corners, GOLD)

img = img.resize((W, H), Image.LANCZOS)
img.save("_symbol-check.png")
print("wrote _symbol-check.png", img.size, "| arc sweep =", round(a_to - a_from, 1), "deg")
