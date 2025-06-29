import React from "react";
import SSOLogin from "../../components/ui/SSOLogin";
import { useNavigate } from "react-router-dom";

const GlobalLoginReminder: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed z-50 flex items-start justify-end w-full h-full pointer-events-none">
      <div
        className="bg-white rounded-xl shadow-xl p-4 w-64 h-64 text-center relative mt-20 mr-8 flex flex-col justify-center items-center pointer-events-auto"
        style={{ minWidth: 180, minHeight: 180, maxWidth: 260, maxHeight: 260 }}
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <span style={{ fontSize: 18, fontWeight: 700 }}>&times;</span>
        </button>
        <h2 className="text-lg font-bold mb-1 text-blue-800">Sign in for Full Access</h2>
        <p className="mb-2 text-xs text-gray-600">Log in or sign up to unlock all features.</p>
        <div className="flex flex-col gap-2 w-full items-center">
          <SSOLogin />
          <span className="text-gray-400 text-xs my-1">or</span>
          <button
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-1 rounded shadow px-3 text-xs"
            onClick={() => navigate("/login")}
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoginReminder;
