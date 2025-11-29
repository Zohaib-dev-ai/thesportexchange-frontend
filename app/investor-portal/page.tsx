'use client';

import { useState, useEffect } from 'react';
import { getUserId } from '@/app/lib/auth';
import { getApiUrl, getDocumentUrl } from '@/app/lib/api';
import { DashboardCharts } from '../components/DashboardCharts';
import AddInvestmentComponent from '../components/AddInvestmentComponent';
import InvestmentRequestsComponent from '../components/InvestmentRequestsComponent';
import ReferralBox from '../components/ReferralBox';
import InvestorReferrals from '../components/InvestorReferrals';
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
  copy_of_contract?: string;
  documents?: any[];
}

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

interface Newsletter {
  id: number;
  subject: string;
  message: string;
  sent_date: string;
  attachments?: any[];
}

interface Settings {
  id: number;
  coin_rate: string;
  created_at: string;
  updated_at: string;
}

export default function InvestorPortalPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [currentRate, setCurrentRate] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [loadingNewsletters, setLoadingNewsletters] = useState(true);
  const [error, setError] = useState('');
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [refreshInvestmentRequests, setRefreshInvestmentRequests] = useState(0);

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
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchInvestorData();
      fetchContracts();
      fetchNewsletters();
      fetchCurrentRate();
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

  const fetchContracts = async () => {
    try {
      const investorId = getUserId();
      if (!investorId) return;

      const response = await fetch(getApiUrl(`/api/contracts/investor/${investorId}`));
      const data = await response.json();
      
      if (data.success) {
        setContracts(data.data.slice(0, 3)); // Show only first 3 contracts
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    } finally {
      setLoadingContracts(false);
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

  const fetchCurrentRate = async () => {
    try {
      const response = await fetch(getApiUrl('/api/settings'));
      const data = await response.json();
      
      if (data.success && data.data) {
        // Backend returns settings as key-value object: { current_rate: { value: "5", ... } }
        const currentRateData = data.data.current_rate;
        setCurrentRate(currentRateData?.value || '0');
      }
    } catch (err) {
      console.error('Failed to fetch current rate:', err);
    }
  };

  const handleInvestmentRequestSubmitted = () => {
    // Trigger a refresh of the investment requests component
    setRefreshInvestmentRequests(prev => prev + 1);
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'contract sent':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'signed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8">
        <div className="flex items-center justify-between sm-block">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome, {investor.full_name} {investor.last_name}
            </h1>
            <p className="text-blue-100">
              View your investment details and stay updated with newsletters
            </p>
          </div>
          <div className="flex items-center gap-4 sm-block">
            <AddInvestmentComponent 
              currentRate={currentRate}
              onRequestSubmitted={fetchInvestorData}
              onInvestmentRequestSubmitted={handleInvestmentRequestSubmitted}
            />
            <Link 
              href="/investor-portal/personal-info"
              className="flex items-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Info
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Charts */}
      <DashboardCharts />

      {/* Investment Details */}
      <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Investment Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-400">Amount of Money</h3>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(investor.amount_of_money)}</p>
            <p className="text-xs text-green-400/70 mt-1">Total investment</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-400">Amount of Coins</h3>
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{formatCoins(investor.amount_of_coins)}</p>
            <p className="text-xs text-purple-400/70 mt-1">TSE tokens</p>
          </div>
        </div>
      </div>

      {/* Contracts Section */}
      <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            My Contracts ({contracts.length})
          </h2>
          {contracts.length > 0 && (
            <Link 
              href="/investor-portal/contracts"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              View All
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {loadingContracts ? (
          <div className="text-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-700 border-t-white mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2">No contracts found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Contract #{contract.id}</h3>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeStyle(contract.status)}`}>
                      {contract.status || 'pending'}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      contract.payment_status === 'Paid' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {contract.payment_status}
                    </span>
                  </div>
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
          </div>
        )}
      </div>

      {/* Investment Requests Section */}
      <InvestmentRequestsComponent 
        investorId={investor.id} 
        refreshTrigger={refreshInvestmentRequests}
        currentRate={currentRate}
      />

      {/* Referral Program Section */}
      <ReferralBox />

      {/* My Referrals Section */}
      <InvestorReferrals investorId={investor.id} />

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
    </div>
  );
}
