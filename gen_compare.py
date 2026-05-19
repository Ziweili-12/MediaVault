from PIL import Image, ImageDraw, ImageFont
import os

W = 390
HEADER_H = 60
ITEM_H = 90
GAP = 8
PAD_X = 16
N_ITEMS = 6

BG = (0, 0, 0)
CARD_BG = (28, 28, 30)
TEXT_PRIMARY = (255, 255, 255)
TEXT_SEC = (140, 140, 145)
BLUE = (10, 132, 255)
ORANGE = (255, 159, 10)

movies = [
    ("Interstellar",      "星际穿越",    "美国/英国 · 2014",  "movie",  (44, 62, 80)),
    ("Shawshank Redemption","肖申克的救赎","美国 · 1994",      "movie",  (140, 40, 30)),
    ("Reply 1988",         "请回答1988",  "韩国 · 2015",      "series", (200, 110, 30)),
    ("Inception",          "盗梦空间",    "美国/英国 · 2010", "movie",  (30, 80, 140)),
    ("Blade Runner 2049",  "银翼杀手2049","美/英/加 · 2017",  "movie",  (22, 160, 130)),
    ("Stranger Things",    "怪奇物语",    "美国 · 2016",      "series", (120, 50, 150)),
]

def get_font(size=13):
    paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSText.ttf",
        "/System/Library/Fonts/PingFang.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                pass
    return ImageFont.load_default()

def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0+radius, y0, x1-radius, y1], fill=fill)
    draw.rectangle([x0, y0+radius, x1, y1-radius], fill=fill)
    draw.pieslice([x0, y0, x0+2*radius, y0+2*radius], 180, 270, fill=fill)
    draw.pieslice([x1-2*radius, y0, x1, y0+2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1-2*radius, x0+2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1-2*radius, y1-2*radius, x1, y1], 0, 90, fill=fill)

def draw_label_badge(draw, x, y, text, color, font):
    tw = draw.textsize(text, font=font)[0] + 12
    th = 16
    draw_rounded_rect(draw, (x, y, x+tw, y+th), 4, color)
    draw.text((x+6, y+1), text, fill=(255,255,255), font=font)

def make_version(label, badge_text, badge_color, cover_w, cover_h):
    total_h = HEADER_H + N_ITEMS * (ITEM_H + GAP) + 40
    img = Image.new('RGB', (W, total_h), BG)
    draw = ImageDraw.Draw(img)
    
    font_big = get_font(22)
    font_med = get_font(13)
    font_sm = get_font(11)
    font_xs = get_font(9)
    font_dim = get_font(8)
    
    # Label
    draw.text((W//2 - 30, 10), label, fill=TEXT_SEC, font=font_sm)
    
    # Header
    y = 36
    draw.text((PAD_X, y), "影视收藏", fill=TEXT_PRIMARY, font=font_big)
    bx = W - PAD_X - 70
    draw_rounded_rect(draw, (bx, y+4, bx+66, y+22), 6, badge_color)
    draw.text((bx+8, y+5), badge_text, fill=(255,255,255), font=font_xs)
    
    y_start = HEADER_H + 10
    
    for i, (en, cn, meta, typ, pcolor) in enumerate(movies):
        iy = y_start + i * (ITEM_H + GAP)
        
        # Card bg
        draw_rounded_rect(draw, (PAD_X, iy, W-PAD_X, iy+ITEM_H), 10, CARD_BG)
        
        # Cover
        cx = PAD_X + 1
        cy = iy + 1
        draw.rectangle([cx, cy, cx+cover_w-2, cy+cover_h-2], fill=pcolor)
        # Fake poster lines
        bar_h = cover_h // 5
        draw.rectangle([cx, cy+cover_h-bar_h, cx+cover_w, cy+cover_h], fill=(max(0,pcolor[0]-20), max(0,pcolor[1]-20), max(0,pcolor[2]-20)))
        for j in range(3):
            ly = cy + cover_h//5 + j*6
            if ly < cy + cover_h - bar_h - 2:
                lw = cover_w - 14 - j*3
                draw.rectangle([cx+7, ly, cx+7+lw, ly+2], fill=(255,255,255,50))
        
        # Dim label
        dim_text = f"{cover_w}x{cover_h}"
        draw.text((cx+2, cy+cover_h-12), dim_text, fill=(255,255,255,160), font=font_dim)
        
        # Info
        ix = cx + cover_w + 10
        iy_info = iy + 10
        draw.text((ix, iy_info), en, fill=TEXT_PRIMARY, font=font_med)
        draw.text((ix, iy_info+18), cn, fill=TEXT_SEC, font=font_sm)
        draw.text((ix, iy_info+34), meta, fill=TEXT_SEC, font=font_sm)
        
        badge_c = BLUE if typ == "movie" else ORANGE
        badge_t = "电影" if typ == "movie" else "剧集"
        draw_label_badge(draw, ix, iy_info+52, badge_t, badge_c, font_xs)
    
    return img

img_a = make_version("当前版本", "68×68 正方形", ORANGE, 68, 68)
img_b = make_version("建议版本", "52×78 竖版", BLUE, 52, 78)

gap = 16
total_w = img_a.width + gap + img_b.width
total_h = max(img_a.height, img_b.height)
combined = Image.new('RGB', (total_w, total_h), (17, 17, 17))
combined.paste(img_a, (0, 0))
combined.paste(img_b, (img_a.width + gap, 0))

d = ImageDraw.Draw(combined)
d.line([(img_a.width + gap//2, 20), (img_a.width + gap//2, total_h - 20)], fill=(60,60,60), width=1)

out_path = os.path.expanduser("~/MediaVault/list-compare.png")
combined.save(out_path, quality=95)
print(f"Saved: {out_path} ({combined.size[0]}x{combined.size[1]})")
