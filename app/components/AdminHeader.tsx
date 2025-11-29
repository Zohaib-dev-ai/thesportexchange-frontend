'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { clearAuthData } from '../lib/auth';
import { getApiUrl } from '../lib/api';

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingReferralsCount, setPendingReferralsCount] = useState(0);

  const handleLogout = () => {
    clearAuthData();
    router.push('/login');
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(getApiUrl('/api/investment-requests?status=pending'));
      const data = await response.json();
      
      if (data.success) {
        setPendingRequestsCount(data.data?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  const fetchPendingReferrals = async () => {
    try {
      const response = await fetch(getApiUrl('/api/referrals/admin/pending/count'));
      const data = await response.json();
      
      if (data.success) {
        setPendingReferralsCount(data.data?.count || 0);
      }
    } catch (err) {
      console.error('Error fetching pending referrals:', err);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchPendingReferrals();
    // Refresh count every 30 seconds
    const interval = setInterval(() => {
      fetchPendingRequests();
      fetchPendingReferrals();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/investment-requests', label: 'Investment Requests', count: pendingRequestsCount, highlight: pendingRequestsCount > 0 },
    { href: '/dashboard/referrals', label: 'Referrals', count: pendingReferralsCount, highlight: pendingReferralsCount > 0 },
    { href: '/dashboard/newsletter', label: 'Newsletter' },
    { href: '/dashboard/send-message', label: 'Message' },
    { href: '/dashboard/add-investor', label: 'Add Investor' },
    { href: '/dashboard/tcf', label: 'TCF' },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Image 
          src="/images/logo.svg" 
          alt="The Sport Exchange" 
          width={130} 
          height={40}
          priority
        />
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <nav className="flex gap-4">
            {navItems.map((item) => (
              isActive(item.href) ? (
                <span
                  key={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 ${
                    item.highlight 
                      ? 'bg-orange-600 text-white dark:bg-orange-600'
                      : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  }`}
                >
                  {item.label}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {item.count}
                    </span>
                  )}
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                    item.highlight
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-zinc-700 text-white hover:bg-zinc-600 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600'
                  }`}
                >
                  {item.label}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {item.count}
                    </span>
                  )}
                </Link>
              )
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Logout
          </button>
        </div>

        {/* Mobile Burger Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800">
          <nav className="flex flex-col gap-2 px-4 py-4">
            {navItems.map((item) => (
              isActive(item.href) ? (
                <span
                  key={item.href}
                  className={`rounded-lg px-4 py-3 text-sm font-medium flex items-center justify-between ${
                    item.highlight 
                      ? 'bg-orange-600 text-white dark:bg-orange-600'
                      : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  }`}
                >
                  {item.label}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {item.count}
                    </span>
                  )}
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors flex items-center justify-between ${
                    item.highlight
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-zinc-700 text-white hover:bg-zinc-600 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600'
                  }`}
                >
                  {item.label}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {item.count}
                    </span>
                  )}
                </Link>
              )
            ))}
            <button
              onClick={handleLogout}
              className="rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-left"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
