import { useState } from "react";

// 🔹 Static explainer sections
import SaasHeroSection from "@/components/saas/SaasHeroSection";
import DataManagerUI from "@/components/saas/DataManagerUI";
import IndustriesSection from "@/components/saas/IndustriesSection";
import KPISection from "@/components/saas/KPISection";
import CTASection from "@/components/saas/CTASection";


export default function SaasPage() {
  

  return (
    <main>
      {/* === Informational Sections === */}
      <SaasHeroSection />
      <DataManagerUI />
      <IndustriesSection />
      <KPISection />
      <CTASection />
    </main>
  );
}
