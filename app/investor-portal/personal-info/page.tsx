'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/app/lib/auth';
import { getApiUrl } from '@/app/lib/api';
import Link from 'next/link';

interface Investor {
  id: number;
  full_name: string;
  last_name: string;
  email: string;
  phone: string;
  amount_of_money: number;
  amount_of_coins: number;
  investment_date: string;
  status: string;
  payment?: string;
  notes: string;
}

export default function PersonalInfoPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchInvestorData();
    }
  }, [isMounted]);

  const fetchInvestorData = async () => {
    try {
      const investorId = getUserId();
      if (!investorId) {
        setError('Unable to identify investor');
        setLoading(false);
        return;
      }

      const response = await fetch(getApiUrl(`/api/investors/${investorId}`));
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch investor data');
      }

      setInvestor(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your information');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const investorId = getUserId();
      const response = await fetch(getApiUrl(`/api/investors/${investorId}/change-password`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-white mx-auto"></div>
          <div className="text-gray-400 mt-4">Loading your information...</div>
        </div>
      </div>
    );
  }

  if (error || !investor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-400 mb-2">{error || 'Unable to load investor information'}</div>
          <button 
            onClick={fetchInvestorData}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Personal Information</h1>
        <Link 
          href="/investor-portal"
          className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Personal Information */}
      <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">{investor.full_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">{investor.last_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">{investor.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">{investor.phone}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Investment Date</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
              {investor.investment_date ? new Date(investor.investment_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                investor.status === 'Signed'
                  ? 'bg-blue-500/20 text-blue-400'
                  : investor.status === 'Pending'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {investor.status}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Amount of Money</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
              <span className="text-green-400 font-semibold">
                ${Number(investor.amount_of_money || 0).toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
              <span className="text-gray-500 text-sm ml-2">(Paid contracts only)</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Amount of Coins</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
              <span className="text-blue-400 font-semibold">
                {Number(investor.amount_of_coins || 0).toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
              <span className="text-gray-500 text-sm ml-2">TSE Coins</span>
            </p>
          </div>
        </div>

        {investor.notes && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg whitespace-pre-wrap">
              {investor.notes}
            </p>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Security Settings
        </h2>

        {passwordSuccess && (
          <div className="mb-4 p-4 bg-green-600/20 border border-green-600/30 rounded-lg text-green-400">
            {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-4 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400">
            {passwordError}
          </div>
        )}

        {!showPasswordForm ? (
          <div>
            <p className="text-gray-400 mb-4">Keep your account secure by regularly updating your password.</p>
            <button
              onClick={() => setShowPasswordForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Change Password
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <p className="text-gray-500 text-sm mt-1">Minimum 6 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
              >
                {passwordLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Changing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Change Password
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Help Section 
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-white font-semibold mb-1">Need to Update Your Information?</h3>
            <p className="text-gray-300 text-sm mb-2">
              If you need to update your personal information or have any questions, please contact our support team.
            </p>
            <a href="mailto:support@thesportexchange.com" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              support@thesportexchange.com
            </a>
          </div>
        </div>
      </div>*/}
    </div>
  );
}