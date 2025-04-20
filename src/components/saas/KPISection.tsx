import { useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip } from "chart.js";
import { motion } from "framer-motion";
import { DollarSign, Users, TrendingUp, ShoppingCart } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip);

const tabs = ["Sales", "Operations", "Engagement"];

const KPISection = () => {
  const [activeTab, setActiveTab] = useState("Sales");

  const renderCards = () => {
    switch (activeTab) {
      case "Sales":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPI icon={<DollarSign />} title="Monthly Revenue" value="$82,500" />
            <KPI icon={<ShoppingCart />} title="Orders" value="3,214" />
            <KPI icon={<Users />} title="New Customers" value="528" />
            <KPI icon={<TrendingUp />} title="Growth" value="12.4%" />
          </div>
        );
      case "Operations":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPI icon={<Users />} title="Active Staff" value="72" />
            <KPI icon={<DollarSign />} title="Fulfillment Cost" value="$12,100" />
            <KPI icon={<TrendingUp />} title="Uptime" value="99.98%" />
            <KPI icon={<ShoppingCart />} title="Inventory Turns" value="5.3x" />
          </div>
        );
      case "Engagement":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPI icon={<Users />} title="Sessions" value="41,200" />
            <KPI icon={<DollarSign />} title="Avg Order Value" value="$63.40" />
            <KPI icon={<ShoppingCart />} title="Bounce Rate" value="31%" />
            <KPI icon={<TrendingUp />} title="Return Visitors" value="42%" />
          </div>
        );
      default:
        return null;
    }
  };

  const lineChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue",
        data: [12000, 18000, 14000, 20000, 24000, 30000],
        borderColor: "#60A5FA",
        backgroundColor: "#60A5FA44",
      },
    ],
  };

  const barChartData = {
    labels: ["Product A", "Product B", "Product C"],
    datasets: [
      {
        label: "Sales",
        data: [5400, 2900, 4100],
        backgroundColor: "#8B5CF6",
      },
    ],
  };

  return (
    <section className="py-24 px-6 text-white bg-gradient-to-br from-blue-950 via-purple-950 to-indigo-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Platform Intelligence In Action</h2>
          <p className="text-blue-200 mt-2 max-w-xl mx-auto">
            Real KPIs, real decisions — visualize every corner of your business with precision.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full border transition-all ${
                activeTab === tab
                  ? "bg-white text-blue-900 font-semibold"
                  : "border-white/30 text-white hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          {renderCards()}
        </motion.div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow">
            <h4 className="text-lg font-semibold mb-4">Revenue Trends</h4>
            <Line data={lineChartData} />
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow">
            <h4 className="text-lg font-semibold mb-4">Top Products</h4>
            <Bar data={barChartData} />
          </div>
        </div>
      </div>
    </section>
  );
};

const KPI = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow transition"
  >
    <div className="flex items-center gap-3 mb-3 text-blue-300">{icon}</div>
    <h4 className="text-sm text-blue-100 mb-1">{title}</h4>
    <p className="text-2xl font-bold">{value}</p>
  </motion.div>
);

export default KPISection;
