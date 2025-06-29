import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SSOLogin from "@/components/ui/SSOLogin";
import { X } from "lucide-react";
import { register } from "@/api/auth";

const OrDivider = () => (
  <div className="flex items-center my-2">
    <div className="flex-1 h-px bg-gray-300" />
    <span className="mx-2 text-gray-400 text-xs font-semibold">or</span>
    <div className="flex-1 h-px bg-gray-300" />
  </div>
);

const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [org, setOrg] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Split name into first and last (simple split)
      const [firstName, ...rest] = name.trim().split(" ");
      const lastName = rest.join(" ");
      await register({
        email,
        password,
        firstName,
        lastName,
        organizationName: org,
        subdomain,
      });
      setLoading(false);
      navigate("/login");
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || "Signup failed");
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-blue-900 to-blue-700 dark:from-zinc-900 dark:via-blue-900 dark:to-blue-700">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 w-full max-w-xs relative" style={{ minWidth: 280, maxWidth: 340 }}>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none"
          onClick={handleClose}
          aria-label="Close"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <X className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">Sign Up</h2>
        <p className="text-gray-500 dark:text-gray-300 text-center mb-4">Fill in your details to get started.</p>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input type="text" id="name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input type="password" id="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="org">Org</Label>
              <Input type="text" id="org" placeholder="Org" value={org} onChange={e => setOrg(e.target.value)} required />
            </div>
            <div className="flex-1">
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input type="text" id="subdomain" placeholder="subdomain" value={subdomain} onChange={e => setSubdomain(e.target.value)} required />
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</Button>
        </form>
        <OrDivider />
        <SSOLogin />
        <div className="mt-3 text-center">
          <span className="text-gray-500 dark:text-gray-300">Already have an account? </span>
          <button
            className="text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none p-0 m-0 cursor-pointer"
            style={{ fontWeight: 500 }}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
