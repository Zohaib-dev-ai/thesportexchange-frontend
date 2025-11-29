"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardCharts } from "../components/DashboardCharts";
import AdminHeader from "../components/AdminHeader";
import ContractsTable from "../components/ContractsTable";
import InvestorTable from "../components/InvestorTable";
import InvestmentRequestsNotification from "../components/InvestmentRequestsNotification";
import InvestmentRequestsTable from "../components/InvestmentRequestsTable";
import ReferralsTable from "../components/ReferralsTable";
import { isAuthenticated, getUserEmail, getAuthToken } from "../lib/auth";
import { getApiUrl } from "../lib/api";

interface Investor {
  status: string;
  payment?: string;
  amount_of_money: number;
  amount_of_coins: number;
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    // Check authentication using auth service
    if (!isAuthenticated()) {
      router.push("/login-admin");
      return;
    }

    const email = getUserEmail();
    setUserEmail(email || "User");
    fetchInvestors();
  }, [router]);

  const fetchInvestors = async () => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl('/api/investors'), { headers });
      const data = await response.json();
      
      if (data.success) {
        setInvestors(data.data);
      }
    } catch (error) {
      console.error('Error fetching investors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from investors
  const stats = {
    total_investors: investors.length,
    total_amount_of_money: investors.reduce((sum, inv) => sum + (Number(inv.amount_of_money) || 0), 0),
    total_amount_of_coins: investors.reduce((sum, inv) => sum + (Number(inv.amount_of_coins) || 0), 0),
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCoins = (amount: string | number) => {
    if (!amount && amount !== 0) return '0';
    const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numericValue) ? '0' : new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />

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

        {/* Gradient Summary Cards */}
        <div className="mb-8">
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
            {/* Total Investors Card */}
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-8 shadow-lg dark:from-blue-600 dark:to-blue-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-100">
                    Total Investors
                  </div>
                  <div className="mt-3 text-4xl font-bold text-white">
                    {stats.total_investors}
                  </div>
                  <div className="mt-4 text-sm text-blue-100">
                    Active participants in the platform
                  </div>
                </div>
                <div className="rounded-full bg-white/20 p-4">
                  <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
    
            {/* Total Money Card */}
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-8 shadow-lg dark:from-green-600 dark:to-green-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-100">
                    Amount of Money
                  </div>
                  <div className="mt-3 text-4xl font-bold text-white">
                    {formatMoney(stats.total_amount_of_money)}
                  </div>
                  <div className="mt-4 text-sm text-green-100">
                    Total investment value
                  </div>
                </div>
                <div className="rounded-full bg-white/20 p-4">
                  <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
    
            {/* Total Coins Card */}
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-8 shadow-lg dark:from-purple-600 dark:to-purple-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-purple-100">
                    Amount of Coins
                  </div>
                  <div className="mt-3 text-4xl font-bold text-white">
                    {formatCoins(stats.total_amount_of_coins)}
                  </div>
                  <div className="mt-4 text-sm text-purple-100">
                    Platform tokens distributed
                  </div>
                </div>
                <div className="rounded-full bg-white/20 p-4">
                  <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Charts */}
        <DashboardCharts />

        {/* Investors Table Component */}
        <InvestorTable />

        {/* Contracts Table Component */}
        <ContractsTable />
        
        {/* Investment Requests Notification */}
        <InvestmentRequestsNotification 
          onRequestUpdate={() => {
            fetchInvestors();
          }}
        />

        {/* Investment Requests Table */}
        <InvestmentRequestsTable 
          title="Recent Investment Requests" 
          limit={10}
          className="mb-8 mt-8"
        />

        {/* Referrals Table */}
        <ReferralsTable 
          title="Recent Referrals" 
          limit={10}
          className="mb-8"
        />

      </main>
    </div>
  );
}
