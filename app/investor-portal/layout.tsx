'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getUserRole, clearAuthData } from '@/app/lib/auth';

export default function InvestorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && (!isAuthenticated() || getUserRole() !== 'investor')) {
      router.push('/investor-login');
    }
  }, [isMounted, router]);

  const handleLogout = () => {
    clearAuthData();
    router.push('/investor-login');
  };

  const isActivePage = (path: string) => pathname === path;

  if (!isMounted) {
    return null;
  }

  if (!isAuthenticated() || getUserRole() !== 'investor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#111111] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <img
                src="/images/logo.svg"
                alt="The Sport Exchange"
                className="h-10"
              />
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => !isActivePage('/investor-portal') && router.push('/investor-portal')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActivePage('/investor-portal')
                    ? 'bg-blue-600 text-white cursor-default'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                My Dashboard
              </button>
              <button
                onClick={() => !isActivePage('/investor-portal/newsletters') && router.push('/investor-portal/newsletters')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActivePage('/investor-portal/newsletters') || pathname?.startsWith('/investor-portal/newsletter/')
                    ? 'bg-blue-600 text-white cursor-default'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Newsletters
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-medium text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#111111] border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              © 2024 The Sport Exchange. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="mailto:support@thesportexchange.com" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
                Support
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
