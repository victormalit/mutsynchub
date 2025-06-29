// src/routes/Home.tsx

import React, { useState } from 'react';
import { FaBars } from 'react-icons/fa';

import SolutionsSidebar from "../components/ui/SolutionsSidebar";
import HeroSection from "../components/home/HeroSection";
import AboutSection from "../components/home/AboutSection";
import ProblemSolutionSection from "../components/home/ProblemSolutionSection";
import FeaturesSection from "../components/home/FeaturesSection";
import { FAQSection } from "../components/home/faq";
import { CTASection } from "../components/home/cta";
import { useAuth } from '../hooks/useAuth';
import GlobalLoginReminder from '../components/ui/GlobalLoginReminder';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReminder, setShowReminder] = useState(true);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar trigger icon */}
      <button
        className="fixed top-6 left-6 z-50 p-2 rounded-full bg-white shadow-md text-2xl text-blue-700 hover:bg-blue-100 focus:outline-none md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <FaBars />
      </button>
      {/* Sidebar drawer */}
      <SolutionsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <ProblemSolutionSection />
        <FeaturesSection/>
        <FAQSection/>
        <CTASection/>
      </main>
      {showReminder && !user && (
        <GlobalLoginReminder onClose={() => setShowReminder(false)} />
      )}
    </div>
  );
}