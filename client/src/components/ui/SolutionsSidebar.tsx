import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaBox, FaBook, FaLifeRing, FaTimes, FaHome } from 'react-icons/fa';

const navItems = [
  { to: '/home', icon: <FaHome />, label: 'Home' },
  { to: '/solutions', icon: <FaBox />, label: 'Solutions' },
  { to: '/resources', icon: <FaBook />, label: 'Resources' },
  { to: '/support', icon: <FaLifeRing />, label: 'Support' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const SolutionsSidebar: React.FC<SidebarProps> = ({ open, onClose }) => (
  <div
    className={`fixed top-0 left-0 h-full w-64 z-50 shadow-lg border-r transition-transform duration-300 ease-in-out flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}
    style={{
      boxShadow: open ? '0 2px 16px rgba(0,0,0,0.12)' : 'none',
      background: 'linear-gradient(to bottom, #312e81 0%, #1e3a8a 50%, #6d28d9 100%)',
      minHeight: '100vh',
    }}
  >
    <div className="flex justify-end p-2">
      <button onClick={onClose} className="text-black hover:text-red-400 text-base focus:outline-none">
        <FaTimes />
      </button>
    </div>
    <nav className="flex flex-col items-center mt-8">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center mb-8 text-xl transition-colors ${isActive ? 'text-yellow-300' : 'text-white hover:text-yellow-200'}`
          }
          title={item.label}
          onClick={onClose}
        >
          {/* Force sidebar menu icon to black if this is the menu icon */}
          {item.label === 'Solutions' && false /* placeholder for menu icon logic */}
          {React.cloneElement(item.icon, { color: 'black', size: 28 })}
          <span className="text-xs mt-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  </div>
);

export default SolutionsSidebar;
