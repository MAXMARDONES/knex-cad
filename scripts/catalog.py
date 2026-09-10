#!/usr/bin/env python3
"""Draw the K'NEX parts catalogue as SVG (one file per connector + one rod ladder + one joints sheet).
   python3 scripts/catalog.py  ->  docs/catalog/*.svg (+ .png if cairosvg is present)"""
import math, os, json, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "docs", "catalog")
os.makedirs(OUT, exist_ok=True)

KINDS = {                       # code: (name, colour, slots, note)
 "W8": ("8-way", "#ECECEA", [0,1,2,3,4,5,6,7], "the workhorse plane node"),
 "B7": ("7-way 3D", "#2563D9", [0,1,2,3,4,5,6], "slot 7 replaced by a perpendicular slot: mates with another 3D connector"),
 "Y5": ("5-way", "#F2C51D", [0,1,2,3,4], "half circle"),
 "G4": ("4-way", "#2E9E4F", [0,1,2,3], "135 deg fan"),
 "P4": ("4-way 3D", "#7B4FB8", [0,1,2,3], "135 deg fan + perpendicular slot"),
 "R3": ("3-way", "#D9302C", [0,1,2], "quarter circle: the clean 90 deg corner"),
 "L2": ("2-way V", "#B9BDC3", [0,1], "45 deg V, not 90"),
 "O2": ("2-way straight", "#F08A1D", [0,4], "adds exactly 20 mm between two rods; weak in load paths"),
 "D1": ("1-way cap", "#4A4E55", [0], "end cap / spacer"),
}
RODS = [("green","#2E9E4F",1,37.5,17.5,False), ("white","#ECECEA",1.4142,53.03,33,True), ("blue","#2563D9",2,75.0,55,True),
        ("yellow","#F2C51D",2.8284,106.07,86,True), ("red","#D9302C",4,150.0,130,True), ("grey","#8C9096",5.6569,212.13,192,True)]
INK, MUTED, LINE, ACCENT, BG = "#151915", "#5C665C", "#CBD0C6", "#E8531A", "#FFFFFF"
FONT = "font-family='IBM Plex Mono, Menlo, monospace'"

def head(w, h, title):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' width='{w}' height='{h}' role='img'>"
            f"<title>{title}</title><rect width='{w}' height='{h}' fill='{BG}'/>")

def connector_svg(code):
    name, col, slots, note = KINDS[code]
    S, cx, cy, R, HUB = 360, 180, 175, 118, 40
    W = 470      # R = arm tip (18.75 mm), HUB = hub ring
    px = R / 18.75                                   # px per mm
    s = [head(W, S + 62, f"K'NEX {code} {name} connector")]
    s.append(f"<circle cx='{cx}' cy='{cy}' r='{R}' fill='none' stroke='{LINE}' stroke-dasharray='3 4'/>")
    for k in range(8):                               # ghost of every 45 deg position
        a = math.radians(45 * k); x, y = cx + R * math.cos(a), cy - R * math.sin(a)
        on = k in slots
        if on:
            w = 9.9 * px / 2
            dx, dy = math.cos(a), -math.sin(a)
            nx, ny = -dy, dx
            x0, y0 = cx + HUB * dx, cy + HUB * dy
            pts = [(x0 + nx*w, y0 + ny*w), (x + nx*w, y + ny*w), (x + nx*w*0.55, y + ny*w*0.55), (x + nx*w*0.55 - dx*22, y + ny*w*0.55 - dy*22),
                   (x - nx*w*0.55 - dx*22, y - ny*w*0.55 - dy*22), (x - nx*w*0.55, y - ny*w*0.55), (x - nx*w, y - ny*w), (x0 - nx*w, y0 - ny*w)]
            s.append("<polygon points='" + " ".join(f"{p[0]:.1f},{p[1]:.1f}" for p in pts) + f"' fill='{col}' stroke='{INK}' stroke-width='1.4' stroke-linejoin='round'/>")
        lx, ly = cx + (R + 26) * math.cos(a), cy - (R + 26) * math.sin(a)
        s.append(f"<text x='{lx:.0f}' y='{ly+5:.0f}' text-anchor='middle' {FONT} font-size='16' font-weight='700' fill='{ACCENT if on else LINE}'>{k}</text>")
    s.append(f"<circle cx='{cx}' cy='{cy}' r='{HUB}' fill='{col}' stroke='{INK}' stroke-width='1.4'/>")
    s.append(f"<circle cx='{cx}' cy='{cy}' r='{3.2*px:.1f}' fill='{BG}' stroke='{INK}' stroke-width='1.4'/>")
    if code in ("B7", "P4"):
        a = math.radians(45 * (slots[-1] + 1))
        x, y = cx + (R - 14) * math.cos(a), cy - (R - 14) * math.sin(a)
        s.append(f"<line x1='{cx}' y1='{cy}' x2='{x:.0f}' y2='{y:.0f}' stroke='{INK}' stroke-width='7' stroke-linecap='round' stroke-dasharray='2 6'/>")
    s.append(f"<text x='14' y='26' {FONT} font-size='19' font-weight='700' fill='{INK}'>{code}  {name}</text>")
    s.append(f"<text x='{W-14}' y='26' text-anchor='end' {FONT} font-size='12' fill='{MUTED}'>socket k at 45 deg x k from slot 0</text>")
    s.append(f"<text x='14' y='{S+14}' {FONT} font-size='12' fill='{MUTED}'>sockets {','.join(map(str,slots))} · disc 37.5 mm across · 6.2 thick</text>")
    s.append(f"<text x='14' y='{S+32}' {FONT} font-size='12' fill='{MUTED}'>hub hole 6.4 (rod spins) · socket floor 10 mm from centre</text>")
    s.append(f"<text x='14' y='{S+50}' {FONT} font-size='12' fill='{MUTED}'>{note}</text></svg>")
    return "".join(s)

