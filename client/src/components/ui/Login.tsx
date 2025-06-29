import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SSOLogin from "@/components/ui/SSOLogin";
import { X } from "lucide-react";
import { login } from "@/api/auth";

const OrDivider = () => (
  <div className="flex items-center my-2">
    <div className="flex-1 h-px bg-gray-300" />
    <span className="mx-2 text-gray-400 text-xs font-semibold">or</span>
    <div className="flex-1 h-px bg-gray-300" />
  </div>
);

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      // Save token to localStorage
      localStorage.setItem("token", res.data.token);
      // Optionally save user info
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setLoading(false);
      navigate("/analytics");
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-blue-900 to-blue-700 dark:from-zinc-900 dark:via-blue-900 dark:to-blue-700">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 w-full max-w-sm relative" style={{ minWidth: 320, maxWidth: 380 }}>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none"
          onClick={handleClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <X className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">Login</h2>
        <p className="text-gray-500 dark:text-gray-300 text-center mb-6">Enter your credentials to sign in.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input type="password" id="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
        </form>
        <OrDivider />
        <SSOLogin />
        <div className="mt-4 text-center">
          <span className="text-gray-500 dark:text-gray-300">Don't have an account? </span>
          <button
            className="text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none p-0 m-0 cursor-pointer font-semibold"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
