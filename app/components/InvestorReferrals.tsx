'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/app/lib/api';

interface Referral {
  id: number;
  referee_name: string;
  referee_email: string;
  investment_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  commission_amount: number;
  commission_paid: boolean;
  created_at: string;
  updated_at: string;
}

interface InvestorReferralsProps {
  investorId: number;
  className?: string;
}

export default function InvestorReferrals({ investorId, className = '' }: InvestorReferralsProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState<number>(5);
  const [loading, setLoading] = useState(true);

  const fetchDiscountPercentage = async () => {
    try {
      const response = await fetch(getApiUrl('/api/settings/referral-discount'));
      const data = await response.json();
      if (data.success) {
        setDiscountPercentage(data.data.percentage);
      }
    } catch (err) {
      console.error('Failed to fetch discount percentage:', err);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/referrals/investor/${investorId}/list`));
      const data = await response.json();

      if (data.success) {
        setReferrals(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
    fetchDiscountPercentage();
  }, [investorId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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

  const getStatusBadge = (status: string, commissionPaid: boolean) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending Review' },
      approved: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Approved' },
      paid: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Investment Completed' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Declined' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <div className="flex flex-col items-end">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
          {config.label}
        </span>
        {status === 'paid' && commissionPaid && (
          <span className="text-xs text-green-400 mt-1">Commission Received</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-purple-600/10 to-purple-800/10 border border-purple-500/20 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-purple-600/10 to-purple-800/10 border border-purple-500/20 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          My Referrals ({referrals.length})
        </h3>
        <div className="text-sm text-purple-300">
          Track your referred investors
        </div>
      </div>

      {referrals.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm mb-2">No referrals yet</p>
          <p className="text-xs text-gray-500">Share your referral link to start earning commissions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="bg-[#111111] border border-purple-500/20 rounded-lg p-4 hover:border-purple-400/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {referral.referee_name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {referral.referee_email}
                      </div>
                    </div>
                    {getStatusBadge(referral.status, referral.commission_paid)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Investment Interest:</span>
                      <div className="font-semibold text-white">{formatCurrency(referral.investment_amount)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Your Commission ({discountPercentage}%):</span>
                      <div className={`font-semibold ${referral.commission_paid ? 'text-green-400' : 'text-purple-400'}`}>
                        {formatCurrency(referral.commission_amount)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Submitted: {formatDate(referral.created_at)}
                    {referral.status !== 'pending' && referral.updated_at !== referral.created_at && (
                      <span> • Updated: {formatDate(referral.updated_at)}</span>
                    )}
                  </div>

                  {/* Status Description */}
                  <div className="mt-2 text-xs">
                    {referral.status === 'pending' && (
                      <p className="text-yellow-400">
                        ⏳ This person is interested to invest {formatCurrency(referral.investment_amount)} and this is pending admin approval.
                      </p>
                    )}
                    {referral.status === 'approved' && (
                      <p className="text-blue-400">
                        ✅ Investment approved! Commission will be paid when they complete their payment.
                      </p>
                    )}
                    {referral.status === 'paid' && (
                      <p className="text-green-400">
                        💰 Investment completed! {referral.commission_paid ? 'Commission has been added to your account.' : 'Commission processing...'}
                      </p>
                    )}
                    {referral.status === 'rejected' && (
                      <p className="text-red-400">
                        ❌ Investment application was declined by admin.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {referrals.length > 0 && (
        <div className="mt-6 pt-4 border-t border-purple-500/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-purple-400">{referrals.length}</div>
              <div className="text-xs text-gray-400">Total Referrals</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">
                {referrals.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">
                {referrals.filter(r => r.status === 'paid').length}
              </div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {formatCurrency(referrals.filter(r => r.commission_paid).reduce((sum, r) => sum + r.commission_amount, 0))}
              </div>
              <div className="text-xs text-gray-400">Earned</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}