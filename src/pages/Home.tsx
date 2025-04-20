// src/routes/Home.tsx
import HeroSection from "../components/home/HeroSection";
import AboutSection from "@/components/home/AboutSection";
import ProblemSolutionSection from "@/components/home/ProblemSolutionSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import { FAQSection } from "@/components/home/faq";
import { CTASection } from "@/components/home/cta";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ProblemSolutionSection />
      <FeaturesSection/>
      <FAQSection/>
      <CTASection/>
    </main>
  );
}