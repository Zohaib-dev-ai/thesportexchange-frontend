'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/app/lib/auth';
import { getApiUrl, getDocumentUrl } from '@/app/lib/api';
import Link from 'next/link';

interface Contract {
  id: number;
  investor_id: number;
  amount_of_money: number;
  amount_of_coins: number;
  coin_rate: number;
  payment_status: string;
  status: string;
  investment_date: string;
  created_at: string;
  documents?: any[];
}

export default function ContractsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatCoins = (value: string | number) => {
    if (!value && value !== 0) return '0';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numericValue) ? '0' : numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatCurrency = (value: string | number) => {
    if (!value && value !== 0) return '$0';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numericValue) ? '$0' : `$${numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  const formatCoinRate = (value: string | number) => {
    if (!value && value !== 0) return '0.00000';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numericValue) ? '0.00000' : numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 5
    });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchContracts();
    }
  }, [isMounted]);

  const fetchContracts = async () => {
    try {
      const investorId = getUserId();
      if (!investorId) {
        setError('Unable to identify investor');
        setLoading(false);
        return;
      }

      const response = await fetch(getApiUrl(`/api/contracts/investor/${investorId}`));
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch contracts');
      }

      setContracts(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-white mx-auto"></div>
          <div className="text-gray-400 mt-4">Loading your contracts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-400 mb-2">{error}</div>
          <button 
            onClick={fetchContracts}
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
        <h1 className="text-3xl font-bold text-white">My Contracts</h1>
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

      {contracts.length === 0 ? (
        <div className="text-center py-12 bg-[#111111] border border-gray-800 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-white">No contracts found</h3>
          <p className="mt-1 text-gray-400">You don't have any contracts yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {contracts.map((contract) => (
            <div key={contract.id} className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              {/* Contract Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Contract #{contract.id}</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  contract.payment_status === 'Paid' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {contract.payment_status}
                </span>
              </div>

              {/* Contract Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Amount of Money</label>
                  <p className="text-2xl font-bold text-white">{formatCurrency(contract.amount_of_money)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Amount of Coins</label>
                  <p className="text-2xl font-bold text-white">{formatCoins(contract.amount_of_coins)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Coin Rate</label>
                  <p className="text-2xl font-bold text-white">{formatCoinRate(contract.coin_rate)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Investment Date</label>
                  <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
                    {new Date(contract.investment_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Created Date</label>
                  <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
                    {new Date(contract.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Payment Status</label>
                  <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      contract.payment_status === 'Paid'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {contract.payment_status}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Contract Status</label>
                  <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      contract.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      contract.status === 'contract sent' ? 'bg-blue-500/20 text-blue-400' :
                      contract.status === 'signed' ? 'bg-green-500/20 text-green-400' :
                      contract.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {contract.status || 'pending'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Contract Documents */}
              {contract.documents && contract.documents.length > 0 && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Documents
                  </h4>
                  <div className="space-y-2">
                    {contract.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between bg-[#1a1a1a] px-4 py-3 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-white font-medium">{doc.document_name}</p>
                            <p className="text-gray-400 text-sm">
                              Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={getDocumentUrl(doc.document_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400 flex items-center px-3 py-1 bg-blue-500/10 rounded transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}