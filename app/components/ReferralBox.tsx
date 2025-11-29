'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/app/lib/auth';
import { getApiUrl } from '@/app/lib/api';

interface ReferralStats {
  total_referrals: number;
  pending_referrals: number;
  paid_referrals: number;
  total_commission_earned: number;
}

interface ReferralBoxProps {
  className?: string;
}

export default function ReferralBox({ className = '' }: ReferralBoxProps) {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchReferralData();
    fetchDiscountPercentage();
  }, []);

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

  const fetchReferralData = async () => {
    try {
      const investorId = getUserId();
      if (!investorId) return;

      const response = await fetch(getApiUrl(`/api/referrals/investor/${investorId}`));
      const data = await response.json();

      if (data.success) {
        setReferralCode(data.data.referral_code);
        setReferralLink(`${window.location.origin}/referral/${data.data.referral_code}`);
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(referralLink);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setCopying(false);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Exclusive Investment Opportunity - The Sport Exchange');
    const body = encodeURIComponent(`Hi,

I wanted to share an exclusive investment opportunity with you. The Sport Exchange is offering a unique chance to invest in sports tokens.

Use my referral link to get started: ${referralLink}

Best regards`);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-purple-600/10 to-purple-800/10 border border-purple-500/20 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-10 bg-gray-700 rounded w-full"></div>
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
          Referral Program
        </h3>
        <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
          Earn {discountPercentage}% Commission
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{stats?.total_referrals || 0}</div>
          <div className="text-xs text-gray-400">Total Referrals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats?.pending_referrals || 0}</div>
          <div className="text-xs text-gray-400">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats?.paid_referrals || 0}</div>
          <div className="text-xs text-gray-400">Paid</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{formatCurrency(stats?.total_commission_earned || 0)}</div>
          <div className="text-xs text-gray-400">Commission Earned</div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-purple-300 mb-2">
            Your Referral Link
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-300 text-sm cursor-default"
            />
            <button
              onClick={copyReferralLink}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copying 
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {copying ? (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={shareViaEmail}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Share via Email
          </button>
          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this investment opportunity: ${referralLink}`)}`)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Share via WhatsApp
          </button>
        </div>

        {/* Info Text */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
          <p className="text-xs text-purple-300">
            💡 <strong>How it works:</strong> Share your referral link with friends and family. When they invest through your link, you'll earn a {discountPercentage}% commission on their investment amount once their payment is confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}