'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from './button';
import { Bus, LogOut, User, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Bus className="h-5 w-5" />
          <span>SBUP Bus Tracker</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/">
                <Button variant={pathname === '/' ? 'default' : 'ghost'} size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              
              {user.role === 'driver' && (
                <Link href="/driver">
                  <Button variant={pathname === '/driver' ? 'default' : 'ghost'} size="sm">
                    <Bus className="h-4 w-4 mr-2" />
                    Driver Dashboard
                  </Button>
                </Link>
              )}
              
              <div className="hidden md:flex items-center gap-2 text-sm mr-4">
                <User className="h-4 w-4" />
                <span>{user.name}</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{user.role}</span>
              </div>
              
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant={pathname === '/login' ? 'default' : 'ghost'} size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant={pathname === '/signup' ? 'default' : 'ghost'} size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 