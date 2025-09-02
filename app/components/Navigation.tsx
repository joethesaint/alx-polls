'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Mock authentication state - would be replaced with actual auth context
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // For demo purposes only - toggle login state
  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <nav className="border-b border-border">
      <div className="container flex justify-between h-14">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl text-primary">
            ALX Polls
          </Link>
          <div className="hidden ml-8 sm:flex space-x-6">
            <Link
              href="/"
              className={`flex items-center text-sm ${pathname === '/' ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
            >
              Home
            </Link>
            
            {isLoggedIn && (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center text-sm ${pathname === '/dashboard' ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/polls/create"
                  className={`flex items-center text-sm ${pathname === '/polls/create' ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
                >
                  Create Poll
                </Link>
              </>
            )}
          </div>
        </div>
        
        <div className="hidden sm:flex items-center">
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, User</span>
              <button
                onClick={toggleLogin}
                className="btn-secondary text-xs"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-sm text-foreground hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="btn-primary text-xs"
              >
                Sign Up
              </Link>
              {/* For demo purposes only */}
              <button
                onClick={toggleLogin}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                (Demo: Toggle Login)
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center sm:hidden">
          <button
            onClick={toggleMenu}
            className="p-2 text-muted-foreground"
          >
            <span className="sr-only">Open main menu</span>
            {/* Icon for menu */}
            <svg
              className={`${isMenuOpen ? 'hidden' : 'block'} h-5 w-5`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            {/* Icon for X */}
            <svg
              className={`${isMenuOpen ? 'block' : 'hidden'} h-5 w-5`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden border-t border-border`}>
        <div className="py-3 space-y-2">
          <Link
            href="/"
            className={`block px-4 py-2 text-sm ${pathname === '/' ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
          >
            Home
          </Link>
          
          {isLoggedIn && (
            <>
              <Link
                href="/dashboard"
                className={`block px-4 py-2 text-sm ${pathname === '/dashboard' ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
              >
                Dashboard
              </Link>
              <Link
                href="/polls/create"
                className={`block px-4 py-2 text-sm ${pathname === '/polls/create' ? 'text-primary font-medium' : 'text-foreground hover:text-primary'}`}
              >
                Create Poll
              </Link>
            </>
          )}
        </div>
        
        <div className="py-3 border-t border-border">
          {isLoggedIn ? (
            <div className="px-4 space-y-2">
              <div className="text-sm font-medium">User</div>
              <div className="text-xs text-muted-foreground">user@example.com</div>
              <button
                onClick={toggleLogin}
                className="mt-2 btn-secondary text-xs w-full"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="px-4 space-y-2">
              <Link
                href="/auth/login"
                className="block text-center py-2 text-sm text-foreground hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="block text-center py-1.5 text-xs btn-primary w-full"
              >
                Sign Up
              </Link>
              {/* For demo purposes only */}
              <button
                onClick={toggleLogin}
                className="text-xs text-muted-foreground hover:text-foreground underline mt-2"
              >
                (Demo: Toggle Login)
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}