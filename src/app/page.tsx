import { ExperienceShell } from "@/components/layout/ExperienceShell";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Portfolio } from "@/components/sections/Portfolio";
import { Services } from "@/components/sections/Services";
import { Skills } from "@/components/sections/Skills";
import { Testimonials } from "@/components/sections/Testimonials";
import { TransitionSpacer } from "@/components/sections/TransitionSpacer";

/**
 * The journey. Section order = the guide's route through the world:
 *   Hero → (portal) → About → (bridge) → Highlights → (light columns) → Work
 *   → (corridor gate) → Resume → (light tunnel) → Awards → (lanterns) → Contact
 */
export default function Home() {
  return (
    <ExperienceShell footer={<Footer />}>
      <Hero />
      <TransitionSpacer label="Through the portal" />
      <About />
      <TransitionSpacer label="Across the bridge" />
      <Skills />
      <TransitionSpacer label="Into the light" />
      <Portfolio />
      <TransitionSpacer label="Down the corridor" />
      <Services />
      <TransitionSpacer label="Through the tunnel" />
      <Testimonials />
      <TransitionSpacer label="Toward the lanterns" />
      <Contact />
    </ExperienceShell>
  );
}
