#!/usr/bin/env python3
"""
Build the web-ready character assets from a single source walking video.

Input : assets-src/character-walk-source.mp4   (opaque video, character centred)
Output: public/assets/character/
          walk-sprite.webp        transparent sprite sheet (used by the 3D scene)
          walk-sprite.json        sprite-sheet metadata (cols, rows, frame size, loop)
          walk-alpha.webm         transparent VP9 video (optional "video" character mode)
        public/assets/videos/
          character-walk.mp4      compressed full-scene video (mobile / reduced-motion hero)
          character-walk-poster.jpg

Requirements (dev-only, not needed to run the site):
    pip install "rembg[cpu]" imageio-ffmpeg pillow

Usage:
    npm run assets:character
    python3 scripts/build_character_assets.py --src path/to/other-walk.mp4 --fps 12

To swap in a new character video, drop it at assets-src/character-walk-source.mp4
(or pass --src) and re-run. The site picks the new files up automatically.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_CHAR = ROOT / "public" / "assets" / "character"
OUT_VIDEO = ROOT / "public" / "assets" / "videos"


def ffmpeg_exe() -> str:
    found = shutil.which("ffmpeg")
    if found:
        return found
    try:
        import imageio_ffmpeg  # type: ignore

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found. Install ffmpeg or `pip install imageio-ffmpeg`.")


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--src", default=str(ROOT / "assets-src" / "character-walk-source.mp4"))
    parser.add_argument("--fps", type=int, default=12, help="Sampling rate for the sprite sheet")
    parser.add_argument("--frame-w", type=int, default=200, help="Sprite frame width (px)")
    parser.add_argument("--frame-h", type=int, default=360, help="Sprite frame height (px)")
    parser.add_argument("--cols", type=int, default=12)
    args = parser.parse_args()

    from PIL import Image, ImageChops, ImageFilter, ImageStat
    from rembg import new_session, remove

    src = Path(args.src)
    if not src.exists():
        sys.exit(f"Source video not found: {src}")

    ff = ffmpeg_exe()
    OUT_CHAR.mkdir(parents=True, exist_ok=True)
    OUT_VIDEO.mkdir(parents=True, exist_ok=True)

    # 1) Compressed full-scene video + poster (no audio, fast-start, small GOP for smooth scrubbing).
    run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-an",
         "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "slow", "-crf", "27",
         "-g", "8", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         str(OUT_VIDEO / "character-walk.mp4")])
    run([ff, "-hide_banner", "-loglevel", "error", "-y", "-ss", "2.5", "-i", str(src),
         "-frames:v", "1", "-q:v", "4", str(OUT_VIDEO / "character-walk-poster.jpg")])

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp = Path(tmp_dir)
        (tmp / "raw").mkdir()
        (tmp / "cut").mkdir()
        run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
             "-vf", f"fps={args.fps}", str(tmp / "raw" / "f_%04d.png")])
        raw_frames = sorted((tmp / "raw").glob("f_*.png"))
        if not raw_frames:
            sys.exit("No frames extracted.")

        # 2) Background removal (human segmentation model), light alpha erosion to kill halo fringe.
        session = new_session("u2net_human_seg")
        cut_frames: list[Image.Image] = []
        for idx, frame_path in enumerate(raw_frames):
            rgb = Image.open(frame_path).convert("RGB")
            rgba = remove(rgb, session=session)
            alpha = rgba.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
            rgba.putalpha(alpha)
            cut_frames.append(rgba)
            print(f"  segmented {idx + 1}/{len(raw_frames)}", end="\r")
        print()

        # 3) Fixed crop window around the union of the character's horizontal extent.
        width, height = cut_frames[0].size
        lefts, rights = [], []
        for frame in cut_frames:
            box = frame.getchannel("A").point(lambda v: 255 if v > 128 else 0).getbbox()
            if box:
                lefts.append(box[0])
                rights.append(box[2])
        centre = (min(lefts) + max(rights)) // 2
        crop_w = int(height * args.frame_w / args.frame_h)
        x0 = max(0, min(width - crop_w, centre - crop_w // 2))
        crop_box = (x0, 0, x0 + crop_w, height)

        frames = [f.crop(crop_box).resize((args.frame_w, args.frame_h), Image.LANCZOS) for f in cut_frames]

        # 4) Find the best loop point for a seamless walk cycle (frame most similar to frame 0).
        def diff(a: Image.Image, b: Image.Image) -> float:
            return sum(ImageStat.Stat(ImageChops.difference(a.convert("RGB"), b.convert("RGB"))).mean)

        search_from = max(8, int(len(frames) * 0.4))
        search_to = int(len(frames) * 0.8)
        loop_end = min(range(search_from, search_to), key=lambda i: diff(frames[0], frames[i]))

        # 5) Sprite sheet.
        cols = args.cols
        rows = (len(frames) + cols - 1) // cols
        sheet = Image.new("RGBA", (cols * args.frame_w, rows * args.frame_h), (0, 0, 0, 0))
        for i, frame in enumerate(frames):
            sheet.paste(frame, ((i % cols) * args.frame_w, (i // cols) * args.frame_h))
        sheet.save(OUT_CHAR / "walk-sprite.webp", "WEBP", quality=82, method=6)

        meta = {
            "image": "/assets/character/walk-sprite.webp",
            "frameWidth": args.frame_w,
            "frameHeight": args.frame_h,
            "cols": cols,
            "rows": rows,
            "frameCount": len(frames),
            "fps": args.fps,
            "walkLoop": [0, loop_end],
            "idleFrame": len(frames) - 1,
        }
        (OUT_CHAR / "walk-sprite.json").write_text(json.dumps(meta, indent=2) + "\n")

        # 6) Transparent VP9 WebM (Chrome/Edge/Firefox). Safari falls back to the sprite sheet.
        (tmp / "alpha").mkdir()
        for i, frame in enumerate(cut_frames):
            frame.crop(crop_box).resize((args.frame_w * 2, args.frame_h * 2), Image.LANCZOS).save(tmp / "alpha" / f"a_{i:04d}.png")
        run([ff, "-hide_banner", "-loglevel", "error", "-y", "-framerate", str(args.fps),
             "-i", str(tmp / "alpha" / "a_%04d.png"), "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
             "-b:v", "0", "-crf", "34", "-auto-alt-ref", "0", str(OUT_CHAR / "walk-alpha.webm")])

    print(json.dumps(meta, indent=2))
    print("Character assets written to", OUT_CHAR)


if __name__ == "__main__":
    main()
