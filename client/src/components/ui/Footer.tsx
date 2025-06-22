// src/components/ui/Footer.tsx

import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Github, Twitter, Linkedin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-300 py-10">
      <div className="w-full px-6">
        {/* Top section: Logo + Nav Links */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
          <div>
            <h2 className="text-xl font-semibold text-white">MutyncHub</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Empowering your digital future.
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              <strong>Call:</strong> <a href="tel:+254723570401" className="hover:text-white">+254 723 570 401</a><br />
              <strong>Email:</strong> <a href="mailto:info@mutsynchub.com" className="hover:text-white">info@mutsynchub.com</a>
            </p>
            <p className="mt-2 text-sm italic text-neutral-500">
              MutyncHub is your premium partner in digital transformation.
            </p>
          </div>

          <nav className="flex flex-wrap gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/solutions" className="hover:text-white transition-colors">Solutions</Link>
            <Link to="/saas" className="hover:text-white transition-colors">SaaS</Link>
            <Link to="/resources" className="hover:text-white transition-colors">Resources</Link>
            <Link to="/support" className="hover:text-white transition-colors">Support</Link>
          </nav>
        </div>

        <Separator className="my-6 bg-neutral-700" />

        {/* Bottom section: Socials + Copy */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} MutyncHub. All rights reserved.</p>

          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
              <Github className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
              <Twitter className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
              <Linkedin className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
