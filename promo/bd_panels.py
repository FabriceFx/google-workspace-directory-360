# -*- coding: utf-8 -*-
"""Génère les 8 cases BD (2160x2160) de la vidéo de présentation d'Annuaire 360°."""
import math, os
from PIL import Image, ImageDraw, ImageFont

S = 2160                      # rendu 2x, la vidéo sortira en 1080
OUT = "/Users/fabrice/Documents/Mes développements/Annuaire 360/promo"
os.makedirs(OUT, exist_ok=True)

BLEU, BLEU_F, ROUGE = "#1a73e8", "#174ea6", "#ea4335"
JAUNE, CREME, NOIR, BLANC = "#ffd93d", "#fff8ec", "#1b1b1b", "#ffffff"
VERT = "#188038"
PEAU, CHEVEUX, CHEMISE = "#f4c39a", "#3a2e2a", BLEU

F_COMIC = "/System/Library/Fonts/Supplemental/Comic Sans MS.ttf"
F_COMIC_B = "/System/Library/Fonts/Supplemental/Comic Sans MS Bold.ttf"
F_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

def font(path, size): return ImageFont.truetype(path, size)

# ---------------------------------------------------------------- primitives
def halftone(d, box, r=9, step=44, color="#00000022"):
    x0, y0, x1, y1 = box
    for i, y in enumerate(range(int(y0), int(y1), step)):
        off = (step // 2) if i % 2 else 0
        for x in range(int(x0) + off, int(x1), step):
            d.ellipse([x - r, y - r, x + r, y + r], fill=color)

def sunburst(d, cx, cy, n=28, r1=300, r2=2200, c1=JAUNE, c2="#ffce00"):
    for i in range(n):
        a0 = (2 * math.pi / n) * i
        a1 = a0 + (2 * math.pi / n) * 0.5
        d.polygon([(cx, cy),
                   (cx + r2 * math.cos(a0), cy + r2 * math.sin(a0)),
                   (cx + r2 * math.cos(a1), cy + r2 * math.sin(a1))],
                  fill=c1 if i % 2 else c2)

def speed_lines(d, cx, cy, n=40, r1=760, r2=1500, color="#00000030", w=7):
    for i in range(n):
        a = (2 * math.pi / n) * i + 0.07
        d.line([cx + r1 * math.cos(a), cy + r1 * math.sin(a),
                cx + r2 * math.cos(a), cy + r2 * math.sin(a)], fill=color, width=w)

def burst(d, cx, cy, r_out, r_in, n=12, fill=JAUNE, outline=NOIR, w=12, rot=0.0):
    pts = []
    for i in range(2 * n):
        r = r_out if i % 2 == 0 else r_in
        a = math.pi * i / n + rot
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=fill, outline=outline, width=w)

def caption(d, text, x=70, y=70, size=64, wmax=None):
    f = font(F_COMIC_B, size)
    pad = 28
    bb = d.textbbox((0, 0), text, font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.rectangle([x, y, x + w + 2 * pad, y + h + 2 * pad + 10], fill=JAUNE, outline=NOIR, width=10)
    d.text((x + pad, y + pad), text, font=f, fill=NOIR)

def wrap(d, text, f, wmax):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textbbox((0, 0), t, font=f)[2] <= wmax: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur)
    return lines

def bubble(d, cx, cy, text, size=66, wmax=760, tail=None, fill=BLANC):
    f = font(F_COMIC_B, size)
    lines = wrap(d, text, f, wmax)
    lh = size * 1.28
    w = max(d.textbbox((0, 0), l, font=f)[2] for l in lines) + 110
    h = lh * len(lines) + 90
    x0, y0 = cx - w / 2, cy - h / 2
    if tail:
        tx, ty = tail
        d.polygon([(cx - 60, cy), (cx + 60, cy), (tx, ty)], fill=fill, outline=NOIR, width=12)
    d.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=70, fill=fill, outline=NOIR, width=12)
    if tail:
        tx, ty = tail
        d.polygon([(cx - 58, cy + (h/2 - 40) * (1 if ty > cy else -1)),
                   (cx + 58, cy + (h/2 - 40) * (1 if ty > cy else -1)), (tx, ty)], fill=fill)
    for i, l in enumerate(lines):
        lw = d.textbbox((0, 0), l, font=f)[2]
        d.text((cx - lw / 2, y0 + 45 + i * lh), l, font=f, fill=NOIR)

