import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const CTASection: React.FC = () => {
  // Animation variant reused from HeroSection
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 py-16 px-6 text-white">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-0 h-1/3 w-full bg-gradient-to-b from-white/10 to-transparent" />
        <div className="absolute top-16 right-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-16 left-24 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="relative z-10 mx-auto max-w-6xl text-center"
      >
        <motion.div variants={item} className="mb-4">
          <span className="rounded-full bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur-md">
            Start your journey →
          </span>
        </motion.div>

        <motion.h2
          variants={item}
          className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight max-w-4xl mx-auto"
        >
          Ready to <span className="text-blue-300">Transform</span> Your Business?
        </motion.h2>

        <motion.p
          variants={item}
          className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          Join industry leaders who rely on MutSyncHub for intelligent automation, seamless integrations, and powerful insights.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <Button
            size="lg"
            className="group rounded-full bg-white text-blue-900 hover:bg-gray-100 px-8 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full border-2 border-white bg-transparent text-lg font-semibold text-white hover:bg-white/10 hover:text-white"
          >
            Schedule Demo
          </Button>
        </motion.div>

        <motion.div variants={item} className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-xl bg-white/10 p-6 border border-white/10 text-center">
            <p className="text-white/70 mb-1">Avg. ROI</p>
            <p className="text-3xl font-bold text-green-400">+325%</p>
          </div>
          <div className="rounded-xl bg-white/10 p-6 border border-white/10 text-center">
            <p className="text-white/70 mb-1">Client Satisfaction</p>
            <p className="text-3xl font-bold text-blue-300">98.6%</p>
          </div>
          <div className="rounded-xl bg-white/10 p-6 border border-white/10 text-center">
            <p className="text-white/70 mb-1">Deployment Speed</p>
            <p className="text-3xl font-bold text-purple-300">2x Faster</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
