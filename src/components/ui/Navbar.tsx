import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Menu, X, ChevronDown } from "lucide-react";
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

const solutionsSections = [
  {
    title: "Our Solutions",
    href: "/solutions#solutions",
    description: "Browse our comprehensive service offerings",
  },
  {
    title: "Case Studies",
    href: "/solutions#case-studies",
    description: "See real-world examples of our work",
  },
  {
    title: "Client Testimonials",
    href: "/solutions#testimonials",
    description: "Hear what our clients say about us",
  },
];

const Navbar = () => {
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

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/10 dark:bg-zinc-900/50 border-b border-white/10 dark:border-zinc-800 transition-all duration-300">
      <div className="w-full px-4 py-3 flex justify-between">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="MutSyncHub Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            MutSyncHub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-4">
          <NavigationMenu>
            <NavigationMenuList className="flex space-x-4">
              <NavigationMenuItem>
                <Link to="/home" className={navigationMenuTriggerStyle()}>
                  Home
                </Link>
              </NavigationMenuItem>
              
              {/* Solutions Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(
                  navigationMenuTriggerStyle(),
                  "group flex items-center gap-1"
                )}>
                  Solutions
                  <ChevronDown
                    className="relative top-[1px] h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {solutionsSections.map((section) => (
                      <li key={section.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={section.href}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">
                              {section.title}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {section.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {["SaaS", "Resources", "Support"].map((item) => (
                <NavigationMenuItem key={item}>
                  <Link to={`/${item.toLowerCase()}`} className={navigationMenuTriggerStyle()}>
                    {item}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* 🔘 Dark mode toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Auth buttons (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Login</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Login</DialogTitle>
                  <DialogDescription>Enter your credentials to sign in.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input type="email" id="email" placeholder="you@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input type="password" id="password" placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="w-full">Login</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button>Sign Up</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Account</DialogTitle>
                  <DialogDescription>Fill in your details to get started.</DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input type="text" id="name" placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input type="email" id="email" placeholder="you@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input type="password" id="password" placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="w-full">Sign Up</Button>
                </form>
              </DialogContent>
            </Dialog>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full mb-2">
                        Login
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Login</DialogTitle>
                        <DialogDescription>Enter your credentials to sign in.</DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input type="email" id="email" placeholder="you@example.com" />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input type="password" id="password" placeholder="••••••••" />
                        </div>
                        <Button type="submit" className="w-full">Login</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">Sign Up</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Account</DialogTitle>
                        <DialogDescription>Fill in your details to get started.</DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input type="text" id="name" placeholder="John Doe" />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input type="email" id="email" placeholder="you@example.com" />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input type="password" id="password" placeholder="••••••••" />
                        </div>
                        <Button type="submit" className="w-full">Sign Up</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
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