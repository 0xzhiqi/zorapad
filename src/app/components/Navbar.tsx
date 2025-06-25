'use client';

import { Feather, Menu, X } from 'lucide-react';

import ConnectButton from './LoginButton';

interface NavbarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  return (
    <>
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="featherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>

      {/* Navigation */}
      <nav className="relative z-50 p-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <Feather
              className="h-10 w-10 drop-shadow-lg"
              strokeWidth={1.5}
              style={{
                stroke: 'url(#featherGradient)',
                filter:
                  'drop-shadow(0 0 10px rgba(244, 114, 182, 0.8)) drop-shadow(0 0 20px rgba(139, 92, 246, 0.4))',
              }}
            />
            <h1 className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-3xl font-bold text-transparent">
              ZoraPad
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <a href="#" className="text-white/80 transition-colors duration-300 hover:text-white">
              Explore
            </a>
            <a href="#" className="text-white/80 transition-colors duration-300 hover:text-white">
              Community
            </a>
            <a href="#" className="text-white/80 transition-colors duration-300 hover:text-white">
              About
            </a>
            <ConnectButton className="[&>div>button]:rounded-full [&>div>button]:border [&>div>button]:border-white/20 [&>div>button]:bg-white/10 [&>div>button]:px-6 [&>div>button]:py-3 [&>div>button]:font-medium [&>div>button]:text-white [&>div>button]:backdrop-blur-sm [&>div>button]:transition-all [&>div>button]:duration-300 hover:[&>div>button]:scale-105 hover:[&>div>button]:bg-white/20" />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="p-2 text-white transition-colors duration-300 hover:text-pink-400 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full right-0 left-0 border-t border-white/20 bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 p-6 backdrop-blur-sm md:hidden">
            <div className="flex flex-col space-y-4">
              <a
                href="#"
                className="py-2 text-white/80 transition-colors duration-300 hover:text-white"
              >
                Explore
              </a>
              <a
                href="#"
                className="py-2 text-white/80 transition-colors duration-300 hover:text-white"
              >
                Community
              </a>
              <a
                href="#"
                className="py-2 text-white/80 transition-colors duration-300 hover:text-white"
              >
                About
              </a>
              <ConnectButton className="[&>div>button]:rounded-full [&>div>button]:border [&>div>button]:border-white/20 [&>div>button]:bg-white/10 [&>div>button]:px-6 [&>div>button]:py-3 [&>div>button]:text-center [&>div>button]:font-medium [&>div>button]:text-white [&>div>button]:backdrop-blur-sm [&>div>button]:transition-all [&>div>button]:duration-300 hover:[&>div>button]:bg-white/20" />
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
