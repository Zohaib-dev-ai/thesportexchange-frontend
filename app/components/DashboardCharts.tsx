"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getApiUrl } from "../lib/api";

interface Settings {
  coin_value: {
    value: string;
  };
  current_rate: {
    value: string;
  };
}

export function DashboardCharts() {
  const [isMounted, setIsMounted] = useState(false);
  const [usedCoins, setUsedCoins] = useState(0);
  const [totalCoins, setTotalCoins] = useState(8800000); // Default 8.8 million
  const [currentRate, setCurrentRate] = useState('0.0000'); // Current exchange rate
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    fetchSettings();
    fetchCoinData();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(getApiUrl('/api/settings'));
      const data = await response.json();
      
      if (data.success && data.data && data.data.coin_value) {
        // Parse "8.8 million" to number
        const coinValueStr = data.data.coin_value.value.toLowerCase();
        
        if (coinValueStr.includes('million')) {
          const num = parseFloat(coinValueStr);
          const totalCoinsValue = num * 1000000;
          setTotalCoins(totalCoinsValue);
        } else {
          const totalCoinsValue = parseFloat(coinValueStr) || 8800000;
          setTotalCoins(totalCoinsValue);
        }
      }
      
      if (data.success && data.data && data.data.current_rate) {
        setCurrentRate(data.data.current_rate.value);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchCoinData = async () => {
    try {
      const response = await fetch(getApiUrl('/api/investors'));
      const data = await response.json();
      
      if (data.success) {
        const totalUsed = data.data.reduce((sum: number, inv: any) => {
          const coins = Number(inv.amount_of_coins) || 0;
          return sum + coins;
        }, 0);
        setUsedCoins(totalUsed);
      }
    } catch (error) {
      console.error('Error fetching coin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCoins = (amount: string | number) => {
    if (!amount && amount !== 0) return '0';
    const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numericValue) ? '0' : new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  // Calculate coin distribution
  const unusedCoins = Math.max(0, totalCoins - usedCoins);
  const isOverAllocated = usedCoins > totalCoins;
  
  const coinDistributionData = [
    { name: "Used Coins", value: usedCoins, color: "#10b981" },
    { name: "Unused Coins", value: unusedCoins, color: "#6b7280" },
  ];

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="rounded-xl bg-gray-200 p-6 shadow-lg animate-pulse h-96"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Investor Status Distribution Pie Chart */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-1">
        {/* Investor Status Overview - 6 columns
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
                    backgroundColor: '#fff', 
                    border: '1px solid #fff', 
                    borderRadius: '8px',
                    color: '#1f2937'
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
        </div>*/}

        {/* Coin Distribution Chart - 6 columns */}
        <div className="rounded-xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="mb-6 text-2xl font-bold dark:text-white">
              Coin Distribution
            </h3>
            <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Total coins: <span className="font-bold text-purple-600 dark:text-purple-400">{formatCoins(totalCoins)}</span>
            </div>
          </div>
          
          {/* Chart and Stats Side by Side */}
          <div className="flex gap-6 sm-block">
            {/* Chart on Left */}
            <div className="flex-1">
              {isMounted ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={coinDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => `${name}: ${formatCoins(value)}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {coinDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #fff', 
                        borderRadius: '8px',
                        color: '#1f2937'
                      }}
                      formatter={(value: number, name: string) => [
                        `${formatCoins(value)} coins`,
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
            
            {/* Stats on Right */}
            <div className="w-80 flex flex-col gap-4">
              <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/20">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">Used by Investors</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {formatCoins(usedCoins)}
                </div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                  {((usedCoins / totalCoins) * 100).toFixed(1)}% of total
                </div>
              </div>
              <div className="rounded-lg bg-gray-500/10 p-4 border border-gray-500/20">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {isOverAllocated ? 'Over-allocated' : 'Unused Coins'}
                </div>
                <div className={`text-2xl font-bold mt-1 ${isOverAllocated ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {isOverAllocated ? `+${formatCoins(usedCoins - totalCoins)}` : formatCoins(unusedCoins)}
                </div>
                <div className="text-xs text-gray-600/70 dark:text-gray-400/70 mt-1">
                  {isOverAllocated 
                    ? `${((usedCoins - totalCoins) / totalCoins * 100).toFixed(1)}% over limit`
                    : `${totalCoins > 0 ? ((unusedCoins / totalCoins) * 100).toFixed(1) : '0.0'}% available`
                  }
                </div>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Current Rate</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  ${currentRate}
                </div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                  Exchange rate per coin
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

