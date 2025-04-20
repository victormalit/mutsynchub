import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import Aws from "@/assets/logos/aws.svg";
import Cisco from "@/assets/logos/cisco.svg";
import GoogleCloud from "@/assets/logos/googlecloud.svg";
import ISO from "@/assets/logos/iso.svg";
import Microsoft from "@/assets/logos/microsoft.svg";
import Fortinet from "@/assets/logos/fortinet.svg";

const HeroSection = () => {
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
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 py-24 px-6 text-white">
      {/* Background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 h-1/3 w-full bg-gradient-to-b from-white/10 to-transparent" />
        <div className="absolute bottom-20 left-20 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-20 right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-7xl text-center"
      >
        <motion.div variants={item} className="mb-6">
          <span className="rounded-full bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur-md">
            New: AI-powered analytics →
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="mx-auto max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:leading-[1.2]"
        >
          Accelerate Your <span className="text-blue-300">Digital</span>{" "}
          Transformation
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100 sm:text-xl"
        >
          MutSyncHub delivers cutting-edge solutions to automate workflows,
          analyze data, and scale your business effortlessly.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
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
            See Demo
          </Button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          variants={item}
          className="mt-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 text-white">
            <div className="rounded-xl bg-white/10 p-4 border border-white/10 text-center">
              <p className="text-lg text-white/70 mb-1">Uptime</p>
              <p className="text-3xl font-bold text-green-400">99.98%</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 border border-white/10 text-center">
              <p className="text-lg text-white/70 mb-1">Projects Deployed</p>
              <p className="text-3xl font-bold text-blue-300">1,024</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 border border-white/10 text-center">
              <p className="text-lg text-white/70 mb-1">Integrations</p>
              <p className="text-3xl font-bold text-purple-300">47</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-6 px-6 pb-6">
            {[Aws, Cisco, GoogleCloud, ISO, Microsoft, Fortinet].map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt="Logo"
                className="h-8 grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