def rods_svg():
    W, H, x0, y0 = 1160, 300, 150, 46
    px = 620 / 212.13
    s = [head(W, H, "K'NEX rod ladder")]
    s.append(f"<text x='14' y='26' {FONT} font-size='19' font-weight='700' fill='{INK}'>Rod ladder · centre-to-centre = 37.5 x sqrt(2)^(n-1)</text>")
    for i, (nm, col, u, c2c, real, ridge) in enumerate(RODS):
        y = y0 + i * 38
        s.append(f"<text x='14' y='{y+5}' {FONT} font-size='14' fill='{INK}'>{nm}</text>")
        s.append(f"<line x1='{x0}' y1='{y}' x2='{x0+c2c*px:.0f}' y2='{y}' stroke='{LINE}' stroke-width='1' stroke-dasharray='2 3'/>")
        rx0, rw = x0 + 10 * px, real * px
        s.append(f"<rect x='{rx0:.0f}' y='{y-5}' width='{rw:.0f}' height='10' rx='4' fill='{col}' stroke='{INK}' stroke-width='1.2'/>")
        if ridge:
            for j in (-2.2, 0, 2.2):
                s.append(f"<line x1='{rx0+9*px:.1f}' y1='{y+j}' x2='{rx0+rw-9*px:.1f}' y2='{y+j}' stroke='{INK}' stroke-width='0.9' opacity='.5'/>")
        for e in (x0, x0 + c2c * px):
            s.append(f"<circle cx='{e:.0f}' cy='{y}' r='4' fill='none' stroke='{MUTED}' stroke-width='1.4'/>")
        s.append(f"<text x='{x0+c2c*px+14:.0f}' y='{y+5}' {FONT} font-size='13' fill='{MUTED}'>{c2c} c2c · {real} long · {u:g} U{'' if ridge else ' · no ridges: no side-on'}</text>")
    s.append(f"<text x='14' y='{H-14}' {FONT} font-size='13' fill='{MUTED}'>circles = connector centres · the lines are the four lengthwise ribs, where a connector clips side-on</text></svg>")
    return "".join(s)

def joints_svg():
    W, H = 1160, 470
    s = [head(W, H, "K'NEX joint types")]
    s.append(f"<text x='14' y='28' {FONT} font-size='19' font-weight='700' fill='{INK}'>The three joints, and what each one lets move</text>")
    cells = [
      ("end-on", "rod tip pushed into a socket", "RIGID. no rotation, no slide. the joint the whole lattice is built from.", "rod tip sits 10 mm from the hub centre, so c2c = rod length + 20"),
      ("hub (through-hole)", "rod passes through the centre hole", "FREE AXLE. spins about the rod and slides along it. this is the only real bearing.", "park it with spacers (3.1 blue / 9.3 silver) and stop it with a cap"),
      ("side-on", "socket bites the rod's ridge", "PIVOT WITH FRICTION about the rod axis; slides along it if pushed hard.", "only on ridges (every 8.9 mm) of white and longer. never on a green rod"),
      ("3D pair", "two 3D connectors slotted together", "RIGID, planes locked at 90 deg. the only way to turn a corner in all three axes.", "blue/blue leaves 2 hard positions, blue/grey 1: build the rod in before mating"),
    ]
    for i, (title, how, dof, note) in enumerate(cells):
        y = 60 + i * 92
        s.append(f"<rect x='14' y='{y}' width='{W-28}' height='80' fill='none' stroke='{LINE}'/>")
        s.append(f"<text x='30' y='{y+26}' {FONT} font-size='15' font-weight='700' fill='{ACCENT}'>{title}</text>")
        s.append(f"<text x='30' y='{y+46}' {FONT} font-size='12.5' fill='{MUTED}'>{how}</text>")
        s.append(f"<text x='250' y='{y+26}' {FONT} font-size='12.5' fill='{INK}'>{dof}</text>")
        s.append(f"<text x='250' y='{y+46}' {FONT} font-size='12.5' fill='{MUTED}'>{note}</text>")
        gx, gy = W - 150, y + 40
        if title == "end-on":
            s.append(f"<circle cx='{gx}' cy='{gy}' r='16' fill='none' stroke='{INK}' stroke-width='2'/><rect x='{gx+8}' y='{gy-4}' width='60' height='8' rx='3' fill='{RODS[2][1]}' stroke='{INK}'/>")
        elif title.startswith("hub"):
            s.append(f"<circle cx='{gx+34}' cy='{gy}' r='16' fill='none' stroke='{INK}' stroke-width='2'/><rect x='{gx-14}' y='{gy-4}' width='96' height='8' rx='3' fill='{RODS[2][1]}' stroke='{INK}'/><path d='M{gx+34} {gy-26} a 26 26 0 0 1 22 13' fill='none' stroke='{ACCENT}' stroke-width='2'/>")
        elif title == "side-on":
            s.append(f"<rect x='{gx-14}' y='{gy-4}' width='96' height='8' rx='3' fill='{RODS[2][1]}' stroke='{INK}'/><circle cx='{gx+34}' cy='{gy+26}' r='16' fill='none' stroke='{INK}' stroke-width='2'/><line x1='{gx+34}' y1='{gy+10}' x2='{gx+34}' y2='{gy+4}' stroke='{INK}' stroke-width='6'/>")
        else:
            s.append(f"<circle cx='{gx+28}' cy='{gy}' r='16' fill='none' stroke='{INK}' stroke-width='2'/><ellipse cx='{gx+28}' cy='{gy}' rx='5' ry='16' fill='none' stroke='{INK}' stroke-width='2'/>")
    s.append(f"<text x='14' y='{H-12}' {FONT} font-size='12' fill='{MUTED}'>every joint in a .knx build is inferred from geometry: put the parts where they go and the checker names the joint</text></svg>")
    return "".join(s)

if __name__ == "__main__":
    files = {f"connector_{c}.svg": connector_svg(c) for c in KINDS}
    files["rods.svg"] = rods_svg()
    files["joints.svg"] = joints_svg()
    for n, body in files.items():
        open(os.path.join(OUT, n), "w").write(body)
    try:
        import cairosvg
        for n in files: cairosvg.svg2png(url=os.path.join(OUT, n), write_to=os.path.join(OUT, n[:-4] + ".png"), scale=2)
        print("wrote", len(files), "svg + png to docs/catalog")
    except Exception as e:
        print("wrote", len(files), "svg to docs/catalog (no png:", e, ")")
