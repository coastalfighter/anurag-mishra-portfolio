/**
 * All website content, transcribed verbatim from aanuragmishra.com
 * (home/work index, /about, /resume and every case-study page).
 *
 * Nothing here is rewritten — the only additions are structural labels used by
 * the new layout (section eyebrows such as "01 — About"), which are UI chrome
 * rather than copy.
 */

export type SectionId = "hero" | "about" | "highlights" | "work" | "experience" | "awards" | "contact";

export interface SectionMeta {
  id: SectionId;
  /** Short label used by the navbar / side indicator. */
  label: string;
  /** Index shown in the eyebrow ("01"). */
  index: string;
}

export const SECTIONS: readonly SectionMeta[] = [
  { id: "hero", label: "Intro", index: "00" },
  { id: "about", label: "About", index: "01" },
  { id: "highlights", label: "Highlights", index: "02" },
  { id: "work", label: "Work", index: "03" },
  { id: "experience", label: "Resume", index: "04" },
  { id: "awards", label: "Awards", index: "05" },
  { id: "contact", label: "Contact", index: "06" },
] as const;

/** Primary navigation mirrors the live site (WORK · ABOUT · RESUME) plus Contact. */
export const NAV_ITEMS: readonly { id: SectionId; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "experience", label: "Resume" },
  { id: "contact", label: "Contact" },
] as const;

/* ───────────────────────────── Identity ───────────────────────────── */

export const PERSON = {
  name: "ANURAG MISHRA",
  firstName: "Anurag",
  greeting: "Hi, I’m Anurag.",
  currentRole: "Senior Creative Director",
  currentAgency: "CRAYONS, New Delhi",
  email: "anuragmishra101@gmail.com",
  phone: "+91 8743917717",
  phoneHref: "tel:+918743917717",
  birthday: "Birthday: December 8th, 1988, Born in Kanpur U.P, India",
  location: "Currently based in New Delhi.",
  portrait: "/assets/images/anurag.webp",
} as const;

/* ───────────────────────────── About ───────────────────────────── */

export const ABOUT = {
  heading: "Hi, I’m Anurag.",
  paragraphs: [
    "I’m a versatile brand builder with a keen ability to uncover deep consumer insights and transform them into compelling brand narratives. With over 11 years of experience in marketing and advertising, I bring a strategic mindset and proven leadership that consistently drive impactful results. Throughout my career, I’ve led high-profile campaigns and managed cross-functional teams to achieve ambitious business objectives. As a marketing and consulting professional, I’m excited to leverage my background in strategic campaign management and market analysis to deliver actionable insights and innovative solutions.",
    "Born and raised in India, I graduated as a Creative from Miami Ad School, Europe, and went on to gain international experience in Copenhagen, Prague, Hamburg, and Dubai. This journey shaped my global outlook on creativity.",
    "I’m passionate about technology and inspired by big ideas. I’ve always sought to bring these two forces together to make a positive impact—bridging the gap between what’s possible and what seems impossible. This drive has led me to create the world’s first “selling” hashtag, a Facebook profile that warns against fentanyl, a selfie tool that detects cataracts, a pollution-reducing discount system, and more.",
    "My willingness to push boundaries makes me disruptive in everything I do. Transitioning from global network agencies to a national agency allowed me to work closely with management and play a key role in driving growth. Over the past seven years, I’ve won more than 110 awards at various international festivals, a testament to my commitment to innovation and excellence.",
  ],
} as const;

/* ───────────────────────────── Highlights (About page facts) ───────────────────────────── */

export type HighlightIcon = "calendar" | "globe" | "lion" | "hashtag" | "handshake" | "chess";

export interface Highlight {
  /** Decorative icon used by the 2D card and the 3D pillar glyph. */
  icon: HighlightIcon;
  /** Full original sentence. */
  text: string;
}

export const HIGHLIGHTS: readonly Highlight[] = [
  { icon: "calendar", text: "11 years of experience" },
  {
    icon: "globe",
    text: "3 different countries (Germany, UAE and India) and two different continents : Asia and Europe",
  },
  { icon: "lion", text: "Cannes Future Lion winner" },
  { icon: "hashtag", text: "Created world’s first “Selling Hashtag”" },
  { icon: "handshake", text: "Idea bought by John Fawcett Foundation, Indonesia" },
  { icon: "chess", text: "2 Passions ( Chess and Family )" },
] as const;

