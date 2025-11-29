'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/dist/client/link';

export default function PublicTCFPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    investment_amount: '',
  });
  const [honeypot, setHoneypot] = useState(''); // Bot trap field
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // SECURITY CHECK 1: Honeypot - If bot fills this hidden field, reject
    if (honeypot) {
      console.log('Bot detected - honeypot filled');
      setLoading(false);
      return; // Silent fail for bots
    }

    // SECURITY CHECK 2: Rate limiting - Max 3 submissions per hour
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (lastSubmitTime && (now - lastSubmitTime) < oneHour) {
      const remainingAttempts = 3 - submitAttempts;
      
      if (remainingAttempts <= 0) {
        setError('Too many submission attempts. Please try again later.');
        setLoading(false);
        return;
      }
    } else {
      // Reset counter after 1 hour
      setSubmitAttempts(0);
    }

    // SECURITY CHECK 3: Basic input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+\d\s()-]{10,}$/;
    
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    // SECURITY CHECK 4: Check for suspicious patterns
    const suspiciousPatterns = /<script|javascript:|onerror=|onclick=/i;
    const allValues = Object.values(formData).join(' ');
    if (suspiciousPatterns.test(allValues)) {
      console.log('Suspicious content detected');
      setLoading(false);
      return; // Silent fail
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      const response = await fetch(`${API_URL}/api/tcf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit TCF');
      }

      // Update rate limiting tracking
      setSubmitAttempts(submitAttempts + 1);
      setLastSubmitTime(now);
      setSubmitted(true);

    } catch (err: any) {
      setError(err.message || 'Failed to submit TCF');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      investment_amount: '',
    });
    setHoneypot('');
    setError('');
  };

  // Show Thank You message after submission
  if (submitted) {
    return (
      <div className="min-h-screen from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
            <div className="flex w-full justify-center text-center mb-5">
                <Image 
                    src="/images/logo.svg" 
                    alt="The Sport Exchange" 
                    width={180} 
                    height={40}
                    priority
                />
            </div>
          <div className="border border-zinc-200 rounded-lg shadow-xl p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold mb-4">
              Thank You!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your Form has been submitted successfully. Our team will review your submission and get back to you shortly.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-700">
                <strong>What's next?</strong><br />
                We'll review your information and contact you via email at <strong>{formData.email}</strong> with the next steps.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-[#111111] border-b border-gray-800 mb-5">
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
              <Image 
                  src="/images/tcf-logo.png" 
                  alt="TCF Logo" 
                  width={180} 
                  height={40}
                  priority
              />
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-2xl mx-auto">
        
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

        <div className="border border-zinc-200 rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              TCF Form
            </h1>
            <p className="text-gray-600">
              Please fill in your information and select your investment amount to submit.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot field - Hidden from users, visible to bots */}
            <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <label htmlFor="website">Website (leave blank)</label>
              <input
                type="text"
                id="website"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label htmlFor="investment_amount" className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount <span className="text-red-500">*</span>
              </label>
              <select
                id="investment_amount"
                name="investment_amount"
                value={formData.investment_amount}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-zinc-500"
              >
                <option value="">Select investment amount</option>
                <option value="$25000">$25,000</option>
                <option value="$25000-$50000">$25,000-$50,000</option>
                <option value="$50000 and above">above $50,000</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit TCF'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
