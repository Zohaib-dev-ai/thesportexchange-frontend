"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated, getAuthToken } from "../../../lib/auth";
import { getApiUrl } from "../../../lib/api";

interface Investor {
  id: number;
  full_name: string;
  last_name: string;
  email: string;
}

interface ContractForm {
  amount_of_money: string;
  amount_of_coins: string;
  coin_rate: string;
  payment_status: string;
  investment_date: string;
  document?: File | null;
}

function NewContractForm() {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [contractForm, setContractForm] = useState<{
    amount_of_money: string;
    amount_of_coins: string;
    coin_rate: string;
    payment_status: string;
    investment_date: string;
    document: File | null;
  }>({
    amount_of_money: '',
    amount_of_coins: '',
    coin_rate: '',
    payment_status: 'Unpaid',
    investment_date: '',
    document: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const investorId = searchParams.get('investorId');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login-admin");
      return;
    }

    if (!investorId) {
      setError("Investor ID is required");
      return;
    }

    fetchInvestor();
  }, [investorId, router]);

  const fetchInvestor = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl(`/api/investors/${investorId}`), { headers });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch investor");
      }

      setInvestor(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investor");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractForm.amount_of_money || !contractForm.amount_of_coins || 
        !contractForm.investment_date) {
      setError('Amount of Money, Amount of Coins, and Investment Date are required');
      return;
    }

    if (!contractForm.coin_rate) {
      setError('Please enter both Amount of Money and Amount of Coins to calculate the coin rate');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Create contract first
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const contractResponse = await fetch(getApiUrl(`/api/contracts`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          investor_id: investorId,
          amount_of_money: parseFloat(contractForm.amount_of_money),
          amount_of_coins: parseFloat(contractForm.amount_of_coins),
          coin_rate: parseFloat(contractForm.coin_rate),
          payment_status: contractForm.payment_status,
          investment_date: contractForm.investment_date.split('T')[0] // Ensure YYYY-MM-DD format
        }),
      });

      const contractData = await contractResponse.json();

      if (!contractResponse.ok || !contractData.success) {
        throw new Error(contractData.error || 'Failed to create contract');
      }

      // Upload document if provided
      if (contractForm.document) {
        // First upload the file
        const formData = new FormData();
        formData.append('file', contractForm.document);

        const uploadResponse = await fetch(getApiUrl('/api/upload'), {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success) {
          // Then link it to the contract
          const docHeaders: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            docHeaders['Authorization'] = `Bearer ${token}`;
          }
          const docResponse = await fetch(getApiUrl(`/api/contracts/${contractData.data.id}/documents`), {
            method: 'POST',
            headers: docHeaders,
            body: JSON.stringify({
              document_name: contractForm.document?.name || 'Unknown',
              document_url: uploadData.data.url,
              document_type: contractForm.document?.type || 'application/octet-stream',
              file_size: contractForm.document?.size || 0,
              uploaded_by: null // Use null to avoid foreign key constraint issues
            }),
          });

          if (!docResponse.ok) {
            const docData = await docResponse.json();
            console.warn('Document linking failed:', docData.error);
          }
        } else {
          console.warn('Document upload failed:', uploadData.error);
        }
      }

      setSuccessMessage('Contract created successfully!');
      setTimeout(() => {
        router.push(`/dashboard/investor/${investorId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ContractForm, value: string) => {
    if (field === 'amount_of_money' || field === 'amount_of_coins') {
      // Remove non-numeric characters except decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = numericValue.split('.');
      const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
      
      setContractForm(prev => {
        const updated = { ...prev, [field]: formattedValue };
        
        // Auto-calculate coin rate when both money and coins are available
        const money = field === 'amount_of_money' ? formattedValue : prev.amount_of_money;
        const coins = field === 'amount_of_coins' ? formattedValue : prev.amount_of_coins;
        
        if (money && coins && parseFloat(coins) > 0) {
          const rate = parseFloat(money) / parseFloat(coins);
          updated.coin_rate = rate.toFixed(5); // 5 decimal places for precision
        } else {
          updated.coin_rate = '';
        }
        
        return updated;
      });
    } else {
      setContractForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setDocError('');
    
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setDocError('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setDocError('Only PDF, Word documents, and images (JPG, PNG) are allowed');
        return;
      }
      
      setContractForm(prev => ({ ...prev, document: file }));
    } else {
      setContractForm(prev => ({ ...prev, document: null }));
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? value : numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !investor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/investor/${investorId}`}
              className="text-zinc-600 dark:text-zinc-400 dark:hover:text-white"
            >
              ← Back to Investor
            </Link>
          </div>
          <Image 
            src="/images/logo.svg" 
            alt="The Sport Exchange" 
            width={180} 
            height={40}
            priority
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6">
            <h1 className="text-3xl font-bold dark:text-white">Create New Contract</h1>
            {investor && (
              <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                For investor: {investor.full_name} {investor.last_name}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="amount_of_money" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Amount of Money ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="amount_of_money"
                    value={formatCurrency(contractForm.amount_of_money)}
                    onChange={(e) => {
                      // Remove commas and format for storage
                      const rawValue = e.target.value.replace(/,/g, '');
                      handleInputChange("amount_of_money", rawValue);
                    }}
                    onBlur={(e) => {
                      // Ensure proper decimal formatting on blur
                      const value = e.target.value.replace(/,/g, '');
                      if (value && !isNaN(parseFloat(value))) {
                        handleInputChange("amount_of_money", parseFloat(value).toFixed(2));
                      }
                    }}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 pl-8 pr-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="10,000.00"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-zinc-500 text-sm">$</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="amount_of_coins" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Amount of Coins <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="amount_of_coins"
                  value={formatCurrency(contractForm.amount_of_coins)}
                  onChange={(e) => {
                    // Remove commas and format for storage
                    const rawValue = e.target.value.replace(/,/g, '');
                    handleInputChange("amount_of_coins", rawValue);
                  }}
                  onBlur={(e) => {
                    // Ensure proper decimal formatting on blur
                    const value = e.target.value.replace(/,/g, '');
                    if (value && !isNaN(parseFloat(value))) {
                      handleInputChange("amount_of_coins", parseFloat(value).toFixed(2));
                    }
                  }}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  placeholder="10,000.00"
                  required
                />
              </div>

              <div>
                <label htmlFor="coin_rate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Coin Rate ($) <span className="text-xs text-zinc-500">(Auto-calculated)</span>
                </label>
                <input
                  type="text"
                  id="coin_rate"
                  value={contractForm.coin_rate ? `$${parseFloat(contractForm.coin_rate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 5 })}` : ''}
                  readOnly
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 bg-zinc-50 text-zinc-500 cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                  placeholder="Will be calculated automatically"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Calculated as: Amount of Money ÷ Amount of Coins
                </p>
              </div>

              <div>
                <label htmlFor="payment_status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="payment_status"
                  value={contractForm.payment_status}
                  onChange={(e) => handleInputChange("payment_status", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 text-zinc-400"
                  required
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div>
                <label htmlFor="investment_date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Investment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="investment_date"
                  value={contractForm.investment_date}
                  onChange={(e) => handleInputChange("investment_date", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="document" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Contract Document
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="document"
                    onChange={handleDocumentChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 dark:hover:file:bg-blue-900/30"
                  />
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Upload contract document (PDF, Word, or Image). Maximum 10MB.
                  </p>
                  {contractForm.document && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {contractForm.document.name}
                    </div>
                  )}
                  {docError && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {docError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Creating Contract...' : 'Create Contract'}
              </button>
              <Link
                href={`/dashboard/investor/${investorId}`}
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-6 py-3 text-center font-semibold transition-colors hover:bg-zinc-50 text-zinc-500"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <NewContractForm />
    </Suspense>
  );
}