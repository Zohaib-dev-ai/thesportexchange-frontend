'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/app/lib/auth';
import { getApiUrl, getDocumentUrl } from '@/app/lib/api';

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
  notes: string;
  copy_of_contract?: string;
  documents?: any[];
}

interface Newsletter {
  id: number;
  subject: string;
  message: string;
  sent_date: string;
  attachments?: any[];
}

export default function InvestorPortalPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNewsletters, setLoadingNewsletters] = useState(true);
  const [error, setError] = useState('');
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchInvestorData();
      fetchNewsletters();
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

  const fetchNewsletters = async () => {
    try {
      setLoadingNewsletters(true);
      const response = await fetch(getApiUrl('/api/newsletter/history'));
      const data = await response.json();
      
      if (data.success) {
        // Show latest 5 newsletters
        setNewsletters(data.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch newsletters:', err);
    } finally {
      setLoadingNewsletters(false);
    }
  };

  const formatNewsletterDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome, {investor.full_name} {investor.last_name}
        </h1>
        <p className="text-blue-100">
          View your investment details and stay updated with newsletters
        </p>
      </div>

      {/* Investment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Investment Amount</h3>
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white">${investor.amount_of_money?.toLocaleString() || '0'}</p>
        </div>

        <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Coin Holdings</h3>
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white">{investor.amount_of_coins?.toLocaleString() || '0'}</p>
        </div>

        <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Status</h3>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-white">{investor.status}</p>
        </div>
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
        </div>
      </div>

      {/* Investment Details */}
      <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Investment Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <label className="block text-sm font-medium text-gray-400 mb-2">Amount Invested</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
              ${investor.amount_of_money?.toLocaleString() || '0'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">TSE Coins</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
              {investor.amount_of_coins?.toLocaleString() || '0'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
            <p className="text-white bg-[#1a1a1a] px-4 py-3 rounded-lg">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                investor.status === 'Paid' 
                  ? 'bg-green-500/20 text-green-400' 
                  : investor.status === 'Signed'
                  ? 'bg-blue-500/20 text-blue-400'
                  : investor.status === 'Pending'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {investor.status}
              </span>
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

      {/* Documents Section */}
      {((investor.documents && investor.documents.length > 0) || investor.copy_of_contract) && (
        <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Your Documents
          </h2>
          <div className="space-y-3">
            {/* Main Contract Document */}
            {investor.copy_of_contract && (
              <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-3 rounded-lg border-2 border-blue-500/30">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      Investment Contract
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Main Contract</span>
                    </p>
                    <p className="text-gray-400 text-sm">Official investment agreement</p>
                  </div>
                </div>
                <a
                  href={investor.copy_of_contract}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400 flex items-center px-4 py-2 bg-blue-500/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </a>
              </div>
            )}
            
            {/* Additional Documents */}
            {investor.documents && investor.documents.length > 0 && investor.documents.map((doc: any) => (
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
                  className="text-blue-500 hover:text-blue-400 flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Help Section 
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-white font-semibold mb-1">Need Assistance?</h3>
            <p className="text-gray-300 text-sm mb-2">
              If you have any questions about your investment or need to update your information, please contact our support team.
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
