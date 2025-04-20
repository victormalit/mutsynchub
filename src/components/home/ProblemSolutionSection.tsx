import { Check, Database, Cloud, Bot, Layout } from "lucide-react";
import illustration from "@/assets/logos/illustration.svg"; // make sure the path is correct

const ProblemSolutionSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 text-white py-24 px-6">
      {/* Glow backgrounds (optional but fancy) */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 h-40 w-40 bg-purple-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-10 right-10 h-60 w-60 bg-blue-500/20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Text content */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            The Future of Data, Web, and Cloud — <span className="text-blue-300">Unified.</span>
          </h2>
          <p className="text-blue-100 text-base sm:text-lg mb-8">
            Most businesses struggle to unlock real value from their data, tech stack, or digital presence.
            They juggle fragmented tools, rigid systems, and slow integrations — wasting time and missing insights.
          </p>

          <div className="space-y-6">
            <FeatureItem
              icon={<Database className="h-5 w-5" />}
              title="End-to-End Data Intelligence"
              desc="From custom data ingestion to real-time dashboards — made for retail, logistics, finance, and more."
            />
            <FeatureItem
              icon={<Layout className="h-5 w-5" />}
              title="Custom Full-Stack Web Services"
              desc="Dynamic, scalable websites and SaaS platforms — full stack, full power, tailored to your goals."
            />
            <FeatureItem
              icon={<Cloud className="h-5 w-5" />}
              title="Modern Cloud Architecture"
              desc="Secure, serverless, and optimized deployments — built on AWS, Azure, or GCP."
            />
            <FeatureItem
              icon={<Bot className="h-5 w-5" />}
              title="AI Chatbots for Every Workflow"
              desc="Deploy custom intelligent agents for CRMs, customer service, and internal ops — fast and easy."
            />
          </div>
        </div>

        {/* Illustration */}
        <div className="flex justify-center md:justify-end">
          <img
            src={illustration}
            alt="Solution Illustration"
            className="max-w-md w-full object-contain"
          />
        </div>
      </div>
    </section>
  );
};

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-start gap-4">
    <div className="bg-white/10 p-3 rounded-lg">{icon}</div>
    <div>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="text-blue-100 text-sm">{desc}</p>
    </div>
  </div>
);

export default ProblemSolutionSection;
