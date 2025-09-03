'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className="font-bold text-xl text-blue-500"
          >
            ALX Polls
          </Link>
          <Link
            href="/"
            className={`transition-colors hover:text-gray-900/80 ${
              pathname === '/' ? 'text-gray-900' : 'text-gray-900/60'
            }`}
          >
            Home
          </Link>
          {user && (
            <>
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-gray-900/80 ${
                  pathname === '/dashboard'
                    ? 'text-gray-900'
                    : 'text-gray-900/60'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/polls/create"
                className={`transition-colors hover:text-gray-900/80 ${
                  pathname === '/polls/create'
                    ? 'text-gray-900'
                    : 'text-gray-900/60'
                }`}
              >
                Create Poll
              </Link>
            </>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="btn btn-secondary"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="btn btn-ghost"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="btn btn-primary"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
