"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "../lib/api";
import { getAuthToken } from "../lib/auth";

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

interface InvestmentRequestsTableProps {
  title?: string;
  investorId?: number;
  showActions?: boolean;
  limit?: number;
  className?: string;
}

export default function InvestmentRequestsTable({
  title = "Investment Requests",
  investorId,
  showActions = true,
  limit,
  className = ""
}: InvestmentRequestsTableProps) {
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInvestmentRequests();
  }, [investorId]);

  const fetchInvestmentRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (investorId) {
        params.append('investor_id', investorId.toString());
      }

      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`/api/investment-requests?${params.toString()}`), {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        let fetchedRequests = data.data;
        
        // Apply limit if specified
        if (limit && limit > 0) {
          fetchedRequests = fetchedRequests.slice(0, limit);
        }
        
        setRequests(fetchedRequests);
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

  const handleStatusUpdate = async (requestId: number, newStatus: 'approved' | 'rejected') => {
    try {
      setProcessingId(requestId);
      
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
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the local state
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: newStatus } : req
        ));
      } else {
        setError(data.error || 'Failed to update status');
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update request status');
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    const numAmount = Number(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(isNaN(numAmount) ? 0 : numAmount);
  };

  const formatCoins = (amount: number) => {
    const numAmount = Number(amount);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(isNaN(numAmount) ? 0 : numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRate = (rate: string | number) => {
    const numRate = Number(rate);
    return isNaN(numRate) ? '0.00000' : numRate.toFixed(5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl border border-zinc-200 p-6 shadow-sm dark:bg-zinc-800 ${className}`}>
        <h2 className="mb-6 text-xl font-bold dark:text-white">{title}</h2>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-zinc-200 p-6 shadow-sm dark:bg-zinc-800 ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-white">
          {title} ({requests.length})
        </h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {requests.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Request ID
                </th>
                {!investorId && (
                  <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    Investor
                  </th>
                )}
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Amount
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Coins
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Rate
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Status
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-700/50">
                  <td className="py-4 text-sm dark:text-white">
                    #{request.id}
                  </td>
                  {!investorId && (
                    <td className="py-4 text-sm">
                      <div>
                        <div className="font-medium dark:text-white">{request.investor_name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{request.investor_email}</div>
                      </div>
                    </td>
                  )}
                  <td className="py-4 text-sm font-medium dark:text-white">
                    {formatCurrency(request.investment_amount)}
                  </td>
                  <td className="py-4 text-sm font-medium dark:text-white">
                    {formatCoins(request.calculated_coins)}
                  </td>
                  <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatRate(request.current_rate)}
                    {request.discount_percentage > 0 && (
                      <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                        (-{request.discount_percentage}%)
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(request.created_at)}
                  </td>
                  {/* {showActions && (
                    <td className="py-4">
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'approved')}
                            disabled={processingId === request.id}
                            className="inline-flex items-center rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {processingId === request.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            disabled={processingId === request.id}
                            className="inline-flex items-center rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {processingId === request.id ? '...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </td>
                  )} */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
          <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="mt-2">No investment requests found.</p>
          {investorId && (
            <p className="text-xs">This investor hasn't submitted any investment requests yet.</p>
          )}
        </div>
      )}
    </div>
  );
}