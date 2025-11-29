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
  investment_date: string;
  created_at: string;
  documents?: any[];
}

interface ContractComponentProps {
  maxDisplay?: number;
  showViewAll?: boolean;
}

export default function ContractComponent({ maxDisplay = 3, showViewAll = true }: ContractComponentProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const investorId = getUserId();
      if (!investorId) return;

      const response = await fetch(getApiUrl(`/api/contracts/investor/${investorId}`));
      const data = await response.json();
      
      if (data.success) {
        setContracts(data.data.slice(0, maxDisplay));
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-700 border-t-white mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading contracts...</p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-2">No contracts found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => (
        <div key={contract.id} className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Contract #{contract.id}</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              contract.payment_status === 'Paid' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {contract.payment_status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="text-white font-medium">{formatCurrency(contract.amount_of_money)}</p>
            </div>
            <div>
              <p className="text-gray-400">Coins</p>
              <p className="text-white font-medium">{formatCoins(contract.amount_of_coins)}</p>
            </div>
            <div>
              <p className="text-gray-400">Investment Date</p>
              <p className="text-white font-medium">{new Date(contract.investment_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Created</p>
              <p className="text-white font-medium">{new Date(contract.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Contract Documents */}
          {contract.documents && contract.documents.length > 0 && (
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Documents ({contract.documents.length})
              </h4>
              <div className="space-y-2">
                {contract.documents.slice(0, 2).map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between bg-[#0d0d0d] px-3 py-2 rounded border border-gray-600/50">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-white text-xs font-medium">{doc.document_name}</p>
                        <p className="text-gray-400 text-xs">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={getDocumentUrl(doc.document_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center text-xs px-2 py-1 bg-blue-500/10 rounded transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </a>
                  </div>
                ))}
                {contract.documents.length > 2 && (
                  <p className="text-xs text-gray-400 text-center py-1">
                    +{contract.documents.length - 2} more documents
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {showViewAll && contracts.length > 0 && (
        <div className="text-center pt-2">
          <Link 
            href="/investor-portal/contracts"
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center"
          >
            View All Contracts
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}