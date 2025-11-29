'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';
import AddInvestmentComponent from './AddInvestmentComponent';

interface InvestmentRequest {
  id: number;
  investment_amount: number;
  current_rate: number;
  calculated_coins: number;
  discount_percentage: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface InvestmentRequestsComponentProps {
  investorId: number;
  refreshTrigger?: number;
  currentRate: string;
}

const InvestmentRequestsComponent: React.FC<InvestmentRequestsComponentProps> = ({ investorId, refreshTrigger, currentRate }) => {
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchInvestmentRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        getApiUrl(`/api/investment-requests?investor_id=${investorId}`),
        { headers }
      );
      const data = await response.json();

      if (data.success) {
        setRequests(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch investment requests');
      }
    } catch (err) {
      console.error('Error fetching investment requests:', err);
      setError('Failed to load investment requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (investorId) {
      fetchInvestmentRequests();
    }
  }, [investorId]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && investorId) {
      fetchInvestmentRequests();
    }
  }, [refreshTrigger, investorId]);

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
        statusClasses[status as keyof typeof statusClasses] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      }`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatCoins = (coins: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(coins);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">My Investment Requests</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-400">Loading investment requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">My Investment Requests</h2>
        <button
          onClick={fetchInvestmentRequests}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* 20% Discount Banner - Always Visible */}
      <div className="bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 border border-green-500/40 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">🎉 20% Bonus Discount Active!</h3>
              <p className="text-sm text-green-300">
                Every investment request automatically includes 20% bonus coins at no extra cost
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">+20%</div>
            <div className="text-xs text-green-300">Extra Coins</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {requests.length === 0 && !loading && !error ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">Ready for Your Next Investment?</h3>
          <p className="text-gray-400 mb-4">You haven't submitted any investment requests yet.</p>
          
          {/* 20% Discount Highlight */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4 mb-4 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-lg font-semibold text-green-400">20% Bonus Discount</span>
            </div>
            <p className="text-sm text-gray-300">
              Get 20% more coins with every investment! Submit your investment request and receive bonus tokens.
            </p>
          </div>
          
          <AddInvestmentComponent
            currentRate={currentRate}
            onRequestSubmitted={fetchInvestmentRequests}
            onInvestmentRequestSubmitted={fetchInvestmentRequests}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Request #{request.id}</h4>
                    <p className="text-sm text-gray-400">
                      Submitted on {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Investment Amount</p>
                  <p className="text-white font-medium">{formatCurrency(request.investment_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Rate per Coin</p>
                  <p className="text-white font-medium">{formatCurrency(request.current_rate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Calculated Coins</p>
                  <p className="text-white font-medium">{formatCoins(request.calculated_coins)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Bonus Discount</p>
                  <p className="text-green-400 font-medium flex items-center">
                    {request.discount_percentage}%
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </p>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center text-xs text-yellow-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Awaiting admin review and approval
                  </div>
                </div>
              )}

              {request.status === 'approved' && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center text-xs text-green-400 mb-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Request approved - Contract will be generated
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-md p-2">
                    <p className="text-xs text-green-300 font-medium">
                      🎉 Congratulations! You received {request.discount_percentage}% bonus coins with this investment!
                    </p>
                  </div>
                </div>
              )}

              {request.status === 'rejected' && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center text-xs text-red-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Request was not approved
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvestmentRequestsComponent;