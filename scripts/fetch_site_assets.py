#!/usr/bin/env python3
"""
Download and optimise the imagery used on aanuragmishra.com so the rebuilt site
serves everything from its own origin (no hot-linking, predictable CSP).

Output: public/assets/images/**  (WebP, max 1600px wide; thumbnails 960px)

Usage:  python3 scripts/fetch_site_assets.py
Requires: pip install pillow
"""
from __future__ import annotations

import io
import json
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "images"
SQ = "https://images.squarespace-cdn.com/content/v1/5858614cff7c505fa2de1917/"
UA = {"User-Agent": "Mozilla/5.0 (asset-sync; portfolio rebuild)"}


def vimeo_thumb(video_id: str) -> str:
    with urllib.request.urlopen(urllib.request.Request(
        f"https://vimeo.com/api/oembed.json?url=https://vimeo.com/{video_id}", headers=UA), timeout=30) as r:
        url = json.load(r)["thumbnail_url"]
    return re.sub(r"_\d+x\d+", "_1280x720", url)


def yt_thumb(video_id: str) -> str:
    return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"


# Grid thumbnails exactly as on the live home page (videos use their poster frame).
THUMBS: dict[str, str] = {
    "cadbury": yt_thumb("y-8hxKFNCBE"),
    "croma": "vimeo:1026298254",
    "shutterstock-a-selling-hashtag": SQ + "1593801846546-FWZSL8KCPCSCOT0ABI96/HASHTAG+%283%29.jpg",
    "zomato": yt_thumb("5LbgLst2BHU"),
    "hyundai-brilliant-moments": SQ + "1594045586249-G1NDYMUTKPIA4EA8ZMEG/47eq24.gif",
    "mercedes-benz": SQ + "1593799730925-OHX0JL1NI9XWKYYZFVJO/owl+%283%29.jpg",
    "paytm-pollution-tax": SQ + "1631557482115-GXZK7CZL9ZPUWCC5RC2C/POLLUTION%252BTAX-02.jpg",
    "kia-motors-two-little-feet": "vimeo:1027267397",
    "asos-wardrobe": SQ + "1594045210550-GHEL19LNHLC1YHCXLKWA/47epag.gif",
    "listerine-ask-yourself-why": SQ + "1593801770477-8M8T63Q11MJD85PN95CE/listerine.jpg",
    "hyundai-introducing-the-clutch": SQ + "1593800675084-K0LGKBYIAVG54HZC53WJ/HYUNDAI+%281%29.jpg",
    "facebook-friend-request-fentanyl": SQ + "1594044811594-W4ZM8DPL0KFRWKGILRN0/47eonr.gif",
    "nike-victory-smile": SQ + "1593800980724-L0H59U1H1ZIFYXVV493Z/nike++%281%29.jpg",
}

# In-page gallery images for each case study.
GALLERIES: dict[str, list[str]] = {
    "cadbury": [
        SQ + "1675718220392-OV6C4F1CCP3EZ50H0EO5/Screen+Shot+2021-12-09+at+11.43.27+am.png",
        SQ + "1675718246664-353WGORLTXU689CQNY6L/Screen+Shot+2021-12-09+at+11.43.07+am.png",
        SQ + "1675718267574-XODVY05OU9JM881VUGVG/Screen+Shot+2021-12-09+at+11.43.40+am.png",
        SQ + "1675718288022-R0CTY3SUHS7K1MPCA82F/Screen+Shot+2021-12-09+at+11.43.59+am.png",
    ],
    "zomato": [
        SQ + "afc30543-2dca-4582-a479-4d94449ffd46/I+Card+%281%29.jpg",
        SQ + "cec11a6d-a4fa-42c4-ae4c-a23c4df3bd67/Screen+Shot+2023-06-01+at+4.54.24+pm.png",
        SQ + "e13dcb62-9707-4ca7-90c8-0f6f2439030c/Screen+Shot+2023-06-01+at+4.18.18+pm.png",
        SQ + "d56da6b4-4706-46a2-bad2-504e0088fcd3/Screen+Shot+2023-06-01+at+4.17.49+pm.png",
        SQ + "ba4b614a-34bf-4840-a59d-474b73e350a6/Screen+Shot+2023-06-01+at+4.47.55+pm.png",
    ],
    "hyundai-brilliant-moments": [SQ + "1606374509197-87NFGEPBADO7R3TTM589/hyundai_brilliant_moments.jpg"],
    "mercedes-benz": [
        SQ + "1592858672975-59GRP4NI2QGB4PQHM0CG/Batman.jpg",
        SQ + "1592856971352-PRI5168D2ND9TR9H9WUO/owl.jpg",
        SQ + "1592858798923-Q9ZOWRAU17KA35M5S6NA/Telescope.jpg",
    ],
    "paytm-pollution-tax": [SQ + "1631556725716-KME1SUZPUHDSEQUE381U/POLLUTION+TAX-02.jpg"],
    "listerine-ask-yourself-why": [
        SQ + "1593119585875-MAB61AUAYNKGGZ9J5WSE/listerine+CMYK-03.jpg",
        SQ + "1593119677794-ZJQ1CTT6QXOYW7VVA62O/listerine+CMYK-04.jpg",
        SQ + "1593119774902-HDAE38MWY7TXPHSN07DZ/listerine+CMYK-05.jpg",
    ],
    "hyundai-introducing-the-clutch": [
        SQ + "1593115235922-0UK691FMKNQS69242FWK/Print_1.jpg",
        SQ + "1593115326669-00Z0HK7F75YX016T79XV/print_2.jpg",
        SQ + "1593115394022-QRG9TL2H8R22HS2POW6G/print_3.jpg",
    ],
    "nike-victory-smile": [
        SQ + "1592836500137-H4ICJ1P3G4M4DATCLN3S/nike+.jpg",
        SQ + "1592839704999-X4NXJW17H0TPE2KQ653B/nike2+.jpg",
        SQ + "1592839852016-ORKQ7ZKJRNXJF4QRQE39/nike3.jpg",
    ],
}

PORTRAIT = SQ + "c90e48c5-2ecd-4ccb-9750-70c67bb7089c/Anurag.jpg"


def fetch(url: str) -> bytes:
    if url.startswith("vimeo:"):
        url = vimeo_thumb(url.split(":", 1)[1])
    req = urllib.request.Request(url + ("&" if "?" in url else "?") + "format=2500w" if "squarespace" in url else url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def save_webp(data: bytes, dest: Path, max_w: int, animated: bool = False) -> dict[str, int]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    img = Image.open(io.BytesIO(data))
    is_anim = getattr(img, "is_animated", False)
    if is_anim and animated:
        frames, durations = [], []
        for frame in ImageSequence.Iterator(img):
            f = frame.convert("RGB")
            if f.width > max_w:
                f = f.resize((max_w, round(f.height * max_w / f.width)), Image.LANCZOS)
            frames.append(f)
            durations.append(frame.info.get("duration", 80))
        frames[0].save(dest.with_name(dest.stem + "-anim.webp"), "WEBP", save_all=True,
                       append_images=frames[1:], duration=durations, loop=0, quality=70, method=4)
    first = img.convert("RGB")
    if first.width > max_w:
        first = first.resize((max_w, round(first.height * max_w / first.width)), Image.LANCZOS)
    first.save(dest, "WEBP", quality=80, method=6)
    return {"width": first.width, "height": first.height}


def main() -> None:
    manifest: dict[str, object] = {"thumbs": {}, "galleries": {}}
    for slug, url in THUMBS.items():
        dims = save_webp(fetch(url), OUT / "work" / slug / "thumb.webp", 960, animated=True)
        manifest["thumbs"][slug] = dims  # type: ignore[index]
        print("thumb", slug, dims)
    for slug, urls in GALLERIES.items():
        manifest["galleries"][slug] = []  # type: ignore[index]
        for i, url in enumerate(urls, start=1):
            dims = save_webp(fetch(url), OUT / "work" / slug / f"{i:02d}.webp", 1600)
            manifest["galleries"][slug].append(dims)  # type: ignore[index]
            print("gallery", slug, i, dims)
    manifest["portrait"] = save_webp(fetch(PORTRAIT), OUT / "anurag.webp", 1200)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("done")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # surface a readable error for CI / devs
        sys.exit(f"Asset sync failed: {exc}")
