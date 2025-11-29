'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getApiUrl } from '@/app/lib/api';

interface InvestmentRequest {
  id: number;
  investor_id: number;
  investment_amount: number;
  expected_coins: number;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminNotifications() {
  const [pendingRequests, setPendingRequests] = useState<InvestmentRequest[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
    
    // Set up polling to check for new requests every 30 seconds
    const interval = setInterval(fetchPendingRequests, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(getApiUrl('/api/investment-requests?status=pending'));
      const data = await response.json();
      
      if (data.success) {
        setPendingRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      
      const response = await fetch(getApiUrl(`/api/investment-requests/${requestId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Remove the request from pending list
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        
        // Show success message (optional)
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge */}
        {pendingRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-[#111111] border border-gray-800 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Investment Requests</h3>
              <p className="text-xs text-gray-400">{pendingRequests.length} pending approval</p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-3 border-b border-gray-800 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {request.first_name} {request.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{request.email}</p>
                    </div>
                    <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white ml-1">{formatCurrency(request.investment_amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Coins:</span>
                      <span className="text-green-400 ml-1">{formatCoins(request.expected_coins)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Submitted:</span>
                      <span className="text-white ml-1">{formatDate(request.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'approved')}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs py-1.5 px-3 rounded transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs py-1.5 px-3 rounded transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-800">
              <Link
                href="/dashboard/investment-requests"
                className="block w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                View All Requests
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}