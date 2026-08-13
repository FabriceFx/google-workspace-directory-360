# -*- coding: utf-8 -*-
"""Assemble les 8 cases en vidéo 1080x1080 : zoom lent alterné + fondus enchaînés."""
import subprocess, imageio_ffmpeg, os

FF = imageio_ffmpeg.get_ffmpeg_exe()
DIR = "/Users/fabrice/Documents/Mes développements/Annuaire 360/promo"
N, FPS, DUR, XF = 8, 30, 3.2, 0.5
D = int(DUR * FPS)

inputs, filters = [], []
for i in range(N):
    # une seule frame par case : c'est zoompan (d=96) qui fabrique la durée
    inputs += ["-i", os.path.join(DIR, "panel%d.png" % (i + 1))]
    if i % 2 == 0:
        z = "z='min(1+0.0009*on,1.09)'"
    else:
        z = "z='max(1.09-0.0009*on,1.0)'"
    filters.append(
        "[%d:v]scale=2160:2160,zoompan=%s:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        ":d=%d:s=1080x1080:fps=%d,setsar=1,format=yuv420p[v%d]" % (i, z, D, FPS, i))

prev = "v0"
for i in range(1, N):
    out = "x%d" % i
    offset = i * (DUR - XF)
    filters.append("[%s][v%d]xfade=transition=fade:duration=%s:offset=%s[%s]"
                   % (prev, i, XF, round(offset, 2), out))
    prev = out

filters.append("[%s]format=yuv420p[vout]" % prev)
cmd = [FF, "-y"] + inputs + [
    "-filter_complex", ";".join(filters), "-map", "[vout]",
    "-c:v", "libx264", "-crf", "19", "-preset", "medium",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", str(FPS),
    os.path.join(DIR, "annuaire360_bd.mp4")]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print("libx264 KO, repli mpeg4:", r.stderr[-600:])
    cmd[cmd.index("libx264")] = "mpeg4"
    ci = cmd.index("-crf"); cmd[ci:ci+2] = ["-q:v", "3"]
    r = subprocess.run(cmd, capture_output=True, text=True)
print("returncode:", r.returncode)
if r.returncode != 0: print(r.stderr[-1500:])