def shout(img, text, cx, cy, size=210, fill=ROUGE, angle=-8, stroke=22):
    lay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    f = font(F_BLACK, size)
    bb = d.textbbox((0, 0), text, font=f, stroke_width=stroke)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text((S / 2 - w / 2, S / 2 - h / 2), text, font=f, fill=fill,
           stroke_width=stroke, stroke_fill=NOIR)
    lay = lay.rotate(angle, resample=Image.BICUBIC, center=(S / 2, S / 2))
    img.paste(lay, (int(cx - S / 2), int(cy - S / 2)), lay)

def stamp(img, text, cx, cy, size=170, color=ROUGE, angle=-12):
    lay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    f = font(F_BLACK, size)
    bb = d.textbbox((0, 0), text, font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    pad = 46
    d.rounded_rectangle([S/2 - w/2 - pad, S/2 - h/2 - pad, S/2 + w/2 + pad, S/2 + h/2 + pad],
                        radius=34, outline=color, width=26, fill="#ffffffd8")
    d.text((S/2 - w/2 - bb[0], S/2 - h/2 - bb[1]), text, font=f, fill=color)
    lay = lay.rotate(angle, resample=Image.BICUBIC, center=(S/2, S/2))
    img.paste(lay, (int(cx - S/2), int(cy - S/2)), lay)

# ---------------------------------------------------------------- personnage
def perso(d, cx, cy, sc=1.0, mood="tired", arms="down", shirt=CHEMISE):
    """Buste stylisé. cy = haut de la tête."""
    def X(v): return cx + v * sc
    def Y(v): return cy + v * sc
    # corps
    d.rounded_rectangle([X(-190), Y(300), X(190), Y(760)], radius=int(120*sc), fill=shirt, outline=NOIR, width=10)
    # bras
    if arms == "up":
        d.line([X(-160), Y(400), X(-330), Y(120)], fill=shirt, width=int(88*sc))
        d.line([X(160), Y(400), X(330), Y(120)], fill=shirt, width=int(88*sc))
        d.ellipse([X(-370), Y(80), X(-290), Y(160)], fill=PEAU, outline=NOIR, width=8)
        d.ellipse([X(290), Y(80), X(370), Y(160)], fill=PEAU, outline=NOIR, width=8)
    elif arms == "desk":
        d.line([X(-160), Y(430), X(-300), Y(640)], fill=shirt, width=int(84*sc))
        d.line([X(160), Y(430), X(300), Y(640)], fill=shirt, width=int(84*sc))
    # tête
    d.ellipse([X(-170), Y(0), X(170), Y(340)], fill=PEAU, outline=NOIR, width=12)
    # cheveux
    d.pieslice([X(-178), Y(-24), X(178), Y(240)], 180, 360, fill=CHEVEUX)
    d.ellipse([X(-178), Y(60), X(-90), Y(160)], fill=CHEVEUX)
    d.ellipse([X(90), Y(60), X(178), Y(160)], fill=CHEVEUX)
    # lunettes
    for sx in (-1, 1):
        d.rounded_rectangle([X(sx*30 if sx>0 else -130), Y(130), X(130 if sx>0 else sx*30), Y(215)],
                            radius=int(26*sc), outline=NOIR, width=12)
    d.line([X(-30), Y(168), X(30), Y(168)], fill=NOIR, width=12)
    # yeux
    if mood == "sleep":
        for sx in (-1, 1):
            d.arc([X(sx*80 - 32), Y(160), X(sx*80 + 32), Y(205)], 0, 180, fill=NOIR, width=10)
    else:
        for sx in (-1, 1):
            d.ellipse([X(sx*80 - 16), Y(158), X(sx*80 + 16), Y(196)], fill=NOIR)
    # bouche
    if mood == "tired":
        d.arc([X(-70), Y(255), X(70), Y(330)], 180, 360, fill=NOIR, width=12)
    elif mood == "happy":
        d.arc([X(-80), Y(220), X(80), Y(310)], 0, 180, fill=NOIR, width=14)
    elif mood == "wow":
        d.ellipse([X(-40), Y(245), X(40), Y(320)], fill=NOIR)
    elif mood == "sleep":
        d.arc([X(-40), Y(265), X(40), Y(310)], 0, 180, fill=NOIR, width=10)

def laptop(d, cx, cy, w=760, h=440, screen=NOIR):
    d.rounded_rectangle([cx - w/2, cy - h, cx + w/2, cy], radius=26, fill="#3c4043", outline=NOIR, width=12)
    d.rectangle([cx - w/2 + 34, cy - h + 34, cx + w/2 - 34, cy - 34], fill=screen)
    d.polygon([(cx - w/2 - 70, cy + 90), (cx + w/2 + 70, cy + 90),
               (cx + w/2, cy), (cx - w/2, cy)], fill="#5f6368", outline=NOIR, width=10)

# ---------------------------------------------------------------- cases
def new_panel(bg=BLANC):
    img = Image.new("RGB", (S, S), CREME)
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([46, 46, S - 46, S - 46], fill=bg, outline=NOIR, width=26)
    return img, d

def p1():
    img, d = new_panel("#14213d")
    # fenêtres de console empilées
    for i, (x, y) in enumerate([(300, 420), (560, 350), (860, 480), (1240, 380), (1500, 500), (700, 700), (1150, 720)]):
        d.rounded_rectangle([x, y, x + 520, y + 330], radius=18, fill="#e8eaed", outline=NOIR, width=8)
        d.rectangle([x, y, x + 520, y + 64], fill=BLEU_F)
        for r in range(3):
            d.line([x + 40, y + 130 + r * 62, x + 480, y + 130 + r * 62], fill="#9aa0a6", width=14)
    perso(d, 1080, 1150, mood="tired", arms="desk")
    laptop(d, 1080, 2010, screen="#0b2545")
    # sueur
    for sx, sy in [(760, 1180), (1400, 1160), (820, 1330)]:
        d.polygon([(sx, sy), (sx - 26, sy + 70), (sx + 26, sy + 70)], fill="#8ecae6", outline=NOIR, width=6)
        d.ellipse([sx - 30, sy + 40, sx + 30, sy + 105], fill="#8ecae6", outline=NOIR, width=6)
    bubble(d, 1080, 780, "Qui n'a PAS activé la validation en 2 étapes ?!",
           size=62, wmax=820, tail=(1080, 1010))
    caption(d, "23h47. Quelque part, un admin Google Workspace…", size=56)
    shout(img, "ARGH !", 1750, 1650, size=190, fill=ROUGE, angle=10)
    return img

def p2():
    img, d = new_panel()
    d2 = ImageDraw.Draw(img, "RGBA")
    halftone(d2, (80, 80, S - 80, 700), color="#1a73e822")
    # tableau monstre incliné
    lay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    dl = ImageDraw.Draw(lay)
    x0, y0, x1, y1 = 480, 480, 1720, 1560
    dl.rectangle([x0, y0, x1, y1], fill=BLANC, outline=NOIR, width=16)
    for c in range(1, 8):
        dl.line([x0 + c * (x1 - x0) / 8, y0, x0 + c * (x1 - x0) / 8, y1], fill="#9aa0a6", width=6)
    for r in range(1, 12):
        dl.line([x0, y0 + r * (y1 - y0) / 12, x1, y0 + r * (y1 - y0) / 12], fill="#9aa0a6", width=6)
    dl.rectangle([x0, y0, x1, y0 + (y1 - y0) / 12], fill=ROUGE)
    # yeux méchants sur le tableau
    for ex in (900, 1300):
        dl.polygon([(ex - 90, 640), (ex + 90, 700), (ex - 20, 760)], fill=NOIR)
    lay = lay.rotate(-7, resample=Image.BICUBIC, center=(1100, 1000))
    img.paste(lay, (0, 0), lay)
    f = font(F_COMIC_B, 88)
    d2.text((640, 1660), "9 000 lignes × 47 colonnes", font=f, fill=NOIR)
    perso(d2, 420, 1450, sc=0.8, mood="tired", arms="up")
    burst(d2, 1690, 480, 330, 190, n=11, fill=JAUNE, rot=0.3)
    shout(img, "CRASH !", 1690, 480, size=150, fill=ROUGE, angle=-7, stroke=18)
    caption(d2, "Le réflexe : tout exporter. Mauvaise idée.", size=56)
    return img

def p3():
    img, d = new_panel(JAUNE)
    sunburst(d, 1080, 1120)
    d.rectangle([46, 46, S - 46, S - 46], outline=NOIR, width=26)
    # carte logo
    d.rounded_rectangle([640, 640, 1520, 1520], radius=90, fill=BLANC, outline=NOIR, width=22)
    d.arc([790, 760, 1370, 1340], 100, 330, fill=BLEU, width=46)
    d.arc([790, 760, 1370, 1340], 340, 90, fill=ROUGE, width=46)
    # pointe de flèche au bout de l'arc rouge (rotation 360°)
    ax, ay = 1080 + 290 * math.cos(math.radians(90)), 1050 + 290 * math.sin(math.radians(90))
    d.polygon([(ax - 55, ay + 22), (ax + 40, ay + 60), (ax + 10, ay - 55)], fill=ROUGE)
    f = font(F_BLACK, 200)
    t = "360°"
    w = d.textbbox((0, 0), t, font=f)[2]
    d.text((1080 - w / 2, 930), t, font=f, fill=BLEU_F)
    # bandeau nom
    d.rounded_rectangle([460, 1560, 1700, 1760], radius=40, fill=BLEU_F, outline=NOIR, width=16)
    f2 = font(F_BLACK, 120)
    t2 = "ANNUAIRE 360°"
    w2 = d.textbbox((0, 0), t2, font=f2)[2]
    d.text((1080 - w2 / 2, 1590), t2, font=f2, fill=BLANC)
    shout(img, "TADAM !", 1080, 420, size=230, fill=BLEU_F, angle=-4, stroke=24)
    caption(d, "Et puis, un matin…", size=56)
    return img

def p4():
    img, d = new_panel()
    # fenêtre navigateur
    d.rounded_rectangle([170, 420, 1990, 1900], radius=30, fill="#f8f9fa", outline=NOIR, width=16)
    d.rectangle([170, 420, 1990, 540], fill=BLEU_F)
    for i, c in enumerate([ROUGE, JAUNE, VERT]):
        d.ellipse([230 + i * 90, 450, 290 + i * 90, 510], fill=c, outline=NOIR, width=6)
    # tuiles KPI
    vals = [("9 000", "comptes"), ("212", "sans 2SV"), ("14", "admins"), ("37", "alertes")]
    for i, (v, l) in enumerate(vals):
        x = 260 + i * 430
        d.rounded_rectangle([x, 620, x + 380, 900], radius=24, fill=BLANC,
                            outline=ROUGE if i in (1, 3) else NOIR, width=12)
        fv = font(F_BLACK, 110)
        d.text((x + 40, 660), v, font=fv, fill=BLEU_F if i not in (1, 3) else ROUGE)
        fl = font(F_COMIC_B, 52)
        d.text((x + 40, 800), l, font=fl, fill=NOIR)
    # lignes de tableau
    for r in range(5):
        y = 1020 + r * 150
        d.rounded_rectangle([260, y, 1900, y + 110], radius=16, fill=BLANC, outline="#9aa0a6", width=6)
        d.ellipse([300, y + 20, 370, y + 90], fill=[BLEU, ROUGE, VERT, JAUNE, BLEU_F][r])
        for cx_, cw in [(420, 400), (860, 300), (1200, 260), (1500, 340)]:
            d.rounded_rectangle([cx_, y + 34, cx_ + cw, y + 76], radius=12, fill="#dadce0")
    bubble(d, 1620, 300, "Tous les champs. Même les schémas RH !", size=58, wmax=700, tail=(1500, 620))
    caption(d, "Tout l'annuaire. Une seule page.", size=56)
    return img

def p5():
    img, d = new_panel()
    halftone(d, (80, 80, S - 80, S - 80), color="#ea433514")
    items = ["Manager fantôme : 3 comptes", "Téléphone partagé : 2 comptes",
             "Nom en double : 2 comptes", "Admin sans 2SV : 1 compte"]
    for i, t in enumerate(items):
        y = 480 + i * 330
        d.rounded_rectangle([260, y, 1900, y + 250], radius=26, fill=BLANC, outline=NOIR, width=12)
        d.polygon([(360, y + 60), (360, y + 190), (470, y + 125)], fill=ROUGE)
        f = font(F_COMIC_B, 72)
        d.text((540, y + 80), t, font=f, fill=NOIR)
    caption(d, "L'onglet Anomalies passe l'annuaire au crible…", size=56)
    stamp(img, "DÉTECTÉS !", 1440, 1160, size=200, angle=-14)
    return img

def p6():
    img, d = new_panel()
    speed_lines(d, 1080, 1080, color="#1a73e825")
    # mini table à gauche
    d.rounded_rectangle([220, 780, 900, 1380], radius=26, fill=BLANC, outline=NOIR, width=14)
    for r in range(4):
        d.line([260, 900 + r * 120, 860, 900 + r * 120], fill="#9aa0a6", width=10)
    # flèche
    d.polygon([(940, 1010), (1290, 1010), (1290, 930), (1470, 1080),
               (1290, 1230), (1290, 1150), (940, 1150)], fill=JAUNE, outline=NOIR, width=14)
    # icône sheets
    d.rounded_rectangle([1500, 760, 1960, 1400], radius=40, fill=VERT, outline=NOIR, width=16)
    d.rectangle([1580, 900, 1880, 1260], fill=BLANC)
    for i in range(1, 3):
        d.line([1580 + i * 100, 900, 1580 + i * 100, 1260], fill=VERT, width=10)
        d.line([1580, 900 + i * 120, 1880, 900 + i * 120], fill=VERT, width=10)
    # cadenas
    d.rounded_rectangle([1640, 1440, 1830, 1600], radius=24, fill=JAUNE, outline=NOIR, width=12)
    d.arc([1665, 1350, 1805, 1500], 180, 360, fill=NOIR, width=22)
    f = font(F_COMIC_B, 56)
    d.text((1400, 1640), "partagé en lecture", font=f, fill=NOIR)
    bubble(d, 700, 480, "Un clic, et c'est dans Google Sheets.", size=62, wmax=740, tail=(760, 760))
    caption(d, "Partager ? Zéro CSV mutilé par Excel.", size=56)
    shout(img, "ZOU !", 1150, 1720, size=200, fill=BLEU_F, angle=-6)
    return img

def p7():
    img, d = new_panel("#14213d")
    d.ellipse([1620, 220, 1920, 520], fill="#f4e04d", outline=NOIR, width=10)
    d.ellipse([1550, 200, 1810, 460], fill="#14213d")
    for sx, sy in [(420, 320), (760, 240), (1200, 350), (1450, 260)]:
        burst(d, sx, sy, 26, 10, n=4, fill=BLANC, outline=BLANC, w=2)
    # lit
    d.rounded_rectangle([340, 1450, 1820, 1830], radius=40, fill="#c9d6ea", outline=NOIR, width=14)
    d.rectangle([340, 1600, 1820, 1830], fill=BLEU_F)
    d.rounded_rectangle([420, 1330, 780, 1520], radius=40, fill=BLANC, outline=NOIR, width=12)
    # dormeur
    perso(d, 1010, 1090, sc=0.72, mood="sleep")
    f = font(F_BLACK, 150)
    d.text((1250, 800), "Z z z…", font=f, fill=BLANC)
    # mail qui veille
    d.rounded_rectangle([1450, 1050, 1900, 1330], radius=30, fill=BLANC, outline=NOIR, width=14)
    d.polygon([(1450, 1070), (1675, 1230), (1900, 1070)], outline=NOIR, width=12)
    d.ellipse([1830, 990, 1960, 1120], fill=ROUGE, outline=NOIR, width=10)
    fb = font(F_BLACK, 80)
    d.text((1868, 1010), "1", font=fb, fill=BLANC)
    bubble(d, 1080, 480, "Un indicateur a changé ? Le rapport quotidien prévient. Sinon : silence.",
           size=56, wmax=1050)
    caption(d, "Pendant ce temps, chaque nuit…", size=56, y=1920)
    return img

def p8():
    img, d = new_panel(BLEU_F)
    halftone(d, (80, 80, S - 80, S - 80), color="#ffffff14", r=7)
    f0 = font(F_BLACK, 175)
    t = "ANNUAIRE 360°"
    w = d.textbbox((0, 0), t, font=f0)[2]
    d.text((1080 - w / 2, 330), t, font=f0, fill=BLANC, stroke_width=16, stroke_fill=NOIR)
    lignes = ["Tous les champs. Tous les comptes.",
              "KPI · Anomalies · Vues · Sheets · Rapports",
              "Open source (MIT) · Google Apps Script"]
    for i, l in enumerate(lignes):
        fl = font(F_COMIC_B, 74)
        wl = d.textbbox((0, 0), l, font=fl)[2]
        d.rounded_rectangle([1080 - wl/2 - 40, 700 + i * 230, 1080 + wl/2 + 40, 700 + i * 230 + 140],
                            radius=30, fill=JAUNE if i != 1 else BLANC, outline=NOIR, width=12)
        d.text((1080 - wl / 2, 720 + i * 230), l, font=fl, fill=NOIR)
    perso(d, 1080, 1440, sc=0.85, mood="happy", arms="up", shirt=ROUGE)
    fl2 = font(F_COMIC_B, 80)
    t2 = "Lien dans le post"
    w2 = d.textbbox((0, 0), t2, font=fl2)[2]
    ax = 1080 - w2 / 2 - 40
    d.polygon([(ax - 110, 2000), (ax - 110, 2060), (ax - 30, 2060),
               (ax - 30, 2090), (ax + 30, 2030), (ax - 30, 1970), (ax - 30, 2000)],
              fill=JAUNE, outline=NOIR, width=8)
    d.text((1080 - w2 / 2 + 60, 1980), t2, font=fl2, fill=BLANC)
    return img

if __name__ == "__main__":
    for i, fn in enumerate([p1, p2, p3, p4, p5, p6, p7, p8], 1):
        img = fn()
        img.save(os.path.join(OUT, "panel%d.png" % i))
        img.resize((1080, 1080), Image.LANCZOS).save(os.path.join(OUT, "panel%d_1080.png" % i))
        print("panel", i, "ok")
