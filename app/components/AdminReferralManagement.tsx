'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';

interface Referral {
  id: number;
  referrer_id: number;
  referral_code: string;
  referee_name: string;
  referee_email: string;
  referee_phone: string;
  investment_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  commission_amount: number;
  commission_paid: boolean;
  created_at: string;
  updated_at: string;
  referrer_name: string;
  referrer_email: string;
}

interface AdminReferralManagementProps {
  className?: string;
}

const AdminReferralManagement: React.FC<AdminReferralManagementProps> = ({ className = '' }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState<number>(5);
  const [currentDiscount, setCurrentDiscount] = useState<string>('5');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchDiscountPercentage();
  }, []);

  const fetchDiscountPercentage = async () => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl('/api/settings/referral-discount'), { headers });
      const data = await response.json();
      if (data.success) {
        setDiscountPercentage(data.data.percentage);
        setCurrentDiscount(data.data.percentage.toString());
      }
    } catch (err) {
      console.error('Failed to fetch discount percentage:', err);
    }
  };

  const updateDiscount = async () => {
    // Clear previous errors
    setError('');

    // Validate input before showing confirmation
    const trimmedValue = currentDiscount?.trim() || '';
    
    if (trimmedValue === '') {
      setError('Please enter a commission percentage');
      return;
    }

    const discountValue = parseFloat(trimmedValue);
    if (isNaN(discountValue)) {
      setError('Please enter a valid number');
      return;
    }

    if (discountValue < 0 || discountValue > 100) {
      setError('Commission must be between 0 and 100');
      return;
    }

    const confirmUpdate = window.confirm(
      `Are you sure you want to change the referral commission to ${discountValue}%?\n\nThis will affect all new referrals and update the commission rate across the entire platform.`
    );

    if (!confirmUpdate) {
      return;
    }

    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl('/api/settings/referral-discount'), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ percentage: discountValue })
      });

      const data = await response.json();

      if (data.success) {
        setError('');
        setDiscountPercentage(discountValue);
        setCurrentDiscount(discountValue.toString());
        await fetchReferrals();
        alert('Referral commission updated successfully!');
      } else {
        setError(data.error || 'Failed to update commission');
      }
    } catch (err) {
      console.error('Error updating commission:', err);
      setError('Failed to update commission');
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setError('');

      let url = '/api/referrals/admin';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(getApiUrl(url));
      const data = await response.json();

      if (data.success) {
        setReferrals(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch referrals');
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter]);

  const updateReferralStatus = async (referralId: number, newStatus: 'approved' | 'paid' | 'rejected') => {
    try {
      setActionLoading(referralId);
      
      const response = await fetch(getApiUrl(`/api/referrals/admin/${referralId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        await fetchReferrals(); // Refresh the list
      } else {
        setError(data.error || `Failed to ${newStatus} referral`);
      }
    } catch (err) {
      console.error(`Error updating referral status:`, err);
      setError(`Failed to ${newStatus} referral`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string, commissionPaid: boolean) => {
    const statusClasses = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
      <div className="flex items-center space-x-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
          statusClasses[status as keyof typeof statusClasses] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {status === 'paid' && commissionPaid && (
          <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">
            Commission Paid
          </span>
        )}
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  const filteredReferrals = referrals.filter(referral => {
    if (statusFilter === 'all') return true;
    return referral.status === statusFilter;
  });

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Referral Management</h2>
          <p className="text-gray-400">Review and manage investor referrals</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Discount Configuration */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-400">Commission %:</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
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
            onClick={fetchReferrals}
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
          {['all', 'pending', 'approved', 'paid', 'rejected'].map((status) => (
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
          <span className="text-gray-400">Loading referrals...</span>
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No {statusFilter !== 'all' ? statusFilter : ''} referrals found
          </h3>
          <p className="text-gray-500">
            {statusFilter !== 'all' 
              ? `There are no ${statusFilter} referrals.`
              : 'No referrals have been submitted yet.'
            }
          </p>
        </div>
      ) : (
        /* Referrals List */
        <div className="space-y-4">
          {filteredReferrals.map((referral) => (
            <div
              key={referral.id}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">Referral #{referral.id}</h4>
                    <p className="text-gray-400">{referral.referee_name}</p>
                    <p className="text-sm text-gray-500">{referral.referee_email}</p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(referral.status, referral.commission_paid)}
                </div>
              </div>

              {/* Referral Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Referred By</p>
                  <p className="text-white font-medium">{referral.referrer_name}</p>
                  <p className="text-xs text-gray-500">{referral.referrer_email}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Phone</p>
                  <p className="text-white font-medium">{referral.referee_phone}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Investment Amount</p>
                  <p className="text-white font-medium">{formatCurrency(referral.investment_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Commission ({discountPercentage}%)</p>
                  <p className="text-green-400 font-medium">{formatCurrency(referral.commission_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Referral Code</p>
                  <p className="text-purple-400 font-medium">{referral.referral_code}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Submitted</p>
                  <p className="text-white font-medium">{formatDate(referral.created_at)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {referral.status === 'pending' && (
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => updateReferralStatus(referral.id, 'approved')}
                    disabled={actionLoading === referral.id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    {actionLoading === referral.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => updateReferralStatus(referral.id, 'rejected')}
                    disabled={actionLoading === referral.id}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    {actionLoading === referral.id ? (
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

              {referral.status === 'approved' && (
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => updateReferralStatus(referral.id, 'paid')}
                    disabled={actionLoading === referral.id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    {actionLoading === referral.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    Mark as Paid (Pay Commission)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{referrals.length}</p>
            <p className="text-sm text-gray-400">Total Referrals</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">{referrals.filter(r => r.status === 'pending').length}</p>
            <p className="text-sm text-gray-400">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">{referrals.filter(r => r.status === 'paid').length}</p>
            <p className="text-sm text-gray-400">Paid</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">
              {formatCurrency(referrals.filter(r => r.commission_paid).reduce((sum, r) => sum + r.commission_amount, 0))}
            </p>
            <p className="text-sm text-gray-400">Total Commission Paid</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReferralManagement;