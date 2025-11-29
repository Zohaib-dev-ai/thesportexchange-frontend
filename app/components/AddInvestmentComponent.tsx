'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/app/lib/auth';
import { getApiUrl } from '@/app/lib/api';

interface AddInvestmentProps {
  currentRate: string;
  onRequestSubmitted: () => void;
  onInvestmentRequestSubmitted?: () => void;
}

interface CoinAvailability {
  total_coin_limit: number;
  currently_used_coins: number;
  available_coins: number;
  utilization_percentage: number;
  is_available: boolean;
  is_nearly_full: boolean;
}

export default function AddInvestmentComponent({ currentRate, onRequestSubmitted, onInvestmentRequestSubmitted }: AddInvestmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [calculatedCoins, setCalculatedCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [coinAvailability, setCoinAvailability] = useState<CoinAvailability | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(20);

  // Fetch discount percentage from settings
  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const response = await fetch(getApiUrl('/api/settings'));
        const data = await response.json();
        
        if (data.success && data.data?.investment_discount?.value) {
          setDiscountPercentage(parseInt(data.data.investment_discount.value));
        }
      } catch (err) {
        console.error('Error fetching discount:', err);
      }
    };
    
    fetchDiscount();
  }, []);

  // Calculate coins with dynamic discount
  useEffect(() => {
    if (investmentAmount && currentRate) {
      const amount = parseFloat(investmentAmount);
      const rate = parseFloat(currentRate);
      
      if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
        // Base coins without discount
        const baseCoins = amount / rate;
        // Add bonus coins based on discount percentage
        const bonusCoins = baseCoins * (discountPercentage / 100);
        const totalCoins = baseCoins + bonusCoins;
        setCalculatedCoins(totalCoins);
      } else {
        setCalculatedCoins(0);
      }
    } else {
      setCalculatedCoins(0);
    }
  }, [investmentAmount, currentRate, discountPercentage]);

  const fetchCoinAvailability = async () => {
    try {
      setCheckingAvailability(true);
      const response = await fetch(getApiUrl('/api/investment-requests?availability=true'));
      const data = await response.json();
      
      if (data.success) {
        setCoinAvailability(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch coin availability:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Check coin availability when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCoinAvailability();
    }
  }, [isOpen]);

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const numericValue = parseFloat(value.replace(/,/g, ''));
    return isNaN(numericValue) ? value : numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const formatCoins = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }

    if (parseFloat(investmentAmount) < 25000) {
      setError('Minimum investment amount is $25,000');
      return;
    }

    // Check if coins are available
    if (!coinAvailability?.is_available) {
      setError('No coins are currently available for new investments');
      return;
    }

    // Check if requested coins exceed available
    if (calculatedCoins > coinAvailability.available_coins) {
      setError(`Requested ${formatCoins(calculatedCoins)} coins exceeds available ${formatCoins(coinAvailability.available_coins)} coins`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const investorId = getUserId();
      if (!investorId) {
        setError('Unable to identify investor');
        return;
      }

      const response = await fetch(getApiUrl('/api/investment-requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          investor_id: investorId,
          investment_amount: parseFloat(investmentAmount),
          current_rate: parseFloat(currentRate),
          calculated_coins: calculatedCoins,
          discount_percentage: discountPercentage,
          status: 'pending'
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit investment request');
      }

      setSuccessMessage('Investment request submitted successfully! The admin will review your request.');
      setInvestmentAmount('');
      setCalculatedCoins(0);
      onRequestSubmitted();
      
      // Call the investment requests refresh callback
      if (onInvestmentRequestSubmitted) {
        onInvestmentRequestSubmitted();
      }
      
      // Refresh coin availability after successful submission
      await fetchCoinAvailability();
      
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMessage('');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    setInvestmentAmount(formattedValue);
  };

  return (
    <>
      {/* Add Investment Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Investment
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-[#111111] border border-gray-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Add Investment</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Coin Availability Status */}
              {checkingAvailability ? (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-sm text-blue-400">Checking coin availability...</span>
                  </div>
                </div>
              ) : coinAvailability && (
                <div className={`rounded-lg p-4 border ${
                  !coinAvailability.is_available 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : coinAvailability.is_nearly_full 
                      ? 'bg-yellow-500/10 border-yellow-500/30' 
                      : 'bg-green-500/10 border-green-500/30'
                }`}>
                  <div className="text-sm font-medium mb-2">
                    <span className={`${
                      !coinAvailability.is_available 
                        ? 'text-red-400' 
                        : coinAvailability.is_nearly_full 
                          ? 'text-yellow-400' 
                          : 'text-green-400'
                    }`}>
                      Coin Availability
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Available:</span>
                      <span className="text-white font-medium">{formatCoins(coinAvailability.available_coins)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Used:</span>
                      <span className="text-white font-medium">{formatCoins(coinAvailability.currently_used_coins)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Limit:</span>
                      <span className="text-white font-medium">{formatCoins(coinAvailability.total_coin_limit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Utilization:</span>
                      <span className="text-white font-medium">{coinAvailability.utilization_percentage}%</span>
                    </div>
                  </div>
                  {!coinAvailability.is_available && (
                    <div className="mt-2 text-xs text-red-400">
                      ⚠️ No coins available for new investments
                    </div>
                  )}
                  {coinAvailability.is_nearly_full && coinAvailability.is_available && (
                    <div className="mt-2 text-xs text-yellow-400">
                      ⚠️ Coin limit is nearly reached
                    </div>
                  )}
                </div>
              )}

              {/* Current Rate Display */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="text-sm text-blue-400 mb-1">Current Rate</div>
                <div className="text-xl font-bold text-white">${currentRate}</div>
                <div className="text-xs text-blue-300">per coin</div>
              </div>

              {/* Investment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Investment Amount ($) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-400">$</span>
                  </div>
                  <input
                    type="text"
                    value={formatCurrency(investmentAmount)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[$,]/g, '');
                      handleInputChange(rawValue);
                    }}
                    className="w-full bg-[#1a1a1a] border border-gray-600 rounded-lg pl-8 pr-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25,000.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum investment amount is $25,000</p>
              </div>

              {/* Calculated Coins with Discount */}
              {(calculatedCoins as number) > 0 && (
                <div className={`rounded-lg p-4 border ${
                  coinAvailability && calculatedCoins > coinAvailability.available_coins
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-green-500/10 border-green-500/30'
                }`}>
                  <div className={`text-sm mb-1 ${
                    coinAvailability && calculatedCoins > coinAvailability.available_coins
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}>
                    You'll Receive (with {discountPercentage}% bonus)
                    {coinAvailability && calculatedCoins > coinAvailability.available_coins && (
                      <span className="text-red-400"> - EXCEEDS LIMIT</span>
                    )}
                  </div>
                  <div className={`text-xl font-bold ${
                    coinAvailability && calculatedCoins > coinAvailability.available_coins
                      ? 'text-red-300'
                      : 'text-white'
                  }`}>
                    {formatCoins(calculatedCoins)}
                  </div>
                  <div className={`text-xs mt-1 ${
                    coinAvailability && calculatedCoins > coinAvailability.available_coins
                      ? 'text-red-300'
                      : 'text-green-300'
                  }`}>
                    TSE Coins
                  </div>
                  <div className={`text-xs mt-2 ${
                    coinAvailability && calculatedCoins > coinAvailability.available_coins
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}>
                    Base: {formatCoins(calculatedCoins / (1 + discountPercentage/100))} + Bonus: {formatCoins(calculatedCoins * (discountPercentage/100) / (1 + discountPercentage/100))} ({discountPercentage}% discount)
                  </div>
                  {coinAvailability && calculatedCoins > coinAvailability.available_coins && (
                    <div className="text-xs text-red-400 mt-2">
                      ⚠️ Requested coins exceed available supply by {formatCoins(calculatedCoins - coinAvailability.available_coins)}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={
                    loading || 
                    !investmentAmount || 
                    !coinAvailability?.is_available || 
                    (coinAvailability && calculatedCoins > coinAvailability.available_coins)
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Submitting...' : 
                   !coinAvailability?.is_available ? 'No Coins Available' :
                   (coinAvailability && calculatedCoins > coinAvailability.available_coins) ? 'Exceeds Limit' :
                   'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Info Text */}
              <div className="text-xs text-gray-400 text-center mt-4">
                Your investment request will be reviewed by the admin. You'll receive {discountPercentage}% bonus coins as a discount.
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}