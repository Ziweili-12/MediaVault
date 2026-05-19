from PIL import Image, ImageDraw, ImageFont
import os

W = 390
H = 844
BG = (17, 17, 17)
PHONE_BG = (0, 0, 0)
CARD_BG = (28, 28, 30)
TEXT = (255, 255, 255)
SEC = (140, 140, 145)
BLUE = (10, 132, 255)
ORANGE = (255, 159, 10)
GREEN = (48, 209, 88)
INPUT_BG = (44, 44, 46)
BORDER = (40, 40, 42)

movies = [
    ("Interstellar",      "星际穿越",    "美国/英国 · 2014",  "movie",  (44, 62, 80)),
    ("Shawshank Redemption","肖申克的救赎","美国 · 1994",      "movie",  (140, 40, 30)),
    ("Reply 1988",         "请回答1988",  "韩国 · 2015",      "series", (200, 110, 30)),
    ("Inception",          "盗梦空间",    "美国/英国 · 2010", "movie",  (30, 80, 140)),
    ("Blade Runner 2049",  "银翼杀手2049","美/英/加 · 2017",  "movie",  (22, 160, 130)),
    ("Stranger Things",    "怪奇物语",    "美国 · 2016",      "series", (120, 50, 150)),
    ("In the Mood for Love","花样年华",   "中国香港 · 2000",  "movie",  (180, 40, 40)),
    ("Chernobyl",          "切尔诺贝利",  "美国/英国 · 2019", "series", (50, 65, 80)),
]

def font(size):
    for p in ["/System/Library/Fonts/PingFang.ttc",
              "/System/Library/Fonts/Hiragino Sans GB.ttc",
              "/System/Library/Fonts/STHeiti Medium.ttc",
              "/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except: pass
    return ImageFont.load_default()

def rrect(draw, xy, r, fill):
    x0,y0,x1,y1 = xy
    draw.rectangle([x0+r,y0,x1-r,y1], fill=fill)
    draw.rectangle([x0,y0+r,x1,y1-r], fill=fill)
    draw.pieslice([x0,y0,x0+2*r,y0+2*r], 180, 270, fill=fill)
    draw.pieslice([x1-2*r,y0,x1,y0+2*r], 270, 360, fill=fill)
    draw.pieslice([x0,y1-2*r,x0+2*r,y1], 90, 180, fill=fill)
    draw.pieslice([x1-2*r,y1-2*r,x1,y1], 0, 90, fill=fill)

img = Image.new('RGB', (W, H), PHONE_BG)
d = ImageDraw.Draw(img)

f15 = font(15)
f14 = font(14)
f13 = font(13)
f11 = font(11)
f10 = font(10)
f9 = font(9)
f22 = font(22)
f17 = font(17)
f32 = font(32)
f12 = font(12)

# Status bar
d.text((28, 14), "9:41", fill=TEXT, font=font(15))

# Header area
y = 48
d.text((16, y), "影视收藏", fill=TEXT, font=f22)

# View segment (grid active, list inactive)
seg_x = 250
rrect(d, (seg_x, y+2, seg_x+122, y+26), 8, INPUT_BG)
# Grid (active)
rrect(d, (seg_x+2, y+4, seg_x+60, y+24), 6, BLUE)
d.text((seg_x+16, y+6), "网格", fill=TEXT, font=f11)
# List (inactive)
d.text((seg_x+78, y+6), "列表", fill=SEC, font=f11)

# Search bar
y = 82
rrect(d, (16, y, 374, y+40), 10, INPUT_BG)
d.text((32, y+11), "🔍  搜索电影或剧集...", fill=SEC, font=f15)

# Segment filter
y = 132
rrect(d, (16, y, 374, y+34), 8, INPUT_BG)
# 全部 (active)
rrect(d, (18, y+2, 80, y+32), 6, BLUE)
d.text((30, y+8), "全部", fill=TEXT, font=f13)
# 电影
d.text((120, y+8), "电影", fill=SEC, font=f13)
# 剧集
d.text((200, y+8), "剧集", fill=SEC, font=f13)

# Movie list items
y_start = 180
cover_w, cover_h = 68, 68
gap = 8

for i, (en, cn, meta, typ, pcolor) in enumerate(movies):
    iy = y_start + i * (78 + gap)
    if iy + 78 > H - 80:
        break
    
    # Card bg
    rrect(d, (16, iy, 374, iy+78), 10, CARD_BG)
    
    # Cover
    cx, cy = 17, iy+5
    d.rectangle([cx, cy, cx+cover_w-2, cy+cover_h-2], fill=pcolor)
    # Fake poster detail
    bar_h = 14
    d.rectangle([cx, cy+cover_h-bar_h, cx+cover_w, cy+cover_h],
                fill=(max(0,pcolor[0]-25), max(0,pcolor[1]-25), max(0,pcolor[2]-25)))
    for j in range(2):
        ly = cy + 16 + j*8
        lw = cover_w - 16 - j*6
        d.rectangle([cx+8, ly, cx+8+lw, ly+2], fill=(255,255,255,50))
    
    # Info (unified fonts)
    ix = cx + cover_w + 12
    d.text((ix, iy+8), en, fill=TEXT, font=f13)        # 13px bold
    d.text((ix, iy+26), cn, fill=SEC, font=f10)        # 10px
    d.text((ix, iy+40), meta, fill=SEC, font=f11)      # 11px
    
    # Type badge
    bc = BLUE if typ == "movie" else ORANGE
    bt = "电影" if typ == "movie" else "剧集"
    tw = d.textsize(bt, font=f10)[0] + 12
    rrect(d, (ix, iy+56, ix+tw, iy+72), 4, bc)
    d.text((ix+6, iy+57), bt, fill=TEXT, font=f10)

# Bottom tab bar
tab_y = H - 56
d.rectangle([0, tab_y-1, W, tab_y], fill=BORDER)
rrect(d, (0, tab_y, W, H), 0, CARD_BG)

tabs = [("🏠","首页"), ("🎵","音乐"), ("🎬","影视"), ("📊","统计")]
for i, (icon, label) in enumerate(tabs):
    tx = 16 + i * (W-32)//4 + (W-32)//8
    d.text((tx-6, tab_y+8), icon, fill=SEC, font=f17)
    c = BLUE if i == 2 else SEC
    d.text((tx-8, tab_y+30), label, fill=c, font=f10)

# Theme button
rrect(d, (16, H-120, 80, H-102), 18, INPUT_BG)
d.text((26, H-118), "🌓 切换", fill=TEXT, font=f11)

out = os.path.expanduser("~/MediaVault/preview-shot.png")
img.save(out, quality=95)
print(f"Saved: {out} ({W}x{H})")
