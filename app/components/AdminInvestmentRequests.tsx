'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api';

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

interface AdminInvestmentRequestsProps {
  className?: string;
}

const AdminInvestmentRequests: React.FC<AdminInvestmentRequestsProps> = ({ className = '' }) => {
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<InvestmentRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [editingRequest, setEditingRequest] = useState<InvestmentRequest | null>(null);
  const [currentDiscount, setCurrentDiscount] = useState<string>('20');
  const [editForm, setEditForm] = useState({
    investment_amount: '',
    calculated_coins: '',
    discount_percentage: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected'
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      let url = '/api/investment-requests';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(getApiUrl(url));
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

  const fetchDiscount = async () => {
    try {
      const response = await fetch(getApiUrl('/api/settings'));
      const data = await response.json();
      
      if (data.success && data.data?.investment_discount?.value) {
        setCurrentDiscount(data.data.investment_discount.value);
      }
    } catch (err) {
      console.error('Error fetching discount:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchDiscount();
  }, [statusFilter]);

  const updateRequestStatus = async (requestId: number, newStatus: 'approved' | 'rejected') => {
    try {
      setActionLoading(requestId);
      
      const response = await fetch(getApiUrl(`/api/investment-requests/${requestId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequests(); // Refresh the list
        setSelectedRequest(null);
      } else {
        setError(data.error || `Failed to ${newStatus} request`);
      }
    } catch (err) {
      console.error(`Error updating request status:`, err);
      setError(`Failed to ${newStatus} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const updateRequestDetails = async (requestId: number) => {
    try {
      setActionLoading(requestId);
      
      const response = await fetch(getApiUrl(`/api/investment-requests/${requestId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          investment_amount: parseFloat(editForm.investment_amount),
          calculated_coins: parseFloat(editForm.calculated_coins),
          status: editForm.status
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequests();
        setEditingRequest(null);
        setEditForm({ investment_amount: '', calculated_coins: '', discount_percentage: '', status: 'pending' });
      } else {
        setError(data.error || 'Failed to update request');
      }
    } catch (err) {
      console.error('Error updating request:', err);
      setError('Failed to update request');
    } finally {
      setActionLoading(null);
    }
  };

  const updateDiscount = async () => {
    const confirmUpdate = window.confirm(
      `Are you sure you want to change the default discount to ${currentDiscount}%?\n\nThis will affect all new investment requests.`
    );

    if (!confirmUpdate) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/settings/investment_discount`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: currentDiscount })
      });

      const data = await response.json();

      if (data.success) {
        setError('');
        // Refresh requests to show updated discount
        await fetchRequests();
        alert('Discount updated successfully!');
      } else {
        setError(data.error || 'Failed to update discount');
      }
    } catch (err) {
      console.error('Error updating discount:', err);
      setError('Failed to update discount');
    }
  };

  const startEditing = (request: InvestmentRequest) => {
    setEditingRequest(request);
    setEditForm({
      investment_amount: request.investment_amount.toString(),
      calculated_coins: request.calculated_coins.toString(),
      discount_percentage: request.discount_percentage.toString(),
      status: request.status
    });
  };

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

  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Investment Requests Management</h2>
          <p className="text-gray-400">Review and manage investor investment requests</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Discount Configuration */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-400">Default Discount %:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={currentDiscount}
              onChange={(e) => setCurrentDiscount(e.target.value)}
              className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            />
            <button
              onClick={updateDiscount}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Update
            </button>
          </div>
          <button
            onClick={fetchRequests}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center space-x-4 mb-6">
        <span className="text-sm font-medium text-gray-400">Filter by status:</span>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-400">Loading investment requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No {statusFilter !== 'all' ? statusFilter : ''} requests found
          </h3>
          <p className="text-gray-500">
            {statusFilter !== 'all' 
              ? `There are no ${statusFilter} investment requests.`
              : 'No investment requests have been submitted yet.'
            }
          </p>
        </div>
      ) : (
        /* Requests List */
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
            >
              {editingRequest?.id === request.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Edit Request #{request.id}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateRequestDetails(request.id)}
                        disabled={actionLoading === request.id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {actionLoading === request.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingRequest(null);
                          setEditForm({ investment_amount: '', calculated_coins: '', discount_percentage: '', status: 'pending' });
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Investment Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.investment_amount}
                        onChange={(e) => setEditForm({ ...editForm, investment_amount: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Calculated Coins</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.calculated_coins}
                        onChange={(e) => setEditForm({ ...editForm, calculated_coins: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Discount % (Read-only)</label>
                      <input
                        type="number"
                        value={editForm.discount_percentage}
                        readOnly
                        className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-gray-300 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'pending' | 'approved' | 'rejected' })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">Request #{request.id}</h4>
                        <p className="text-gray-400">{request.investor_name}</p>
                        <p className="text-sm text-gray-500">{request.investor_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(request.status)}
                      <button
                        onClick={() => startEditing(request)}
                        className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
                        title="Edit Request"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
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
                      <p className="text-green-400 font-medium">{request.discount_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Submitted</p>
                      <p className="text-white font-medium">{formatDate(request.created_at)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.status === 'pending' && (
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
                      <button
                        onClick={() => updateRequestStatus(request.id, 'approved')}
                        disabled={actionLoading === request.id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        {actionLoading === request.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => updateRequestStatus(request.id, 'rejected')}
                        disabled={actionLoading === request.id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        {actionLoading === request.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        Reject
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{requests.length}</p>
            <p className="text-sm text-gray-400">Total Requests</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">{requests.filter(r => r.status === 'pending').length}</p>
            <p className="text-sm text-gray-400">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{requests.filter(r => r.status === 'approved').length}</p>
            <p className="text-sm text-gray-400">Approved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{requests.filter(r => r.status === 'rejected').length}</p>
            <p className="text-sm text-gray-400">Rejected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvestmentRequests;