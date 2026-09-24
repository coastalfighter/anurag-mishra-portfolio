# Anurag Mishra — Immersive 3D Portfolio

A cinematic, scroll-driven rebuild of [aanuragmishra.com](https://www.aanuragmishra.com). A walking guide (Anurag's character) leads the visitor through a continuous 3D world. Each portfolio section is a stop on his route, and set-piece transitions sit between the stops.

**Stack:** Next.js 16 (App Router) · TypeScript · React Three Fiber 9 + Drei 10 · GSAP ScrollTrigger · Lenis · Tailwind CSS 4 · Framer Motion · Zod · Vitest

---

## Quick start

```bash
npm install          # also copies the Draco/KTX2 decoders into /public/decoders
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop / production build / serve |
| `npm test` | Vitest unit + component tests |
| `npm run lint` · `npm run typecheck` | ESLint (next core-web-vitals) · `tsc --noEmit` |
| `npm run assets:character` | Rebuild the character sprite sheet + alpha WebM from a walking video |
| `python3 scripts/fetch_site_assets.py` | Re-sync imagery from the live site into `public/assets/images` |

Requires Node ≥ 20.9. The asset scripts are optional and need Python 3 with `pip install "rembg[cpu]" imageio-ffmpeg pillow`.

---

## The journey

The live site has **Work, About and Resume**. All of its content is kept verbatim in `src/lib/sectionData.ts`. It maps onto the requested 3D scenes like this:

| Stop | Content (from the live site) | 3D scene | Camera |
| --- | --- | --- | --- |
| Hero | Name, current role | Guide walks out of the fog through a monumental gate, backlit by a sunset disc | Low, wide, static |
| *portal* | — | Guide walks through a spinning red portal | Tracking |
| About | "Hi, I'm Anurag." bio + portrait | Guide stops on a spotlit stage and faces you | Close ¾, guide left |
| *bridge* | — | Arched walkway with rail lights | Tracking |
| Highlights *(skills)* | The 6 facts from the About page | Pedestal glyphs ignite one by one as you scroll (with LOD) | Side angle, guide right |
| *light columns* | — | Pulsing columns of light | Tracking |
| Work *(portfolio)* | All 13 campaigns, same order | A rotunda of screens showing each campaign; rotates with scroll | Aerial |
| *corridor gate* | — | Gateway | Tracking |
| Resume *(services corridor)* | Agencies, education, personal details | Gallery corridor with every role framed on the walls | One-point perspective |
| *light tunnel* | — | Rings of light | Tracking |
| Awards *(testimonials / social proof)* | All awards + publications | A crown of award plaques orbits overhead while the press ring counter-rotates | Low, slow orbit |
| *lanterns* | — | Floating lanterns | Tracking |
| Contact | Email, phone, location + form | Guide arrives at a desk before a doorway of light and adjusts his jacket | Guide left, form right |

The live site has no services, skills or testimonials pages. Those scenes carry real content (Resume, Highlights, Awards), so no copy was invented. There are also no social links on the original, so none were added. Every case study has its own page at `/work/[slug]`, with full credits, films (privacy-enhanced Vimeo/YouTube embeds) and gallery. The old Squarespace URLs (`/cadbury`, `/pagep`, `/about`, `/resume`…) 301-redirect to the new routes.

### How scroll drives the world

```
Lenis (smooth scroll) ──► ScrollManager ──► journeyStore  ──► useFrame (no React re-renders)
        ▲                  measures sections    { u, activeSection,     ├─ CharacterPath: guide position, speed, stride
   GSAP ticker             builds scroll→u map   sectionProgress,        ├─ CameraController: per-section rig blending
                           (src/lib/journey.ts)  walking, segment }      └─ Environments: section-progress animation
```

* `src/lib/journey.ts` is pure and unit-tested. Each section has a **hold window**: while the section is centred, the guide stands at its stop. The scroll distance between hold windows, including the `TransitionSpacer`s, is where he walks.
* `src/lib/characterPath.ts` defines the waypoints (a Catmull-Rom curve), the stop for each section and the **camera rig** for each section. Between stops the camera blends rig A → tracking shot → rig B, then everything is damped.
* Nav links, the dot rail and the scroll cue call `lenis.scrollTo`, so the guide *walks* to the chosen section. Focus moves to the section heading for keyboard and screen-reader users.

---

## 🔁 Swapping the character asset

Everything is configured in **`src/lib/characterConfig.ts`** (look for `⬇️ SWAP POINT`). `NEXT_PUBLIC_CHARACTER_MODE` can override the mode without code changes.

| Mode | When to use | What to do |
| --- | --- | --- |
| `sprite` *(default)* | Any walking video; works in every browser | Put the video at `assets-src/character-walk-source.mp4` and run `npm run assets:character`. It removes the background (AI segmentation), finds a seamless loop point, writes `public/assets/character/walk-sprite.webp` + `.json`, and updates the hero video. Copy the printed `walkLoop` into the config if it changed. |
| `video` | You have a transparent **VP9-alpha `.webm`** | Set `video.url` + `aspect`. Safari automatically falls back to the sprite. |
| `gltf` | You have a rigged **`.glb`** with a walk clip | Drop it at `public/assets/models/character.glb` and set `mode: "gltf"`, `walkClip`, `scale`, `yawOffset`. Draco, Meshopt and **KTX2** textures are decoded locally. Add `lods: [{ url, distance }]` for Level of Detail. Tune `secondsPerUnit` to stop foot sliding. |
| `placeholder` | No asset yet | A procedural capsule mannequin that swings its limbs as it walks. |

The walk animation is **driven by distance walked**, not time: the stride advances only while you scroll and freezes when you stop. Any load failure falls back to the mannequin through an error boundary. The asset built from your uploaded meadow video is already in place. The meadow footage itself plays in the hero on phones.

**Compressed textures:** `useWorldTexture()` (`src/lib/textures.ts`) accepts `.ktx2` URLs transparently. Convert with e.g. `toktx --t2 --encode etc1s --genmipmap out.ktx2 in.png` and point the data at the new file.

---

## Rendering tiers, performance and accessibility

`useDeviceDetect` picks one tier. For QA you can force it with `?tier=full|lite|fallback|static`.

| Tier | Who | What renders |
| --- | --- | --- |
| **full** | Desktop, ≥ 4 cores | Full 3D, bloom / grain / vignette / CA, 2 200 particles, pointer parallax |
| **lite** | Tablets, touch laptops, weak hardware | 3D with the guide centred behind content, no post-processing, 900 particles, dpr 1 |
| **fallback** | Phones, no WebGL2, Save-Data | No Three.js. The walking film plays full-bleed in the hero, and a CSS sprite-sheet guide parallaxes alongside each section |
| **static** | `prefers-reduced-motion` | No WebGL, no smooth scroll, no reveal animations; hero shows a still |

* **Performance:** the Scene is code-split (`next/dynamic`, `ssr:false`). Only the guide and hero block the loader, and other environments mount and fetch textures when the guide approaches (`WaypointGroup mountRange`). Distant groups are hidden. `PerformanceMonitor` steps the DPR down and drops post-processing if FPS declines. Particles and light columns use instanced or points geometry, and per-frame code is allocation-free. The glyph LODs use Drei `<Detailed>`.
* **Accessibility:** the canvas is `aria-hidden`, and all information is semantic HTML (one `h1`, section `h2`s, `h3`s). There is a skip link, visible focus rings, a focus-trapped mobile menu with Escape to close, and `aria-current` on nav. Form errors are linked and announced. Content stays visible without JS.
* **Security:** strict CSP and security headers (`next.config.ts`). The contact API has origin checks (CSRF), zod validation, a body-size cap, rate limiting, a honeypot, and plain-text email only (no HTML injection surface).

## Contact form

`POST /api/contact` sends through [Resend](https://resend.com) when `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` are set. Without them it returns `503 EMAIL_NOT_CONFIGURED`, and the form offers to open the visitor's mail client with the message pre-filled. The in-memory rate limiter works per instance. For multi-region deployments, swap in a shared store (e.g. Upstash).

## Project structure

```
assets-src/                     Source walking video (input to the asset pipeline)
public/assets/                  character/ (sprite, alpha webm) · videos/ · images/ (site imagery) · models/ · textures/
scripts/                        build_character_assets.py · fetch_site_assets.py · copy-decoders.mjs
src/app/                        layout · page (the journey) · work/[slug] · api/contact · sitemap · robots · globals.css
src/components/3d/              Scene · Character · CharacterPath · CameraController · guideState
  environments/                 Hero/About/Services/Portfolio/Skills/Testimonials/Contact + Transitions · World · shared
  effects/                      Lighting · Particles · PostProcessing
src/components/sections/        Hero · About · Skills · Portfolio · Services · Testimonials · Contact · Footer · SectionShell · TransitionSpacer · SectionCharacter
src/components/ui/              Navbar · MobileMenu · ScrollProgress · SectionIndicator · LoadingScreen · ContactForm · Icons
src/components/layout/          ExperienceShell · SmoothScroll (Lenis) · ScrollManager (ScrollTrigger) · TierContext
src/hooks/                      useScrollProgress · useDeviceDetect · useReducedMotion · useFontsReady
src/lib/                        sectionData (all content) · characterConfig · characterPath · journey · gsapConfig · textures · canvasLabel · contactSchema · rateLimit
src/store/                      journeyStore · loadStore (tiny external stores shared by DOM + WebGL)
tests/                          Vitest suites
```

Deviations from the requested tree: static assets live in `public/assets/`, not `src/assets/`, because Next.js serves files from `public/`. Global CSS is `src/app/globals.css` only, because Tailwind 4 is configured in CSS. Section files keep the requested names (`Services`, `Skills`, `Testimonials`), but their headers explain which real content each one holds.

## Debugging

Append `?debug` to the URL to expose `window.__journey` (scroll state) and `window.__guide` (guide state). Set `__guide.snapCamera = true` to skip camera damping for deterministic screenshots.
