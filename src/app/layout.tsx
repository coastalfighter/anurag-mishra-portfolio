import type { Metadata, Viewport } from "next";
import { Abel, Chivo } from "next/font/google";
import type { ReactNode } from "react";
import { AGENCIES, PERSON } from "@/lib/sectionData";
import { SITE } from "@/lib/site";
import "./globals.css";

const chivo = Chivo({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-chivo",
  display: "swap",
});

const abel = Abel({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-abel",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s — ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: "Anurag Mishra", url: SITE.url }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1280, height: 720, alt: "Anurag Mishra walking toward the camera" }],
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description, images: [SITE.ogImage] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Anurag Mishra",
  url: SITE.url,
  email: `mailto:${PERSON.email}`,
  jobTitle: PERSON.currentRole,
  worksFor: { "@type": "Organization", name: AGENCIES[0]?.agency },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Miami Ad School, Hamburg" },
    { "@type": "CollegeOrUniversity", name: "Amity University, New Delhi" },
  ],
  address: { "@type": "PostalAddress", addressLocality: "New Delhi", addressCountry: "IN" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${chivo.variable} ${abel.variable}`} suppressHydrationWarning>
      <body>
        <noscript>
          <style>{"[data-noscript-show]{transform:none!important;opacity:1!important}"}</style>
        </noscript>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          // JSON.stringify output is safe here: static, first-party data only.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
