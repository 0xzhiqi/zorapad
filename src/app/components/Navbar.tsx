'use client';

import { useEffect, useState } from 'react';

import { Feather, LayoutDashboard, Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import ConnectButton from './LoginButton';

interface NavbarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  // Determine if we're on the homepage (dark background) or other pages (light background)
  const isHomepage = pathname === '/';

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect to home if user tries to access protected routes without session
  useEffect(() => {
    const protectedRoutes = ['/dashboard', '/profile', '/launch-new-novel', '/edit-novel'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    if (status !== 'loading' && !session && isProtectedRoute) {
      router.push('/');
    }
  }, [session, status, pathname, router]);

  // Dynamic background based on scroll state and page
  const getNavbarBackground = () => {
    if (!isScrolled) return 'bg-transparent';

    if (isHomepage) {
      return 'bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-md';
    } else {
      return 'bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-sm';
    }
  };

  // Simplified color classes based on current page
  const textColor = isHomepage ? 'text-white/80' : 'text-purple-600';
  const textColorHover = isHomepage ? 'hover:text-white' : 'hover:text-purple-800';
  const buttonTextColor = isHomepage ? 'text-white' : 'text-purple-600';
  const buttonBorderColor = isHomepage ? 'border-white/30' : 'border-purple-200';
  const buttonBgColor = isHomepage ? 'bg-white/10' : 'bg-purple-100';
  const buttonBgColorHover = isHomepage ? 'hover:bg-white/20' : 'hover:bg-purple-200';
  const mobileMenuButtonColor = isHomepage
    ? 'text-white hover:text-pink-400'
    : 'text-purple-600 hover:text-purple-800';
  const mobileMenuBg = isHomepage
    ? 'bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90'
    : 'bg-white/95';
  const mobileMenuBorder = isHomepage ? 'border-white/20' : 'border-purple-200';

  // Only show Dashboard button if user is authenticated
  const showDashboard = status === 'authenticated' && session;

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

      {/* Navigation - with dynamic background based on scroll */}
      <nav
        className={`fixed top-0 right-0 left-0 z-50 p-6 transition-all duration-300 ease-in-out ${getNavbarBackground()}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-4 transition-transform duration-300 hover:scale-105"
          >
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
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link
              href="/explore"
              className={`${textColor} transition-colors duration-300 ${textColorHover}`}
            >
              Explore
            </Link>
            <Link
              href="/community"
              className={`${textColor} transition-colors duration-300 ${textColorHover}`}
            >
              Community
            </Link>
            {showDashboard ? (
              <Link
                href="/dashboard"
                className={`flex items-center space-x-2 rounded-full border-2 ${buttonBorderColor} ${buttonBgColor} px-6 py-3 font-semibold ${buttonTextColor} backdrop-blur-sm transition-all duration-300 hover:scale-105 ${buttonBgColorHover}`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <ConnectButton
                className={`[&>div>button]:rounded-full [&>div>button]:border [&>div>button]:border-purple-200 [&>div>button]:${isHomepage ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'} [&>div>button]:px-6 [&>div>button]:py-3 [&>div>button]:font-medium [&>div>button]:backdrop-blur-sm [&>div>button]:transition-all [&>div>button]:duration-300 hover:[&>div>button]:scale-105`}
              />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`p-2 transition-colors duration-300 md:hidden ${mobileMenuButtonColor}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div
            className={`absolute top-full right-0 left-0 border-t ${mobileMenuBorder} ${mobileMenuBg} p-6 backdrop-blur-sm md:hidden`}
          >
            <div className="flex flex-col space-y-4">
              <Link
                href="/explore"
                className={`py-2 ${textColor} transition-colors duration-300 ${textColorHover}`}
              >
                Explore
              </Link>
              <Link
                href="/community"
                className={`py-2 ${textColor} transition-colors duration-300 ${textColorHover}`}
              >
                Community
              </Link>
              {showDashboard ? (
                <Link
                  href="/dashboard"
                  className={`flex items-center justify-center space-x-2 rounded-full border-2 ${buttonBorderColor} ${buttonBgColor} px-6 py-3 font-semibold ${buttonTextColor} backdrop-blur-sm transition-all duration-300 ${buttonBgColorHover}`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <ConnectButton
                  className={`[&>div>button]:rounded-full [&>div>button]:border [&>div>button]:border-purple-200 [&>div>button]:${isHomepage ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'} [&>div>button]:px-6 [&>div>button]:py-3 [&>div>button]:text-center [&>div>button]:font-medium [&>div>button]:backdrop-blur-sm [&>div>button]:transition-all [&>div>button]:duration-300 hover:[&>div>button]:bg-purple-200`}
                />
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
