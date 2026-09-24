import { PERSON } from "./sectionData";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aanuragmishra.com").replace(/\/$/, "");

export const SITE = {
  name: "ANURAG MISHRA",
  title: "ANURAG MISHRA",
  description:
    "I’m a versatile brand builder with a keen ability to uncover deep consumer insights and transform them into compelling brand narratives.",
  url: SITE_URL,
  ogImage: "/assets/videos/character-walk-poster.jpg",
  email: PERSON.email,
} as const;
