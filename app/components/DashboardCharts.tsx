"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getApiUrl } from "../lib/api";

interface Investor {
  status: string;
  amount_of_money: number;
  amount_of_coins: number;
}

export function DashboardCharts() {
  const [isMounted, setIsMounted] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    fetchInvestors();
  }, []);

  const fetchInvestors = async () => {
    try {
      const response = await fetch(getApiUrl('/api/investors'));
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

  const formatCoins = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate status distribution from investors
  const statusCounts = investors.reduce((acc, investor) => {
    acc[investor.status] = (acc[investor.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Pie chart data for investor status
  const pieData = [
    { name: "Paid", value: statusCounts["Paid"] || 0, color: "#10b981" },
    { name: "Signed", value: statusCounts["Signed"] || 0, color: "#3b82f6" },
    { name: "Pending", value: statusCounts["Pending"] || 0, color: "#f59e0b" },
    { name: "Cancelled", value: statusCounts["Cancelled"] || 0, color: "#ef4444" },
  ].filter(item => item.value > 0);

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
          <div className="rounded-xl bg-gray-200 p-8 shadow-lg animate-pulse h-40"></div>
          <div className="rounded-xl bg-gray-200 p-8 shadow-lg animate-pulse h-40"></div>
          <div className="rounded-xl bg-gray-200 p-8 shadow-lg animate-pulse h-40"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Gradient Summary Cards */}
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

      {/* Investor Status Distribution Pie Chart */}
      <div className="rounded-xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
        <h3 className="mb-6 text-2xl font-bold dark:text-white">
          Investor Status Overview
        </h3>
        {isMounted ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number, name: string) => [
                  `${value} investor${value !== 1 ? 's' : ''}`,
                  name
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[350px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
          </div>
        )}
      </div>
    </div>
  );
}

