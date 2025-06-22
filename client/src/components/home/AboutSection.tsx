import React from "react";
import { motion } from "framer-motion";
import AboutImage from "@assets/images/about.png";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const AboutSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 py-24 px-6 text-white">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
      >
        {/* Image / Illustration */}
        <motion.div variants={item}>
          <img
            src={AboutImage} 
            alt="Team working"
            className="w-full rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500"
          />
        </motion.div>

        {/* Text Content */}
        <motion.div variants={item} className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Empowering Businesses with Intelligent Technology.
          </h2>
          <p className="text-lg text-blue-100">
            At MutSyncHub, we're not just building software  we’re crafting
            intelligent ecosystems that help businesses grow with confidence.
            From real-time data automation to smart cloud solutions, our
            approach is always tailored and future-forward.
          </p>
          <ul className="space-y-3">
            {[
              "Transparent & data-driven decision making",
              "Scalable, modular architectures",
              "Built for all — from startups to enterprises",
              "Agile, fast, and user-focused delivery",
            ].map((point, idx) => (
              <motion.li
                key={idx}
                variants={item}
                className="text-blue-200 hover:text-white transition-colors"
              >
                {point}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default AboutSection;
