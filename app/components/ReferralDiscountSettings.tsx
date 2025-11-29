"use client";

import { useState, useEffect } from "react";
import { getApiUrl } from "../lib/api";

export default function ReferralDiscountSettings() {
  const [discountPercentage, setDiscountPercentage] = useState<number>(5);
  const [newPercentage, setNewPercentage] = useState<string>("5");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDiscountPercentage();
  }, []);

  const fetchDiscountPercentage = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/settings/referral-discount'));
      const data = await response.json();

      if (data.success) {
        setDiscountPercentage(data.data.percentage);
        setNewPercentage(data.data.percentage.toString());
      }
    } catch (err) {
      console.error('Failed to fetch referral discount:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const percentage = parseFloat(newPercentage);

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setError("Please enter a valid percentage between 0 and 100");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(getApiUrl('/api/settings/referral-discount'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          percentage: percentage,
          updated_by: null, // You can pass admin user ID here if needed
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update referral discount');
      }

      setDiscountPercentage(percentage);
      setSuccess(`Referral discount updated to ${percentage}%`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update referral discount');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-200 rounded w-1/3 mb-4 dark:bg-zinc-700"></div>
          <div className="h-4 bg-zinc-200 rounded w-2/3 dark:bg-zinc-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">Referral Discount Settings</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage the commission percentage for referral program
          </p>
        </div>
        <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
          <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Current Discount Display */}
      <div className="mb-6 rounded-lg bg-purple-50 p-4 dark:bg-purple-900/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Current Referral Commission</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {discountPercentage}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">This applies to</p>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">All Referrals</p>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="percentage" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            New Commission Percentage
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                id="percentage"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="block w-full rounded-lg border border-zinc-200 px-4 py-3 pr-12 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                placeholder="5.0"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-zinc-500 dark:text-zinc-400 font-semibold">%</span>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || newPercentage === discountPercentage.toString()}
              className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Enter a value between 0 and 100. This will update the commission rate across the entire platform.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
            ✓ {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/10">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">How it affects the platform:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Investor portal will show the new percentage</li>
                <li>Admin referral management will calculate commissions with new rate</li>
                <li>New referrals will use the updated commission rate</li>
                <li>Existing pending referrals will use the new rate when calculated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
