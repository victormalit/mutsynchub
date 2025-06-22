import React, { useState } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import analyticsAnimation from "@/assets/animations/data-analytics.json";

const HeroSection: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 flex flex-col justify-center items-center px-6 py-16 text-white overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute w-96 h-96 bg-purple-500 opacity-20 blur-3xl rounded-full top-20 left-10"></div>
        <div className="absolute w-96 h-96 bg-indigo-500 opacity-20 blur-2xl rounded-full bottom-10 right-10"></div>
      </div>

      {/* Text Section */}
      <motion.div
        className="w-full text-center max-w-5xl mb-16 z-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight">
          One Platform. Any Data.
        </h1>
        <h2 className="text-4xl sm:text-5xl font-bold mt-2">Infinite Insights.</h2>
        <p className="text-lg sm:text-xl font-light mt-6 text-white/90">
          Whether you’re in retail, finance, or healthcare —{" "}
          <span className="font-semibold text-white">MutSyncHub</span> connects
          your data, cleans it, and turns it into decisions you can act on.
        </p>
      </motion.div>

      {/* CTA Row */}
      <motion.div
        className="w-full max-w-6xl flex flex-col md:flex-row justify-center items-center gap-10 z-10"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        viewport={{ once: true }}
      >
        {/* Upload Button */}
        <motion.button
          className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-100 hover:scale-105 transition duration-300"
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            document.getElementById("data-manager")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Upload Data
        </motion.button>

        {/* Lottie Animation */}
        <motion.div
          className="w-56 md:w-64 h-56 md:h-64 flex justify-center items-center relative z-10"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <Lottie animationData={analyticsAnimation} loop />
        </motion.div>

        {/* Connect Button */}
        <motion.button
          className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-100 hover:scale-105 transition duration-300"
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            document.getElementById("data-manager")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Connect Source
        </motion.button>
      </motion.div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-lg p-6 max-w-lg w-full shadow-xl relative animate-fadeInUp">
            <h3 className="text-xl font-bold mb-3 text-indigo-800">Upload Your Data</h3>
            <p className="text-sm text-gray-600 mb-4">Upload a CSV or Excel file to generate insights instantly.</p>
            <input type="file" accept=".csv,.xlsx" className="w-full mb-4 border border-gray-300 p-2 rounded" />
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowUpload(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Process File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnect && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-lg p-6 max-w-lg w-full shadow-xl relative animate-fadeInUp">
            <h3 className="text-xl font-bold mb-3 text-indigo-800">Connect a Data Source</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose a source to link — API, Google Sheets, Database, or POS system.
            </p>
            <ul className="list-disc ml-5 text-sm mb-4 text-gray-700">
              <li>Google Sheets (OAuth)</li>
              <li>MySQL / PostgreSQL</li>
              <li>Shopify / Stripe / Airtable</li>
              <li>Custom API / Webhooks</li>
            </ul>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowConnect(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
