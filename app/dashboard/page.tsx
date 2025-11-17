"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardCharts } from "../components/DashboardCharts";
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated, getUserEmail, clearAuthData } from "../lib/auth";
import { getApiUrl } from "../lib/api";

interface Investor {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  amount_of_money: number;
  amount_of_coins: number;
  status: string;
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const itemsPerPage = 10;

  useEffect(() => {
    setIsMounted(true);
    
    // Check authentication using auth service
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const email = getUserEmail();
    setUserEmail(email || "User");

    // Fetch investors from database
    fetchInvestors();
  }, [router]);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/investors'));
      const data = await response.json();
      
      if (data.success) {
        setInvestors(data.data);
      } else {
        console.error('Failed to fetch investors:', data.error);
      }
    } catch (error) {
      console.error('Error fetching investors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const filteredInvestors = statusFilter === "All" 
    ? investors 
    : investors.filter(inv => inv.status === statusFilter);
  
  const totalPages = Math.ceil(filteredInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvestors = filteredInvestors.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const handleLogout = () => {
    clearAuthData();
    router.push("/login");
  };

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Image 
            src="/images/logo.svg" 
            alt="The Sport Exchange" 
            width={130} 
            height={40}
            priority
          />
          <div className="flex items-center gap-4">
            <nav className="flex gap-4">
              <span className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
                Dashboard
              </span>
              <Link
                href="/dashboard/newsletter"
                className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
              >
                Newsletter
              </Link>
              <Link
                href="/dashboard/add-investor"
                className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
              >
                Add Investor
              </Link>
            </nav>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold dark:text-white">
            Dashboard
          </h2>
          <p className="mt-2 dark:text-zinc-400">
            Welcome to your sports exchange Investor dashboard
          </p>
        </div>

        {/* Dashboard Charts */}
        <DashboardCharts />

        {/* Investors Table */}
        <div className="mt-8 rounded-xl p-6 border border-zinc-200 shadow-sm dark:bg-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold dark:text-white">
              Investors
            </h3>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 px-4 py-2 text-sm font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Signed">Signed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 font-semibold border-b border-zinc-200 p-4">
                <div>First Name</div>
                <div>Email Address</div>
                <div>Phone </div>
                <div>Amount of Money</div>
                <div>Status</div>    
            </div>
            {paginatedInvestors.map((investor) => (
              <Link
                key={investor.id}
                href={`/dashboard/investor/${investor.id}`}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 border-b border-zinc-200 pt-4 pb-4 last:border-0 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer p-2 mb-0"
              >
                <div className="font-medium dark:text-white">
                    {investor.full_name}
                </div>
                <div className="text-sm dark:text-zinc-400">
                    {investor.email}
                </div>
                <div className="text-sm dark:text-zinc-400">
                    {investor.phone || 'N/A'}
                </div>
                <div className="font-semibold dark:text-white">
                    ${investor.amount_of_money?.toLocaleString() || '0'}
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    investor.status === 'Paid' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : investor.status === 'Signed'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : investor.status === 'Pending'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {investor.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Previous
            </button>
            <span className="text-sm dark:text-zinc-400">
              Page {currentPage} of {totalPages} ({filteredInvestors.length} investor{filteredInvestors.length !== 1 ? 's' : ''})
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
