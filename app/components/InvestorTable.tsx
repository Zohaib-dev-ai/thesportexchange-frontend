"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getApiUrl } from "../lib/api";
import { getAuthToken } from "../lib/auth";

interface Investor {
  id: number;
  user_id: number;
  full_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  amount_of_money: number;
  amount_of_coins: number;
  share_percentage: number;
  investment_date: string;
  status: string;
  payment: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function InvestorTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const formatCoins = (value: string | number) => {
    if (!value && value !== 0) return '0';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numericValue) ? '0' : numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatCurrency = (value: string | number) => {
    if (!value && value !== 0) return '$0';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numericValue) ? '$0' : `$${numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl('/api/investors'), { headers });
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
  const filteredInvestors = investors.filter(investor => {
    const matchesStatus = statusFilter === "All" || investor.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      investor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  
  const totalPages = Math.ceil(filteredInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvestors = filteredInvestors.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="mt-8 rounded-xl p-6 border border-zinc-200 shadow-sm dark:bg-zinc-800">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl p-6 border border-zinc-200 shadow-sm dark:bg-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold dark:text-white">
          Investors
        </h3>
        
        {/* Search and Filter */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 px-4 py-2 text-sm font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400"
          >
            <option value="All">All Status</option>
            <option value="Signed">Signed</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 font-semibold border-b border-zinc-200 p-4">
          <div>Name</div>
          <div>Email Address</div>
          <div>Phone</div>
          <div>Total Investment</div>
          <div>Total Coins</div>
          {/*<div>Status</div>*/}
        </div>
        {paginatedInvestors.map((investor) => (
          <Link
            key={investor.id}
            href={`/dashboard/investor/${investor.id}`}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 border-b border-zinc-200 pt-4 pb-4 last:border-0 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer p-2 mb-0"
          >
            <div className="font-medium dark:text-white">
              {investor.full_name} {investor.last_name}
            </div>
            <div className="text-sm dark:text-zinc-400">
              {investor.email}
            </div>
            <div className="text-sm dark:text-zinc-400">
              {investor.phone || 'N/A'}
            </div>
            <div className="font-semibold dark:text-white">
              {formatCurrency(investor.amount_of_money)}
            </div>
            <div className="font-semibold dark:text-white">
              {formatCoins(investor.amount_of_coins)}
            </div>
            {/*<div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                investor.status === 'Signed'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : investor.status === 'Paid'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {investor.status}
              </span>
            </div>*/}
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
  );
}