/* ───────────────────────────── Resume: experience & education ───────────────────────────── */

export interface Role {
  agency: string;
  period: string;
  title: string;
}

export const AGENCIES: readonly Role[] = [
  { agency: "CRAYONS, New Delhi", period: "2022 to Present", title: "Senior Creative Director" },
  { agency: "OGILVY, Mumbai", period: "2021 to 2022", title: "Associate Creative Director" },
  { agency: "MCCANN, New Delhi", period: "2019 to 2020", title: "Creative Team Leader" },
  { agency: "INNOCEAN, New Delhi", period: "2018 to 2019", title: "Creative Group Head" },
  { agency: "SERVICEPLAN, Dubai / Hamburg", period: "2017 to 2018", title: "Copywriter" },
  { agency: "JUNG VON MATT, Hamburg", period: "2016 to 2016", title: "Class Intern" },
  { agency: "KOLLE REBBE", period: "2016- 2016-", title: "Class Intern" },
  { agency: "360 Degrees, New Delhi", period: "2012 to 2015", title: "Copywriter" },
  { agency: "MCCANN, New Delhi", period: "2011 to 2011", title: "Creative Intern" },
  { agency: "OGILVY, Mumbai", period: "2010 to 2010", title: "Creative Intern" },
] as const;

export interface Education {
  school: string;
  programme: string;
  period: string;
}

export const EDUCATION: readonly Education[] = [
  { school: "MIAMI AD SCHOOL, Hamburg", programme: "Copywriting Program / Digital", period: "2016- 2018" },
  {
    school: "AMITY UNIVERSITY, New Delhi",
    programme: "Bachelor of Journalism and Mass Communication",
    period: "2007-2010",
  },
] as const;

/* ───────────────────────────── Resume: awards & press ───────────────────────────── */

export interface AwardGroup {
  show: string;
  entries: readonly string[];
}

export const AWARDS: readonly AwardGroup[] = [
  { show: "CANNES FUTURE LION", entries: ["SHUTTERSTOCK - A SELLING HASHTAG (Shortlist)"] },
  { show: "CLIO", entries: ["SHUTTERSTOCK- A SELLING HASHTAG (SILVER)"] },
  { show: "ADC GLOBAL", entries: ["MERCEDES BENZ (SHORTLIST)", "SHUTTERSTOCK- A SELLING HASHTAG (SHORTLIST)"] },
  { show: "ADC GERMANY", entries: ["A SELLING HASHTAG (BRONZE)", "MERCEDES- BENZ (SILVER)"] },
  {
    show: "YOUNG GLORY",
    entries: ["A SELLING HASH TAG (SILVER)", "FRIEND REQUEST: FENTANYL (SILVER)", "RANKED TOP TEN GLOBALY"],
  },
  {
    show: "GRAPHIS NEW TALENT AWARDS",
    entries: [
      "NIKE (PLATINUM)",
      "NIKE (BEST OF SHOW)",
      "NIKE (2016 OCTOBER EDITION MAGZINE COVER)",
      "LEGO (SILVER)",
      "MERCEDES BENZ (SILVER)",
      "ASOS (GOLD)",
      "AMNESTY INTERNATIONAL (MERIT)",
      "FRIEND REQUEST: FENTANYL (SILVER)",
      "BMW CONNECTED (MERIT)",
    ],
  },
  {
    show: "CREATIVITY INTERNATIONAL",
    entries: [
      "MERCEDES BENZ (BRONZE)",
      "MERCEDES- BENZ (MEDIA BRONZE)",
      "A SELLING HASHTAG (GOLD)",
      "ASOS (SILVER)",
      "LISTERINE (SILVER)",
    ],
  },
  { show: "APPLIED ARTS AWARDS", entries: ["MERCEDES BENZ  (GOLD)", "A SELLING HASHTAG  (SHORTLIST)"] },
  { show: "LEGENDS IN ADVERTISING AWARDS", entries: ["LISTERINE (BRONZE)"] },
  { show: "CAPLES SCOTY AWARD", entries: ["MERCEDES BENZ CAMPAIGN OF THE YEAR (FINALIST)"] },
  {
    show: "MIAMI AD SCHOOL AWARDS",
    entries: ["RAGENBOGEN (TOP DOG)", "MERCEDES- BENZ (TOP DOG)", "ASOS (TOP DOG)"],
  },
] as const;

