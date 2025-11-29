"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "../lib/api";

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
  referrer_name?: string;
  referrer_email?: string;
}

interface ReferralsTableProps {
  title?: string;
  investorId?: number;
  showActions?: boolean;
  limit?: number;
  className?: string;
}

export default function ReferralsTable({
  title = "Referrals",
  investorId,
  showActions = true,
  limit,
  className = ""
}: ReferralsTableProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, [investorId]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      
      let url = getApiUrl('/api/referrals/admin');
      
      if (investorId) {
        url = getApiUrl(`/api/referrals/investor/${investorId}/list`);
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let fetchedReferrals = data.data || [];
        
        // Apply limit if specified
        if (limit && limit > 0) {
          fetchedReferrals = fetchedReferrals.slice(0, limit);
        }
        
        setReferrals(fetchedReferrals);
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

  const handleStatusUpdate = async (referralId: number, newStatus: 'approved' | 'rejected' | 'paid') => {
    try {
      setProcessingId(referralId);
      
      const response = await fetch(getApiUrl(`/api/referrals/admin/${referralId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          commission_paid: newStatus === 'paid'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the local state
        setReferrals(prev => prev.map(ref => 
          ref.id === referralId 
            ? { 
                ...ref, 
                status: newStatus,
                commission_paid: newStatus === 'paid' 
              } 
            : ref
        ));
      } else {
        setError(data.error || 'Failed to update status');
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update referral status');
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
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
          {title} ({referrals.length})
        </h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {referrals.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  ID
                </th>
                {!investorId && (
                  <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    Referrer
                  </th>
                )}
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Referee
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Code
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Investment
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Commission
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
              {referrals.map((referral) => (
                <tr key={referral.id} className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-700/50">
                  <td className="py-4 text-sm dark:text-white">
                    #{referral.id}
                  </td>
                  {!investorId && (
                    <td className="py-4 text-sm">
                      <div>
                        <div className="font-medium dark:text-white">
                          {referral.referrer_name || `Investor #${referral.referrer_id}`}
                        </div>
                        {referral.referrer_email && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {referral.referrer_email}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="py-4 text-sm">
                    <div>
                      <div className="font-medium dark:text-white">{referral.referee_name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{referral.referee_email}</div>
                      {referral.referee_phone && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{referral.referee_phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                    {referral.referral_code}
                  </td>
                  <td className="py-4 text-sm font-medium dark:text-white">
                    {formatCurrency(referral.investment_amount)}
                  </td>
                  <td className="py-4 text-sm">
                    <div className="font-medium dark:text-white">
                      {formatCurrency(referral.commission_amount)}
                    </div>
                    {referral.commission_paid && (
                      <div className="text-xs text-green-600 dark:text-green-400">✓ Paid</div>
                    )}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(referral.status)}`}>
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(referral.created_at)}
                  </td>
                  {/*{showActions && (
                    <td className="py-4">
                      {referral.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(referral.id, 'approved')}
                            disabled={processingId === referral.id}
                            className="inline-flex items-center rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {processingId === referral.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(referral.id, 'rejected')}
                            disabled={processingId === referral.id}
                            className="inline-flex items-center rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {processingId === referral.id ? '...' : 'Reject'}
                          </button>
                        </div>
                      )}
                      {referral.status === 'approved' && !referral.commission_paid && (
                        <button
                          onClick={() => handleStatusUpdate(referral.id, 'paid')}
                          disabled={processingId === referral.id}
                          className="inline-flex items-center rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          title="This will pay commission and automatically create a contract"
                        >
                          {processingId === referral.id ? '...' : 'Pay & Create Contract'}
                        </button>
                      )}
                    </td>
                  )}*/}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
          <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="mt-2">No referrals found.</p>
          {investorId && (
            <p className="text-xs">This investor hasn't made any referrals yet.</p>
          )}
        </div>
      )}
    </div>
  );
}