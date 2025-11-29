'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/app/lib/auth';
import { getApiUrl } from '@/app/lib/api';

interface AddInvestmentProps {
  onSuccess?: () => void;
}

export default function AddInvestment({ onSuccess }: AddInvestmentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRate, setCurrentRate] = useState('0.00000');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [calculatedCoins, setCalculatedCoins] = useState(0);
  const [discountedCoins, setDiscountedCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isModalOpen) {
      fetchCurrentRate();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (investmentAmount && currentRate) {
      const amount = parseFloat(investmentAmount);
      const rate = parseFloat(currentRate);
      
      if (amount > 0 && rate > 0) {
        const baseCoins = amount / rate;
        const discountCoins = baseCoins * 1.2; // 20% discount means 20% more coins
        
        setCalculatedCoins(baseCoins);
        setDiscountedCoins(discountCoins);
      } else {
        setCalculatedCoins(0);
        setDiscountedCoins(0);
      }
    }
  }, [investmentAmount, currentRate]);

  const fetchCurrentRate = async () => {
    try {
      const response = await fetch(getApiUrl('/api/settings'));
      const data = await response.json();
      
      if (data.success && data.data.current_rate) {
        setCurrentRate(data.data.current_rate.value);
      }
    } catch (error) {
      console.error('Error fetching current rate:', error);
    }
  };

  const formatCurrency = (value: string | number) => {
    if (!value && value !== 0) return '$0';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numericValue) ? '$0' : `$${numericValue.toLocaleString('en-US', {
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

  const formatCoinRate = (value: string | number) => {
    if (!value && value !== 0) return '0.00000';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numericValue) ? '0.00000' : numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 5
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }

    if (parseFloat(investmentAmount) < 100) {
      setError('Minimum investment amount is $100');
      return;
    }

    try {
      setLoading(true);
      const investorId = getUserId();
      
      const response = await fetch(getApiUrl('/api/investment-requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          investor_id: investorId,
          investment_amount: parseFloat(investmentAmount),
          current_rate: parseFloat(currentRate),
          discounted_rate: parseFloat(currentRate) * 0.8, // 20% discount on rate
          expected_coins: Math.round(discountedCoins),
          status: 'pending'
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit investment request');
      }

      setSuccess('Investment request submitted successfully! An administrator will review your request shortly.');
      setInvestmentAmount('');
      setCalculatedCoins(0);
      setDiscountedCoins(0);
      
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess('');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit investment request');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setInvestmentAmount('');
    setError('');
    setSuccess('');
    setCalculatedCoins(0);
    setDiscountedCoins(0);
  };

  return (
    <>
      {/* Add Investment Button */}
      <button
        onClick={openModal}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Investment
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-[#111111] border border-gray-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Add Investment</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Rate Display */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Current Rate (per coin)
                </label>
                <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3">
                  <p className="text-white font-semibold">${formatCoinRate(currentRate)}</p>
                </div>
              </div>

              {/* Investment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Investment Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    placeholder="1000.00"
                    min="100"
                    step="0.01"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum investment: $100</p>
              </div>

              {/* Calculation Display */}
              {investmentAmount && parseFloat(investmentAmount) > 0 && (
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Regular coins:</span>
                    <span className="text-white font-medium">{formatCoins(calculatedCoins)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 text-sm font-medium">With 20% investor discount:</span>
                    <span className="text-green-400 font-bold">{formatCoins(discountedCoins)}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">You save:</span>
                      <span className="text-green-400 font-medium">+{formatCoins(discountedCoins - calculatedCoins)} coins</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-400 text-xs">
                  <strong>Special Investor Discount:</strong> As an investor, you receive 20% more coins than the standard rate. 
                  Your request will be reviewed by our team and processed within 24-48 hours.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !investmentAmount || parseFloat(investmentAmount) < 100}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}