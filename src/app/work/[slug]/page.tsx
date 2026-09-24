import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/sections/Footer";
import { ArrowIcon } from "@/components/ui/Icons";
import { Navbar } from "@/components/ui/Navbar";
import { CASE_STUDIES, embedUrl, getAdjacentCaseStudies, getCaseStudy } from "@/lib/sectionData";

interface Params {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return {};
  const first = study.body.find((b) => b.kind === "p");
  return {
    title: study.title,
    description: first && "text" in first ? first.text.slice(0, 160) : undefined,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: { title: study.title, images: [{ url: study.thumb.src }] },
  };
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) notFound();
  const adjacent = getAdjacentCaseStudies(slug)!;

  return (
    <>
      <Navbar mode="page" />
      <main id="main" className="relative px-4 pb-24 pt-36 sm:px-8 lg:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,0,4,0.16),transparent_65%)]"
        />
        <article className="mx-auto max-w-6xl">
          <Link href="/#work" className="eyebrow mb-8 hover:text-paper">
            All work
          </Link>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.95] sm:text-7xl">{study.title}</h1>
          {study.discipline && <p className="mt-5 text-sm uppercase tracking-[0.3em] text-signal">{study.discipline}</p>}

          <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-6 text-lg leading-relaxed text-paper/85">
              {study.result && <p className="font-display text-2xl font-bold text-paper">{study.result}</p>}
              {study.body.map((block, i) => {
                if (block.kind === "h")
                  return (
                    <h2 key={i} className="pt-6 font-display text-2xl font-black uppercase text-paper">
                      {block.text}
                    </h2>
                  );
                if (block.kind === "label")
                  return (
                    <p key={i}>
                      <strong className="font-display uppercase tracking-wide text-paper">{block.label}</strong>
                      {block.label.endsWith(":") ? " " : ": "}
                      {block.text}
                    </p>
                  );
                return <p key={i}>{block.text}</p>;
              })}
            </div>

            <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
              {study.myRole && (
                <section aria-labelledby="role-heading" className="glass rounded-2xl p-6">
                  <h2 id="role-heading" className="eyebrow mb-3">
                    MY ROLE
                  </h2>
                  <p className="text-paper/85">{study.myRole}</p>
                </section>
              )}
              <section aria-labelledby="credits-heading" className="glass rounded-2xl p-6">
                <h2 id="credits-heading" className="eyebrow mb-4">
                  CREDITS
                </h2>
                <dl className="space-y-3 text-sm">
                  {study.credits.map((c) => (
                    <div key={`${c.role}${c.name}`}>
                      <dt className="uppercase tracking-[0.15em] text-mute">{c.role}</dt>
                      <dd className="text-paper">{c.name}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              {study.awards && (
                <section aria-labelledby="awards-heading" className="glass rounded-2xl p-6">
                  <h2 id="awards-heading" className="eyebrow mb-3">
                    AWARDS
                  </h2>
                  <p className="text-paper/85">{study.awards}</p>
                </section>
              )}
              {study.publications && (
                <section aria-labelledby="pub-heading" className="glass rounded-2xl p-6">
                  <h2 id="pub-heading" className="eyebrow mb-3">
                    {study.publicationsLabel ?? "PUBLISHED AT"}
                  </h2>
                  <p className="text-paper/85">{study.publications}</p>
                </section>
              )}
            </aside>
          </div>

          {study.media.length > 0 && (
            <section aria-label="Films" className="mt-20 grid gap-6 md:grid-cols-2">
              {study.media.map((m, i) => (
                <div key={`${m.kind}${m.id}${i}`} className={`overflow-hidden rounded-2xl bg-charcoal ${i === 0 ? "md:col-span-2" : ""}`}>
                  <div className="relative aspect-video">
                    <iframe
                      src={embedUrl(m)}
                      title={m.title}
                      loading="lazy"
                      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </div>
              ))}
            </section>
          )}

          {study.gallery.length > 0 && (
            <section aria-label="Campaign images" className="mt-16 grid gap-6 sm:grid-cols-2">
              {study.gallery.map((g, i) => (
                <figure
                  key={g.src}
                  className={`overflow-hidden rounded-2xl bg-charcoal ${study.gallery.length === 1 || (g.height > g.width * 3) ? "sm:col-span-2" : ""}`}
                >
                  <Image
                    src={g.src}
                    alt={`${study.title} — image ${i + 1}`}
                    width={g.width}
                    height={g.height}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="h-auto w-full"
                  />
                </figure>
              ))}
            </section>
          )}

          <nav aria-label="More work" className="mt-24 grid gap-4 border-t border-white/10 pt-10 sm:grid-cols-2">
            <Link href={`/work/${adjacent.prev.slug}`} className="group glass rounded-2xl p-6">
              <span className="text-xs uppercase tracking-[0.3em] text-mute">Previous</span>
              <span className="mt-2 flex items-center gap-3 font-display text-xl font-bold uppercase text-paper">
                <ArrowIcon className="h-5 w-5 rotate-180 text-signal transition-transform group-hover:-translate-x-1" />
                {adjacent.prev.gridTitle}
              </span>
            </Link>
            <Link href={`/work/${adjacent.next.slug}`} className="group glass rounded-2xl p-6 text-right">
              <span className="text-xs uppercase tracking-[0.3em] text-mute">Next</span>
              <span className="mt-2 flex items-center justify-end gap-3 font-display text-xl font-bold uppercase text-paper">
                {adjacent.next.gridTitle}
                <ArrowIcon className="h-5 w-5 text-signal transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </nav>
        </article>
      </main>
      <Footer linkPrefix="/" />
    </>
  );
}
