import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaChartBar, FaUsers, FaFileAlt, FaMoneyBill, FaCog } from 'react-icons/fa';

const navItems = [
  { to: '/admin', icon: <FaHome />, label: 'Dashboard' },
  { to: '/admin/analytics', icon: <FaChartBar />, label: 'Analytics' },
  { to: '/admin/audit-logs', icon: <FaFileAlt />, label: 'Audit Logs' },
  { to: '/admin/revenue', icon: <FaMoneyBill />, label: 'Revenue' },
  { to: '/admin/users', icon: <FaUsers />, label: 'Users/Orgs' },
  { to: '/admin/settings', icon: <FaCog />, label: 'Settings' },
];

const AdminSidebar: React.FC = () => (
  <aside className="w-20 bg-white border-r flex flex-col items-center py-6 shadow-md">
    {navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `flex flex-col items-center mb-8 text-xl ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`
        }
        title={item.label}
      >
        {item.icon}
        <span className="text-xs mt-1">{item.label}</span>
      </NavLink>
    ))}
  </aside>
);

export default AdminSidebar;
