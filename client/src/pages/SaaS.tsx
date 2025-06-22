import React from "react";

// 🔹 Static explainer sections
import SaasHeroSection from "@/components/saas/SaasHeroSection";
import DataManagerUI from "@/components/saas/DataManagerUI";
import IndustriesSection from "@/components/saas/IndustriesSection";
import KPISection from "@/components/saas/KPISection";
import CTASection from "@/components/saas/CTASection";

const SaasPage: React.FC = () => {
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
};

export default SaasPage;
