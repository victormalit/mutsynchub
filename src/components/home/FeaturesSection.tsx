import { Zap, BarChart3, LayoutTemplate, Cloud, MessageCircle, LineChart } from "lucide-react";

const features = [
  {
    icon: <Zap className="h-6 w-6 text-blue-400" />,
    title: "Automated Data Pipelines",
    desc: "Eliminate manual data work — schedule, clean, and load data seamlessly.",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-purple-400" />,
    title: "Industry-Specific Insights",
    desc: "Tailored analytics for retail, logistics, finance, and more.",
  },
  {
    icon: <LayoutTemplate className="h-6 w-6 text-green-400" />,
    title: "Scalable Web Solutions",
    desc: "From MVPs to SaaS platforms — built to grow with your business.",
  },
  {
    icon: <Cloud className="h-6 w-6 text-cyan-400" />,
    title: "Serverless Cloud Deployments",
    desc: "Deploy faster, scale smarter — AWS, Azure, GCP ready.",
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-pink-400" />,
    title: "Custom AI Chatbots",
    desc: "Support, onboarding, CRM — intelligent bots that get the job done.",
  },
  {
    icon: <LineChart className="h-6 w-6 text-yellow-400" />,
    title: "Intuitive Dashboards",
    desc: "Real-time, no-code dashboards — crystal clear insights anytime.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white py-24 px-6">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need — All in One Place</h2>
        <p className="text-blue-100 text-base sm:text-lg">
          We’ve bundled powerful tech, smart automation, and cloud-native practices into one seamless solution.
        </p>
      </div>

      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-xl shadow-md transition hover:shadow-lg"
          >
            <div className="mb-4">{feature.icon}</div>
            <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
            <p className="text-sm text-blue-100">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