export const PUBLICATIONS: readonly string[] = [
  "ADS OF THE WORLD",
  "CREATIVITY INTERNATIONAL",
  "GRAPHIS",
  "CREATIVITY ONLINE",
] as const;

/* ───────────────────────────── Work / case studies ───────────────────────────── */

export type MediaEmbed =
  | { kind: "vimeo"; id: string; hash?: string; title: string }
  | { kind: "youtube"; id: string; title: string };

export type ContentBlock =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "label"; label: string; text: string };

export interface Credit {
  role: string;
  name: string;
}

export interface CaseStudy {
  slug: string;
  /** Title exactly as shown on the home-page grid. */
  gridTitle: string;
  /** Title exactly as shown on the case-study page. */
  title: string;
  /** Discipline line under the title (where the original has one). */
  discipline?: string;
  credits: readonly Credit[];
  body: readonly ContentBlock[];
  myRole?: string;
  result?: string;
  awards?: string;
  publications?: string;
  publicationsLabel?: string;
  media: readonly MediaEmbed[];
  gallery: readonly { src: string; width: number; height: number }[];
  thumb: { src: string; animated?: string; width: number; height: number };
}

const img = (slug: string, file: string) => `/assets/images/work/${slug}/${file}`;

export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    slug: "cadbury",
    gridTitle: "CADBURY- CHOCOBAKES CAKE",
    title: "CADBURY",
    discipline: "FMCG · B2C · BRAND LAUNCH · INTEGRATED CAMPAIGN",
    credits: [
      { role: "AGENCY", name: "Ogilvy, Mumbai" },
      { role: "CCO’s", name: "Kainaz Karmarkar, Harshad Rajadhyaksha, Sukesh Nayak" },
      { role: "GR. CREATIVE DIRECTOR", name: "Akshay Seth" },
      { role: "SR. CREATIVE DIRECTOR", name: "Chinmay Raut" },
      { role: "ACD", name: "Anurag Mishra" },
      { role: "COPY SUPERVISOR", name: "Nikhil Choudhary" },
      { role: "DIRECTOR", name: "Harshik Suraiya" },
      { role: "DOP", name: "Shivendu Kudalkar" },
    ],
    body: [
      {
        kind: "p",
        text: "Cadbury was launching Chocobakes Cakes and Cookies, built around a simple product truth: Cadbury was hidden inside.",
      },
      {
        kind: "p",
        text: "We turned that truth into a campaign journey - building intrigue, revealing the product, making its core proposition memorable, and then extending the idea through tactical, search-led digital and social.",
      },
      { kind: "h", text: "PHASE 1: BUILDING INTRIGUE" },
      { kind: "p", text: "#KahanGayiCadbury · Little Siblings" },
      {
        kind: "p",
        text: "Cadbury disappeared from familiar brand touchpoints like packaging, hoardings, social media and even from the file of celebrities. The launch film revealed where it had gone, inside Chocobakes Cakes and Cookies.",
      },
      { kind: "h", text: "PHASE 2: MAKING THE PRODUCT TRUTH UNMISSABLE" },
      { kind: "p", text: "MEETHA CHHUPA RUSTOM" },
      {
        kind: "p",
        text: "We took the product proposition into a 360° campaign across television, digital and social, making the hidden Cadbury proposition central to the communication. Cadbury was the sweet secret hidden inside.",
      },
      {
        kind: "label",
        label: "INTEGRATED MARKETING COMMUNICATION COHORTS",
        text: "We used YouTube search behaviour to reach people already looking for relevant food and dessert moments. Campaign extension 10 seconders targeted the consumers based on their activity on digital platforms like youtube, Facebook, Instagram and more.",
      },
      { kind: "label", label: "DIGITAL", text: "We extended the hidden Cadbury idea into Digital through the Cookie Eclipse." },
      { kind: "label", label: "SOCIAL MEDIA EXTENSION OF THE CAMPAIGN", text: "Instagram and Facebook." },
    ],
    result: "Result: 47% sales growth, Ranked #4th in market share within first two months of the launch",
    myRole: "Brand Strategy · Consumer Insight · Campaign Strategy · Creative Direction · Integrated Marketing",
    media: [
      { kind: "vimeo", id: "1220937083", title: "Cadbury Chocobakes — launch film" },
      { kind: "vimeo", id: "604031418", hash: "1511f05869", title: "KID .mp4" },
      { kind: "vimeo", id: "796374671", hash: "c6b1dc69cd", title: "COUPLE FILM 20 SEC 16-9" },
      { kind: "vimeo", id: "605646499", hash: "9a4eff1a70", title: "Cooking : Round Chapati10_SEC.mp4" },
      { kind: "vimeo", id: "605684688", hash: "8dbb64e5d2", title: "Hobbies.mp4" },
      { kind: "vimeo", id: "605681325", hash: "1ff9dbc15b", title: "Education.mp4" },
      { kind: "vimeo", id: "605681754", hash: "92710cffaf", title: "Gaming.mp4" },
      { kind: "vimeo", id: "605681612", hash: "426c2e76c0", title: "Family Focused .mp4" },
      { kind: "vimeo", id: "796394532", hash: "66cb439b67", title: "Cookie-Clipse _ Cadbury ChocoBakes Cookies" },
      { kind: "vimeo", id: "796384664", hash: "9b7afc385e", title: "Children’s Day" },
      { kind: "vimeo", id: "796384087", hash: "3c695037b4", title: "Father's Day!" },
      { kind: "vimeo", id: "796383899", hash: "f11bdd0770", title: "Monsoon" },
      { kind: "vimeo", id: "796384308", hash: "35dcd30a51", title: "Mother’s Day" },
      { kind: "vimeo", id: "796384470", hash: "702949bc53", title: "Colours, cheer and Cadbury!" },
      { kind: "vimeo", id: "796385076", hash: "86c577e5ec", title: "Monsoon" },
    ],
    gallery: [
      { src: img("cadbury", "01.webp"), width: 277, height: 531 },
      { src: img("cadbury", "02.webp"), width: 300, height: 528 },
      { src: img("cadbury", "03.webp"), width: 278, height: 529 },
      { src: img("cadbury", "04.webp"), width: 305, height: 524 },
    ],
    thumb: { src: img("cadbury", "thumb.webp"), width: 960, height: 540 },
  },
  {
    slug: "croma",
    gridTitle: "CROMA",
    title: "CROMA",
    discipline: "OOH INTERACTIVE CAMPAIGN",
    credits: [
      { role: "AGENCY", name: "Crayons Advertising" },
      { role: "SR. CREATIVE DIRECTOR", name: "Anurag Mishra" },
      { role: "CREATIVE DIRECTOR", name: "Madhav Sharma" },
      { role: "ART DIRECTOR", name: "Ajay Singh" },
      { role: "EDITOR", name: "Vishal Moray" },
      { role: "DIRECTOR", name: "Harshik Suraiya" },
      { role: "DOP", name: "Shivendu Kudalkar" },
    ],
    body: [
      {
        kind: "p",
        text: "CROMA has always been a technology-focused brand, offering the best-in-class consumer electronics and durable goods. From headphones to smartwatches, microwaves to washing machines—you name it, they have it, and with a commitment to technological superiority. To position itself as the go-to destination for consumers who seek the latest in technology, CROMA went bold with a unique Interactive OOH Campaign.",
      },
    ],
    media: [{ kind: "vimeo", id: "1026298254", title: "Croma Metro Wrap" }],
    gallery: [],
    thumb: { src: img("croma", "thumb.webp"), width: 960, height: 540 },
  },
  {
    slug: "shutterstock-a-selling-hashtag",
    gridTitle: "SHUTTERSTOCK- A Selling Hashtag",
    title: "SHUTTERSTOCK- A SELLING HASHTAG",
    credits: [
      { role: "Agency", name: "Serviceplan Dubai and Miami Ad School, Hamburg" },
      { role: "CW", name: "Anurag Mishra" },
      { role: "AD", name: "Federico Rusconi and Christiano" },
      {
        role: "Instructors",
        name: "Niklas Frings-Rupp, Miami Ad School, Hamburg; Mark T Smith, Miami Ad School, US; Moe, ECD, Serviceplan- Dubai",
      },
    ],
    body: [
      {
        kind: "p",
        text: "An image is worth a thousand words, and no one understands the power of imagery better than Shutterstock. Harnessing this power, we introduced a groundbreaking concept—a hashtag that could be bought and sold each time it was used on social media. Presenting the world’s first Selling Hashtag.",
      },
    ],
    myRole: "I was responsible for developing the concept and driving the campaign forward.",
    awards:
      "Cannes Future Lion- Silver; ADC Germany- Gold; Young Glory- Silver; ADC Global- Bronze; Graphis New Talent Awards- Gold; Creativity International- Gold; Applied Arts- Shortlist",
    media: [{ kind: "vimeo", id: "796411429", hash: "18e4b96601", title: "A Selling Hashtag" }],
    gallery: [],
    thumb: { src: img("shutterstock-a-selling-hashtag", "thumb.webp"), width: 960, height: 540 },
  },
  {
    slug: "zomato",
    gridTitle: "ZOMATO",
    title: "ZOMATO - ON TIME OR FREE (OTOF)",
    discipline: "INTEGRATED CAMPAIGN",
    credits: [
      { role: "AGENCY", name: "MCCANN, Delhi" },
      { role: "NCD", name: "Ashish Chakravarty" },
      { role: "ECD", name: "Abhishek Chaswal" },
      { role: "SR. CREATIVE DIRECTOR", name: "Priyank Narain" },
      { role: "CREATIVE TEAM LEADER", name: "Anurag Mishra" },
      { role: "PRODUCTION HOUSE", name: "Purple Vishnu Films" },
    ],
    body: [
      {
        kind: "p",
        text: "Zomato has consistently fulfilled its promise of delivering mouthwatering dishes to customers anytime, anywhere. Now, this Indian multinational restaurant aggregator and food delivery company is raising the bar with a new commitment: delivering food “On Time or Free.”",
      },
      { kind: "h", text: "MAINLINE AND DIGITAL CAMPAIGN" },
      { kind: "h", text: "SOCIAL BRAND BUILDING" },
    ],
    media: [{ kind: "vimeo", id: "796406590", hash: "211a43b378", title: "Zomato OTOF - North TVC" }],
    gallery: [
      { src: img("zomato", "01.webp"), width: 1600, height: 11532 },
      { src: img("zomato", "02.webp"), width: 639, height: 638 },
      { src: img("zomato", "03.webp"), width: 515, height: 641 },
      { src: img("zomato", "04.webp"), width: 646, height: 643 },
      { src: img("zomato", "05.webp"), width: 638, height: 638 },
    ],
    thumb: { src: img("zomato", "thumb.webp"), width: 960, height: 540 },
  },
  {
    slug: "hyundai-brilliant-moments",
    gridTitle: "HYUNDAI- Brilliant Moments Campaign",
    title: "HYUNDAI- BRILLIANT MOMENTS",
    discipline: "INTEGRATED CAMPAIGN",
    credits: [
      { role: "AGENCY", name: "Innocean Worldwide, New Delhi" },
      { role: "CCO", name: "Jeremy Craigen" },
      { role: "ECD", name: "Talha Nazim" },
      { role: "CD", name: "Rajesh Sinha" },
      { role: "CW", name: "Anurag Mishra" },
      { role: "AD", name: "Amit Sharma" },
      { role: "DIRECTOR", name: "Ruchi Narayan" },
    ],
    myRole: "I was responsible for finding the initial breakthrough in the idea and scripting the campaigns.",
    body: [
      {
        kind: "p",
        text: "Featured on more than 50 media outlets like exchange4media, Business Standard, BusinessWireIndia, Business Chronicle, Adweek, Financial Express and more.",
      },
      { kind: "p", text: "Also named the most viewed campaign on YouTube." },
      {
        kind: "label",
        label: "BACKGROUND",
        text: "In 2017, Hyundai Motors celebrated 20 successful years in the Indian market—a significant milestone for a Korean brand and a testament to its leadership in the industry. The objective was to commemorate this achievement and reintroduce the iconic Hyundai Santro.",
      },
      {
        kind: "label",
        label: "Idea",
        text: "India is a land of diverse cultures and beliefs, yet we sought a single unifying element—and we found it in Hyundai. Over the past two decades, Hyundai’s progressive vision has touched the lives of millions, creating cherished memories along the way. To honor this journey, we invited people to share their fondest Hyundai moments, offering them a chance to relive these memories as we adapted the best stories into digital ad films. This initiative was our way of thanking customers for making Hyundai a part of their lives.",
      },
      { kind: "p", text: "Presenting Hyundai Brilliant Moments." },
    ],
    media: [
      { kind: "youtube", id: "pykGg5iepOQ", title: "Hyundai Brilliant Moments — film 1" },
      { kind: "youtube", id: "RDXLDCiVZUU", title: "Hyundai Brilliant Moments — film 2" },
      { kind: "youtube", id: "u6w6iujiMZI", title: "Hyundai Brilliant Moments — film 3" },
    ],
    gallery: [{ src: img("hyundai-brilliant-moments", "01.webp"), width: 1189, height: 1600 }],
    thumb: {
      src: img("hyundai-brilliant-moments", "thumb.webp"),
      animated: img("hyundai-brilliant-moments", "thumb-anim.webp"),
      width: 360,
      height: 202,
    },
  },
  {
    slug: "mercedes-benz",
    gridTitle: "MERCEDES-BENZ- The Third Eye",
    title: "MERCEDES-BENZ- THE THIRD EYE",
    credits: [
      { role: "AGENCY", name: "Miami Ad School, Hamburg" },
      { role: "CW", name: "Anurag Mishra" },
      { role: "AD", name: "Barbera Vera" },
      { role: "INSTRUCTORS", name: "Niklas Frings- Rupp, Miami Ad School, Hamburg; Mark T Smith, Miami Ad school, US;" },
    ],
    awards:
      "ADC- Shortlist, ADC Germany- Silver; Creativity International- Bronze and Media Bronze; Graphis New Talent Award- Silver; Applied Art Award- Gold, Caples Scoty Award-Campaign of the Year Finalist",
    body: [
      {
        kind: "p",
        text: "Mercedes-Benz provides its buyers with best-in-class technology. But when it comes to safety, their features go beyond expectations—they’re straight out of a Bond movie. To highlight their groundbreaking infrared safety feature, we created an analogy inspired by the world of Bond.",
      },
      { kind: "p", text: "Presenting The Third Eye." },
    ],
    publicationsLabel: "PUBLICATIONS",
    publications: "Creativity International, Creativity Online, Weloved.com, Ads of the world",
    media: [],
    gallery: [
      { src: img("mercedes-benz", "01.webp"), width: 1600, height: 1078 },
      { src: img("mercedes-benz", "02.webp"), width: 1600, height: 1078 },
      { src: img("mercedes-benz", "03.webp"), width: 1600, height: 1078 },
    ],
    thumb: { src: img("mercedes-benz", "thumb.webp"), width: 960, height: 647 },
  },
  {
    slug: "paytm-pollution-tax",
    gridTitle: "PAYTM - Pollution Tax",
    title: "PAYTM- POLLUTION TAX",
    credits: [
      { role: "AGENCY", name: "Mccann, New Delhi" },
      { role: "CCO", name: "Prasoon Joshi" },
      { role: "SCD", name: "Priyank Narain" },
      { role: "Creative Team Leader", name: "Anurag Mishra" },
      { role: "AD", name: "Megha Jain" },
    ],
    body: [
      {
        kind: "p",
        text: "Pollution is often overlooked, and its impact goes unseen. To bring attention to pollution and its effects on society, we found a way to put a price on the very air we breathe.",
      },
      {
        kind: "p",
        text: "Introducing Paytm - Pollution Tax—a payment system designed to reward or penalize individuals based on the level of pollution they produce.",
      },
    ],
    media: [],
    gallery: [{ src: img("paytm-pollution-tax", "01.webp"), width: 1600, height: 1132 }],
    thumb: { src: img("paytm-pollution-tax", "thumb.webp"), width: 960, height: 679 },
  },
  {
    slug: "kia-motors-two-little-feet",
    gridTitle: "KIA Motors- TWO LITTLE FEET",
    title: "KIA Motors- TWO LITTLE FEET",
    discipline: "BRAND FILM",
    credits: [
      { role: "AGENCY", name: "Innocean Worldwide, New Delhi" },
      { role: "CCO", name: "Jeremy Craigen" },
      { role: "ECD", name: "Talha Nazim" },
      { role: "CD", name: "Rajesh Sinha" },
      { role: "CW", name: "Anurag Mishra" },
      { role: "AD", name: "Amit Sharma" },
      { role: "Production House", name: "Good Morning Films" },
    ],
    body: [
      {
        kind: "p",
        text: "Kia Motors sought to make a powerful entrance into the Indian market, creating a memorable first impression. To achieve this, Kia partnered with FIFA in 2018, becoming India’s first ‘Official Match Ball Carrier.’",
      },
      {
        kind: "p",
        text: "This led to Two Little Feet—a brand film that takes viewers on a thrilling journey through the highs and lows of Indian football. By tapping into the excitement surrounding the 2018 FIFA World Cup, Kia aimed to establish a strong foothold in India’s automobile market.",
      },
    ],
    media: [{ kind: "vimeo", id: "1027267397", title: "Kia Motors presents Two Little Feet (720p)" }],
    gallery: [],
    thumb: { src: img("kia-motors-two-little-feet", "thumb.webp"), width: 960, height: 540 },
  },
  {
    slug: "asos-wardrobe",
    gridTitle: "ASOS- WARDROBE",
    title: "ASOS - WARDROBE",
    credits: [
      { role: "AGENCY", name: "Miami Ad School, Hamburg" },
      { role: "CW", name: "Anurag Mishra" },
      { role: "AD", name: "Chris Hanzel, Megha Jain, Barbara Vera" },
      { role: "INSTRUCTORS", name: "Niklas Frings- Rupp, Director, Miami Ad School, Hamburg; Mark T Smith, Miami Ad School, Hamburg;" },
    ],
    awards: "Graphis New Talent- Gold; Miami Ad School- Top Dog",
    body: [
      {
        kind: "p",
        text: "We often spend hours, even days, searching for a dress similar to one we’ve seen on a colleague, a neighbor, or even a stranger on the street. While admiring someone else’s fashion sense is common, the desire to own something similar can be overwhelming. That’s where ASOS steps in.",
      },
      { kind: "p", text: "Introducing ASOS Wardrobe." },
    ],
    publicationsLabel: "PUBLISHED AT",
    publications: "Ads of the world, Creativity International, Creativity International, Weloved.com, Creativity Online",
    media: [{ kind: "vimeo", id: "185334828", title: "Wardrobe" }],
    gallery: [],
    thumb: {
      src: img("asos-wardrobe", "thumb.webp"),
      animated: img("asos-wardrobe", "thumb-anim.webp"),
      width: 360,
      height: 202,
    },
  },
  {
    slug: "listerine-ask-yourself-why",
    gridTitle: "LISTERINE- Why?",
    title: "LISTERINE- WHY?",
    credits: [
      { role: "AGENCY", name: "360 Degrees, New Delhi, Miami Ad School, Hamburg / Miami" },
      { role: "CW", name: "Anurag Mishra, Smriti Tandon" },
      { role: "AD", name: "Vignesh Sershadri" },
      {
        role: "INSTRUCTOR",
        name: "Niklas Frings- Rupp, Director, Miami Ad School, Hamburg; Mark T Smith, Miami Ad School, Miami; Amal Sethi- CCO, 360 Degrees, New Delhi",
      },
    ],
    body: [
      {
        kind: "p",
        text: "Bad breath is an embarrassing issue brought to light by these print ads. They pose questions that individuals struggling with bad breath often fail to confront themselves.",
      },
    ],
    awards: "Creativity international- Silver, Legends in Advertising",
    publicationsLabel: "Publication",
    publications: "Ads of the World, Weloved.com, Creativity international",
    media: [],
    gallery: [
      { src: img("listerine-ask-yourself-why", "01.webp"), width: 1600, height: 2263 },
      { src: img("listerine-ask-yourself-why", "02.webp"), width: 1600, height: 2263 },
      { src: img("listerine-ask-yourself-why", "03.webp"), width: 1600, height: 2263 },
    ],
    thumb: { src: img("listerine-ask-yourself-why", "thumb.webp"), width: 960, height: 1358 },
  },
  {
    slug: "hyundai-introducing-the-clutch",
    gridTitle: "HYUNDAI- Introducing The Clutch",
    title: "HYUNDAI- INTRODUCING THE CLUTCH",
    credits: [
      { role: "AGENCY", name: "Innocean Worldwide, New Delhi" },
      { role: "CCO", name: "Jeremy Craigen" },
      { role: "ECD", name: "Talha Nazim" },
      { role: "CD", name: "Rajesh Sinha" },
      { role: "CREATIVE GROUP HEAD / CW", name: "Anurag Mishra" },
      { role: "SENIOR AD", name: "Amit Sharma" },
    ],
    myRole: "I was responsible for cracking the idea and leading the campaign.",
    body: [
      {
        kind: "p",
        text: "In 2017, Hyundai introduced CVT transmission cars in India. To boost sales, they aimed to show people—especially digitally savvy teenagers—that manual transmission was a thing of the past. The result was a powerful, evocative personification of the clutch, highlighting its obsolescence.",
      },
    ],
    publicationsLabel: "PUBLISHED IN",
    publications: "Lurzer’s Archive",
    media: [],
    gallery: [
      { src: img("hyundai-introducing-the-clutch", "01.webp"), width: 1600, height: 2071 },
      { src: img("hyundai-introducing-the-clutch", "02.webp"), width: 1600, height: 2071 },
      { src: img("hyundai-introducing-the-clutch", "03.webp"), width: 1600, height: 2071 },
    ],
    thumb: { src: img("hyundai-introducing-the-clutch", "thumb.webp"), width: 850, height: 1100 },
  },
  {
    slug: "facebook-friend-request-fentanyl",
    gridTitle: "FACEBOOK- Friend Request Fentanyl",
    title: "FACEBOOK- FRIEND REQUEST FENTANYL",
    credits: [
      { role: "CW", name: "Anurag Mishra" },
      { role: "AD", name: "Barbera Vera, Federico Rusconi" },
      { role: "INSTRUCTORS", name: "Niklas Frings-Rupp, Director Miami Ad School, Hamburg; Mark T Smith, Miami Ad School, Miami" },
    ],
    awards: "GRAPHIS NEW TALENT AWARDS- PLATINUM; Young Glory- Silver",
    body: [
      {
        kind: "p",
        text: "In pop culture, no voice is louder than that of social media. To be heard, you must be present in this space. With this in mind, we sought to raise awareness about the deadliest drug in Canada by creating Friend Request Fentanyl.",
      },
    ],
    publicationsLabel: "PUBLISHED AT",
    publications: "Ads of the world, Weloved.com, Creativity international, Creativity online, Graphis",
    media: [{ kind: "vimeo", id: "195703078", hash: "b38024418a", title: "Friend Request   Fentanyl" }],
    gallery: [],
    thumb: {
      src: img("facebook-friend-request-fentanyl", "thumb.webp"),
      animated: img("facebook-friend-request-fentanyl", "thumb-anim.webp"),
      width: 360,
      height: 202,
    },
  },
  {
    slug: "nike-victory-smile",
    gridTitle: "NIKE- Victory Smile",
    title: "NIKE- VICTORY SMILE",
    credits: [
      { role: "CW", name: "Anurag Mishra" },
      { role: "AD", name: "Chris Hanzel" },
      { role: "INSTRUCTORS", name: "Niklas- Frings- Rupp, Director Miami Ad School, Hamburg; Mark T Smith, Miami Ad School, US;" },
    ],
    awards: "Graphis New Talent Award- Platinum",
    body: [
      {
        kind: "p",
        text: "Victories may take different forms, but the joy of achieving them is universal. While we all understand the feeling, this simple yet powerful print campaign from Nike captures what it looks like in the ideal world of Nike.",
      },
      { kind: "p", text: "Introducing Victory Smile." },
    ],
    publicationsLabel: "PUBLISHED AT",
    publications: "Ads of the world, Weloved.com, Creativity international",
    media: [],
    gallery: [
      { src: img("nike-victory-smile", "01.webp"), width: 960, height: 640 },
      { src: img("nike-victory-smile", "02.webp"), width: 960, height: 640 },
      { src: img("nike-victory-smile", "03.webp"), width: 960, height: 640 },
    ],
    thumb: { src: img("nike-victory-smile", "thumb.webp"), width: 960, height: 640 },
  },
] as const;

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}

/** Neighbouring case studies (wraps around), used for "next project" navigation. */
export function getAdjacentCaseStudies(slug: string): { prev: CaseStudy; next: CaseStudy } | undefined {
  const i = CASE_STUDIES.findIndex((c) => c.slug === slug);
  if (i === -1) return undefined;
  const n = CASE_STUDIES.length;
  return { prev: CASE_STUDIES[(i - 1 + n) % n]!, next: CASE_STUDIES[(i + 1) % n]! };
}

export function embedUrl(media: MediaEmbed): string {
  if (media.kind === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(media.id)}?rel=0`;
  }
  const params = new URLSearchParams({ dnt: "1", title: "0", byline: "0", portrait: "0" });
  if (media.hash) params.set("h", media.hash);
  return `https://player.vimeo.com/video/${encodeURIComponent(media.id)}?${params.toString()}`;
}
