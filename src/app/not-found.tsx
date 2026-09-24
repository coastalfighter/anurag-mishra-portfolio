import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-6">404</p>
      <h1 className="font-display text-5xl font-black uppercase sm:text-7xl">This path doesn&apos;t lead anywhere.</h1>
      <Link href="/" className="mt-10 rounded-full bg-signal px-8 py-4 text-sm font-bold uppercase tracking-[0.25em] text-white">
        Back to the start
      </Link>
    </main>
  );
}
