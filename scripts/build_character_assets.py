#!/usr/bin/env python3
"""
Build the web-ready character assets from a single source walking video.

Input : assets-src/character-walk-source.mp4   (opaque video, character centred)
Output: public/assets/character/
          walk-hd-N.webp          HD transparent sprite sheets (desktop 3D scene, native resolution)
          walk-sprite.webp        low-res sprite sheet (tablets, mobile fallback, loader)
          walk-sprite.json        metadata read directly by src/lib/characterConfig.ts
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

For a COMPLETE character the source must be full-body: head to shoes in frame for
the whole clip, with a little floor below the feet. The script warns if the feet
are cropped by the frame edge. A 4K source gives the sharpest result (frames are
kept up to --hd-max-height px tall).
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
    parser.add_argument("--hd-max-height", type=int, default=1024,
                        help="Max HD frame height (px). Source resolution is used if smaller.")
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
        lefts, rights, touching_bottom = [], [], 0
        for frame in cut_frames:
            box = frame.getchannel("A").point(lambda v: 255 if v > 128 else 0).getbbox()
            if box:
                lefts.append(box[0])
                rights.append(box[2])
                if box[3] >= height - 2:
                    touching_bottom += 1
        # If the figure reaches the bottom edge in most frames, the camera cut the feet off.
        cropped_feet = touching_bottom > len(cut_frames) * 0.5
        if cropped_feet:
            print("  ⚠ The character touches the bottom of the frame in "
                  f"{touching_bottom}/{len(cut_frames)} frames — the feet are outside the shot. "
                  "Use a full-body video (head to shoes visible, with some floor) for a complete character.")
        centre = (min(lefts) + max(rights)) // 2
        crop_w = int(height * args.frame_w / args.frame_h)
        x0 = max(0, min(width - crop_w, centre - crop_w // 2))
        crop_box = (x0, 0, x0 + crop_w, height)
        cropped = [f.crop(crop_box) for f in cut_frames]

        # Low-res sheet (all frames): tablets, the 2D mobile fallback and the loader silhouette.
        frames = [f.resize((args.frame_w, args.frame_h), Image.LANCZOS) for f in cropped]

        # 4) Find the best loop point for a seamless walk cycle (frame most similar to frame 0).
        def diff(a: Image.Image, b: Image.Image) -> float:
            return sum(ImageStat.Stat(ImageChops.difference(a.convert("RGB"), b.convert("RGB"))).mean)

        search_from = max(8, int(len(frames) * 0.4))
        search_to = int(len(frames) * 0.8)
        loop_end = min(range(search_from, search_to), key=lambda i: diff(frames[0], frames[i]))
        gesture = [max(loop_end, len(frames) - 12), len(frames) - 1]

        # 5a) Low-res sprite sheet.
        cols = args.cols
        rows = (len(frames) + cols - 1) // cols
        sheet = Image.new("RGBA", (cols * args.frame_w, rows * args.frame_h), (0, 0, 0, 0))
        for i, frame in enumerate(frames):
            sheet.paste(frame, ((i % cols) * args.frame_w, (i // cols) * args.frame_h))
        sheet.save(OUT_CHAR / "walk-sprite.webp", "WEBP", quality=82, method=6)

        # 5b) HD sheets at (up to) native resolution, capped for GPU memory. Only the frames that are
        #     actually shown (walk loop + arrival gesture) are packed, split across ≤4096px sheets.
        hd_h = min(args.hd_max_height, crop_box[3] - crop_box[1])
        hd_w = round(hd_h * args.frame_w / args.frame_h)
        hd_indices = list(range(0, loop_end)) + list(range(gesture[0], gesture[1] + 1))
        hd_frames = []
        for i in hd_indices:
            f = cropped[i].resize((hd_w, hd_h), Image.LANCZOS) if cropped[i].height != hd_h else cropped[i].copy()
            # Gentle unsharp mask on colour only (keeps the alpha edge clean).
            a = f.getchannel("A")
            f = f.convert("RGB").filter(ImageFilter.UnsharpMask(radius=1.2, percent=70, threshold=2)).convert("RGBA")
            f.putalpha(a)
            hd_frames.append(f)
        hd_cols = max(1, 4096 // hd_w)
        hd_rows = max(1, 4096 // hd_h)
        per_sheet = hd_cols * hd_rows
        for old in OUT_CHAR.glob("walk-hd-*.webp"):
            old.unlink()
        hd_sheets = []
        hd_sheet_rows = []
        for s_idx in range(0, len(hd_frames), per_sheet):
            chunk = hd_frames[s_idx:s_idx + per_sheet]
            used_rows = (len(chunk) + hd_cols - 1) // hd_cols
            # Trim to the rows actually used — every pixel costs GPU memory.
            hd_sheet = Image.new("RGBA", (hd_cols * hd_w, used_rows * hd_h), (0, 0, 0, 0))
            for j, frame in enumerate(chunk):
                hd_sheet.paste(frame, ((j % hd_cols) * hd_w, (j // hd_cols) * hd_h))
            name = f"walk-hd-{len(hd_sheets)}.webp"
            hd_sheet.save(OUT_CHAR / name, "WEBP", quality=88, method=6)
            hd_sheets.append(f"/assets/character/{name}")
            hd_sheet_rows.append(used_rows)
            print(f"  HD sheet {name}: {len(chunk)} frames, {used_rows} rows used")

        meta = {
            "image": "/assets/character/walk-sprite.webp",
            "frameWidth": args.frame_w,
            "frameHeight": args.frame_h,
            "cols": cols,
            "rows": rows,
            "frameCount": len(frames),
            "fps": args.fps,
            "walkLoop": [0, loop_end],
            "arrivalGesture": gesture,
            "croppedFeet": cropped_feet,
            "hd": {
                "sheets": hd_sheets,
                "frameWidth": hd_w,
                "frameHeight": hd_h,
                "cols": hd_cols,
                "rows": hd_rows,
                "sheetRows": hd_sheet_rows,
                "frameCount": len(hd_frames),
                # HD frames are re-indexed: walk loop first, then the gesture.
                "walkLoop": [0, loop_end],
                "arrivalGesture": [loop_end, len(hd_frames) - 1],
            },
        }
        (OUT_CHAR / "walk-sprite.json").write_text(json.dumps(meta, indent=2) + "\n")

        # 6) Transparent VP9 WebM (Chrome/Edge/Firefox). Safari falls back to the sprite sheet.
        (tmp / "alpha").mkdir()
        for i, frame in enumerate(cropped):
            frame.resize((hd_w, hd_h), Image.LANCZOS).save(tmp / "alpha" / f"a_{i:04d}.png")
        run([ff, "-hide_banner", "-loglevel", "error", "-y", "-framerate", str(args.fps),
             "-i", str(tmp / "alpha" / "a_%04d.png"), "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
             "-b:v", "0", "-crf", "30", "-auto-alt-ref", "0", str(OUT_CHAR / "walk-alpha.webm")])

    print(json.dumps(meta, indent=2))
    print("Character assets written to", OUT_CHAR)


if __name__ == "__main__":
    main()
