import { motion } from "framer-motion";

const industries = [
  {
    title: "Retail",
    desc: "Track inventory, sales, and customer trends in real-time.",
    icon: "🛍️",
  },
  {
    title: "Banking & Finance",
    desc: "Automated reports for transactions, fraud alerts, ROI, and more.",
    icon: "💰",
  },
  {
    title: "Healthcare",
    desc: "Monitor patient flow, lab data, and logistics intelligently.",
    icon: "🧬",
  },
  {
    title: "Logistics",
    desc: "End-to-end supply chain tracking and delay forecasting.",
    icon: "🚚",
  },
  {
    title: "E-commerce",
    desc: "Product performance, cart trends, and churn prevention analytics.",
    icon: "📦",
  },
];

const IndustriesSection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-blue-950 via-purple-950 to-indigo-950 text-white">
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Every Industry</h2>
        <p className="text-blue-200 max-w-2xl mx-auto text-base sm:text-lg">
          From retail shelves to bank vaults, MutSyncHub adapts to your data — no matter the domain.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {industries.map((industry, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow hover:shadow-xl transition"
          >
            <div className="text-3xl mb-3">{industry.icon}</div>
            <h4 className="text-xl font-semibold mb-2">{industry.title}</h4>
            <p className="text-blue-100 text-sm">{industry.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default IndustriesSection;
