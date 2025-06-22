import React from 'react';

// You can use a Google SVG or a react-icons package for a better icon
const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48">
    <g>
      <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.2 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-4z"/>
      <path fill="#34A853" d="M6.3 14.7l7 5.1C15.5 16.1 19.4 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 6.5 29.6 4 24 4c-7.2 0-13.4 3.1-17.7 8.1z"/>
      <path fill="#FBBC05" d="M24 44c5.6 0 10.5-1.9 14.3-5.1l-6.6-5.4C29.7 35.5 27 36.5 24 36.5c-6.1 0-10.7-3.8-12.5-9.1l-7 5.4C7.6 40.9 15.1 44 24 44z"/>
      <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.2 3.2-4.2 5.5-7.7 5.5-4.7 0-8.5-3.8-8.5-8.5s3.8-8.5 8.5-8.5c2.1 0 4 .7 5.5 2.1l6.4-6.4C38.7 8.1 31.8 4 24 4c-8.9 0-16.4 5.1-20.2 12.7l7 5.4C12.7 16.8 17.8 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 6.5 29.6 4 24 4z"/>
    </g>
  </svg>
);

const API_BASE = '/api'; // Adjust if your backend is on a different base path

const SSOLogin: React.FC = () => {
  const handleGoogleSSO = () => {
    window.location.href = `${API_BASE}/auth/sso/google`;
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <button
        onClick={handleGoogleSSO}
        className="flex items-center gap-3 px-6 py-2 rounded shadow bg-white border border-gray-200 hover:bg-gray-50 transition text-gray-800 font-semibold text-base"
        style={{ minWidth: 220 }}
      >
        <span className="flex items-center justify-center">
          <GoogleIcon />
        </span>
        <span>Login with Google</span>
      </button>
    </div>
  );
};

export default SSOLogin;
