import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import logo from "@/assets/images/mutsynchub-logo.png";
import { cn } from "@/lib/utils";
import SSOLogin from "@/components/ui/SSOLogin";
import SolutionsSidebar from "@/components/ui/SolutionsSidebar";

// Google "or" divider component
const OrDivider = () => (
  <div className="flex items-center my-2">
    <div className="flex-1 h-px bg-gray-300" />
    <span className="mx-2 text-gray-400 text-xs font-semibold">or</span>
    <div className="flex-1 h-px bg-gray-300" />
  </div>
);

const Navbar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ✅ Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");

    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  // ✅ Toggle dark mode and persist to localStorage
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setUser, setToken } = useAuth();
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOrg, setSignupOrg] = useState('');
  const [signupSubdomain, setSignupSubdomain] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/10 dark:bg-zinc-900/50 border-b border-white/10 dark:border-zinc-800 transition-all duration-300">
      <SolutionsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="w-full px-4 py-3 flex justify-between">
        {/* Sidebar menu icon */}
        <button
          className="mr-2 flex items-center justify-center h-10 w-10 rounded-lg bg-white/80 hover:bg-blue-100 border border-blue-200 shadow-md md:mr-4"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6 text-black" />
        </button>
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="MutSyncHub Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            MutSyncHub
          </span>
        </Link>

        {/* Desktop Navigation - Only Solutions (landing) and Analytics Engine, spaced apart */}
        <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
          <Link
            to="/home"
            className={`text-lg font-bold px-6 py-2 rounded-lg shadow transition-colors
              ${location.pathname === "/home" || location.pathname === "/" 
                ? "bg-blue-700 text-white" 
                : "bg-white text-black hover:bg-blue-100"}
            `}
            style={{ letterSpacing: '0.01em' }}
          >
            Solutions
          </Link>
          <Link
            to="/analytics"
            className={`text-lg font-bold px-6 py-2 rounded-lg shadow transition-colors
              ${location.pathname.startsWith("/analytics") 
                ? "bg-blue-700 text-white" 
                : "bg-white text-black hover:bg-blue-100"}
            `}
            style={{ letterSpacing: '0.01em' }}
          >
            Analytics Engine
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* 🔘 Dark mode toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Auth buttons (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-gray-800 dark:text-white" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="flex justify-between items-center p-4">
                  <span className="text-lg font-bold">Menu</span>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-6 w-6" />
                    </Button>
                  </DrawerClose>
                </div>
                <nav className="flex flex-col space-y-4 p-4">
                  {["Home", "Solutions", "SaaS", "Resources", "Support"].map((item) => (
                    <Link
                      key={item}
                      to={`/${item.toLowerCase()}`}
                      className="text-gray-900 dark:text-white text-lg"
                    >
                      {item}
                    </Link>
                  ))}
                </nav>
                <div className="p-4 border-t">
                  <Link to="/login">
                    <Button variant="outline" className="w-full mb-2">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
// Simple mock implementation for demonstration.
// In a real app, this would come from context or a global state manager.
function useAuth(): { setUser: (user: any) => void; setToken: (token: string) => void } {
  const setUser = (user: any) => {
    localStorage.setItem("user", JSON.stringify(user));
  };
  const setToken = (token: string) => {
    localStorage.setItem("token", token);
  };
  return { setUser, setToken };
}
