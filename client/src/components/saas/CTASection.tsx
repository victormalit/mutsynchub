import React from "react";
import { motion } from "framer-motion";

const CTASection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white py-24 px-6">
      {/* Glow elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 h-32 w-32 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-10 right-10 h-48 w-48 bg-purple-500/20 blur-2xl rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Ready to Turn Your Data into Decisions?
        </h2>
        <p className="text-blue-100 text-base sm:text-lg mb-8">
          Get started with intelligent dashboards, AI-driven insights, and zero-code automation — built for your business.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="/dashboard"
            className="bg-white text-blue-900 px-6 py-3 rounded-full font-semibold hover:bg-blue-100 transition"
          >
            Try the Live Demo
          </a>
          <a
            href="/contact"
            className="border border-white px-6 py-3 rounded-full text-white font-semibold hover:bg-white/10 transition"
          >
            Talk to an Expert
          </a>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
