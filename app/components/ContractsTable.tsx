"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiUrl } from "../lib/api";

interface Contract {
  id: number;
  investor_id: number;
  amount_of_money: number;
  amount_of_coins: number;
  coin_rate: number;
  payment_status: string;
  status: string;
  investment_date: string;
  created_at: string;
  full_name: string;
  last_name: string;
  email: string;
  document_count?: number;
}

export default function ContractsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'contract sent':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'signed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/contracts'));
      const data = await response.json();
      
      if (data.success) {
        setContracts(data.data);
      } else {
        console.error('Failed to fetch contracts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const filteredContracts = contracts.filter(contract => {
    const matchesStatus = statusFilter === "All" || contract.payment_status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      contract.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, startIndex + itemsPerPage);

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
          Contracts
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
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-6 font-semibold border-b border-zinc-200 p-4">
          <div>First Name</div>
          <div>Email Address</div>
          <div>Amount of Money</div>
          <div>Amount of Coin</div>
          <div>Status</div>
          <div>Payment</div>
        </div>
        {paginatedContracts.map((contract) => (
          <Link
            key={contract.id}
            href={`/dashboard/contracts/${contract.id}`}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6 border-b border-zinc-200 pt-4 pb-4 last:border-0 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer p-2 mb-0"
          >
            <div className="font-medium dark:text-white">
              {contract.full_name}
            </div>
            <div className="text-sm dark:text-zinc-400">
              {contract.email}
            </div>
            <div className="text-sm dark:text-zinc-400">
              {formatCurrency(contract.amount_of_money)}
            </div>
            <div className="font-semibold dark:text-white">
              {formatCoins(contract.amount_of_coins)}
            </div>
            <div className="font-semibold dark:text-white">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(contract.status)}`}>
                {contract.status || 'pending'}
              </span>
            </div>
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                contract.payment_status === 'Paid'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {contract.payment_status || 'Unpaid'}
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
          Page {currentPage} of {totalPages} ({filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''})
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

