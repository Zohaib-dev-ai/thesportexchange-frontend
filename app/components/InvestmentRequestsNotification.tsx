'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/app/lib/api';
import { getAuthToken } from '@/app/lib/auth';

interface InvestmentRequest {
  id: number;
  investor_id: number;
  investor_name: string;
  investor_email: string;
  investment_amount: number;
  current_rate: number;
  calculated_coins: number;
  discount_percentage: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface InvestmentRequestsNotificationProps {
  onRequestUpdate?: () => void;
}

export default function InvestmentRequestsNotification({ onRequestUpdate }: InvestmentRequestsNotificationProps) {
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCoins = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchRequests = async () => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('/api/investment-requests?status=pending'), {
        headers,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching investment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestAction = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      setProcessing(requestId);
      
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`/api/investment-requests/${requestId}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove the processed request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        onRequestUpdate?.();
      }
    } catch (error) {
      console.error('Error updating investment request:', error);
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = requests.length;
  const displayedRequests = showAll ? requests : requests.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2c32] p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (pendingCount === 0) {
    return (
      <div className="mt-8 bg-[#1a1a1a] rounded-lg border border-[#2a2c32] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Investment Requests</h3>
          <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs">
            0 Pending
          </div>
        </div>
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No pending investment requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2c32] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Investment Requests</h3>
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {pendingCount} Pending
          </div>
          <a
            href="/dashboard/investment-requests"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium underline"
          >
            View All
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {displayedRequests.map((request) => (
          <div
            key={request.id}
            className="bg-[#111111] border border-[#2a2c32] rounded-lg p-4 hover:border-blue-500/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-sm font-medium text-white truncate">
                    {request.investor_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(request.created_at)}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  {request.investor_email}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Investment:</span>
                    <div className="font-semibold text-white">{formatCurrency(request.investment_amount)}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Rate:</span>
                    <div className="font-semibold text-white">${request.current_rate}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Coins (with {request.discount_percentage}% bonus):</span>
                    <div className="font-semibold text-green-400">{formatCoins(request.calculated_coins)}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Discount:</span>
                    <div className="font-semibold text-orange-400">{request.discount_percentage}%</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleRequestAction(request.id, 'approved')}
                  disabled={processing === request.id}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                >
                  {processing === request.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleRequestAction(request.id, 'rejected')}
                  disabled={processing === request.id}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                >
                  {processing === request.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pendingCount > 3 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium mr-4"
          >
            {showAll ? 'Show Less' : `Show All ${pendingCount} Requests`}
          </button>
          <a
            href="/dashboard/investment-requests"
            className="text-green-400 hover:text-green-300 text-sm font-medium underline"
          >
            Manage All Requests
          </a>
        </div>
      )}
    </div>
  );
}