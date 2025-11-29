'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getApiUrl } from '@/app/lib/api';

interface ReferralInfo {
  referrer_name: string;
  referral_code: string;
  is_valid: boolean;
}

export default function ReferralFormPage() {
  const params = useParams();
  const router = useRouter();
  const referralId = params.id as string;

  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    investment_amount: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (referralId) {
      validateReferral();
    }
  }, [referralId]);

  const validateReferral = async () => {
    try {
      const response = await fetch(getApiUrl(`/api/referrals/validate/${referralId}`));
      const data = await response.json();

      if (data.success && data.data.is_valid) {
        setReferralInfo(data.data);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to validate referral:', err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.investment_amount.trim()) {
      newErrors.investment_amount = 'Investment amount is required';
    } else if (isNaN(Number(formData.investment_amount)) || Number(formData.investment_amount) <= 0) {
      newErrors.investment_amount = 'Please enter a valid investment amount';
    } else if (Number(formData.investment_amount) < 25000) {
      newErrors.investment_amount = 'Minimum investment amount is $25,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setErrors({});

      const response = await fetch(getApiUrl('/api/referrals/submit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referral_code: referralId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          investment_amount: parseFloat(formData.investment_amount)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', investment_amount: '' });
      } else {
        setErrors({ submit: data.error || 'Failed to submit referral' });
      }
    } catch (err) {
      setErrors({ submit: 'Failed to submit referral. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const numericValue = parseFloat(value.replace(/,/g, ''));
    return isNaN(numericValue) ? value : numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-white mx-auto"></div>
          <div className="text-gray-400 mt-4">Validating referral link...</div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Thank You!</h2>
            <p className="text-gray-400 mb-6">
              Your investment interest has been submitted successfully. Our admin team will review your application and contact you within 24-48 hours.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You will receive updates via email about your investment application status.
            </p>
            {/*<button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </button>*/}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#111111] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Image 
                src="/images/logo.svg" 
                alt="The Sport Exchange" 
                width={180} 
                height={40}
                priority
            />
            <div className="text-sm text-gray-400">
              Investment Opportunity
            </div>
          </div>
        </div>
      </header>

      <div className="overflow-hidden mb-5">
        <div className="flex w-full justify-center text-center">
            <div className='border border-zinc-200 rounded-lg p-3'>
                <Link href="https://drive.google.com/file/d/1FtdrHo5ZqH8Uj_h4clJlYy4uKu3aCUJk/view" target="_blank" rel="noopener noreferrer">
                    <Image 
                        src="/images/deck.png" 
                        alt="Cor Deck" 
                        width={500} 
                        height={400}
                        priority
                    />
                </Link>
                <Link href="https://drive.google.com/file/d/1FtdrHo5ZqH8Uj_h4clJlYy4uKu3aCUJk/view" target="_blank" rel="noopener noreferrer"
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 w-full mt-5"
                    style={{ display: 'block' }}
                  >
                    VIEW DECK
                  </Link>
            </div>
        </div>
    </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Referral Info Banner */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Exclusive Investment Invitation</h2>
              <p className="text-blue-300">
                You've been referred by <span className="font-medium">{referralInfo?.referrer_name}</span> to join The Sport Exchange
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Express Your Investment Interest
            </h1>
            <p className="text-gray-400">
              Fill out the form below to express your interest in investing with The Sport Exchange. Our team will review your application and contact you with next steps.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full bg-[#1a1a1a] border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-[#1a1a1a] border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full bg-[#1a1a1a] border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.phone 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Investment Amount Field */}
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
                  value={formatCurrency(formData.investment_amount)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[$,]/g, '');
                    const numericValue = rawValue.replace(/[^0-9.]/g, '');
                    const parts = numericValue.split('.');
                    const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
                    setFormData({ ...formData, investment_amount: formattedValue });
                  }}
                  className={`w-full bg-[#1a1a1a] border rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:ring-2 transition-colors ${
                    errors.investment_amount 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="25,000.00"
                />
              </div>
              {errors.investment_amount && (
                <p className="text-red-400 text-sm mt-1">{errors.investment_amount}</p>
              )}
              <p className="text-gray-500 text-sm mt-2">
                Minimum investment amount is $25,000
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Investment Interest
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What happens next?
              </h4>
              <ul className="text-blue-300 text-sm space-y-1">
                <li>• Our admin team will review your investment interest</li>
                <li>• We'll contact you within 24-48 hours via email or phone</li>
                <li>• You'll receive detailed information about the investment process</li>
                <li>• No commitment is required at this stage</li>
              </ul>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#111111] border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-500">
              © 2025 The Sport Exchange. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}