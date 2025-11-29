"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated, getAuthToken } from "../../../lib/auth";
import { getApiUrl, getDocumentUrl } from "../../../lib/api";
import InvestmentRequestsTable from "../../../components/InvestmentRequestsTable";
import ReferralsTable from "../../../components/ReferralsTable";

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
  contracts?: Contract[];
}

export default function InvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInvestor, setEditedInvestor] = useState<Investor | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    // Check authentication using auth service
    if (!isAuthenticated()) {
      router.push("/login-admin");
      return;
    }

    fetchInvestor();
    fetchContracts();
  }, [resolvedParams.id, router]);

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
    return isNaN(numericValue) ? '0.00000' : numericValue.toFixed(5);
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

  const fetchInvestor = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl(`/api/investors/${resolvedParams.id}`), { headers });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch investor');
      }

      setInvestor(data.data);
      setEditedInvestor(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investor');
      setTimeout(() => router.push("/dashboard"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl(`/api/contracts/investor/${resolvedParams.id}`), { headers });
      const data = await response.json();
      if (data.success) {
        setContracts(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedInvestor(investor);
  };

  const handleSave = async () => {
    if (!editedInvestor) return;

      try {
      setSaving(true);
      setError("");
      
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(getApiUrl(`/api/investors/${resolvedParams.id}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          full_name: editedInvestor.full_name,
          last_name: editedInvestor.last_name,
          email: editedInvestor.email,
          phone: editedInvestor.phone,
          amount_of_money: editedInvestor.amount_of_money,
          amount_of_coins: editedInvestor.amount_of_coins,
          status: editedInvestor.status,
          payment: editedInvestor.payment,
          notes: editedInvestor.notes,
        }),
      });      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update investor');
      }

      setInvestor(editedInvestor);
      setIsEditing(false);
      setSuccessMessage('Changes saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Investor, value: string | number) => {
    if (editedInvestor) {
      setEditedInvestor({ ...editedInvestor, [field]: value });
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    
    // Validation
    if (!newPassword || !confirmPassword) {
      setPasswordError("Please fill in both password fields");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl(`/api/investors/${resolvedParams.id}/change-password`), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccessMessage('Password changed successfully!');
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDelete = async () => {
    if (!investor) return;

    try {
      setDeleting(true);
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl(`/api/investors/${investor.id}`), {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete investor');
      }

      setSuccessMessage('Investor deleted successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete investor');
      setShowDeleteModal(false);
      setTimeout(() => setError(""), 3000);
    } finally {
      setDeleting(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading investor details...</p>
        </div>
      </div>
    );
  }

  if (error || !investor || !editedInvestor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Investor not found'}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const displayInvestor = isEditing ? editedInvestor : investor;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Signed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300";
    }
  };

  return (
    <div className="min-h-screen dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-zinc-600 dark:text-zinc-400 dark:hover:text-white"
            >
              ← Back to Dashboard
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Investor Header */}
        <div className="mb-8 rounded-xl border border-zinc-200 p-8 shadow-sm dark:bg-zinc-800">
          <div className="flex items-start justify-between sm-block">
            <div>
              <h1 className="text-4xl font-bold dark:text-white">
                {displayInvestor.full_name}
              </h1>
              <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                Investor ID: #{displayInvestor.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/*<span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(
                  displayInvestor.status
                )}`}
              >
                {displayInvestor.status}
              </span>*/}

              {!isEditing ? (
                <>
                  <Link
                    href={`/dashboard/contracts/new?investorId=${resolvedParams.id}`}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                  >
                    Add Contract
                  </Link>
                  <button
                    onClick={handleEdit}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-lg bg-zinc-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                First Name
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedInvestor.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {displayInvestor.full_name}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Last Name
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedInvestor.last_name || ''}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {displayInvestor.last_name || 'N/A'}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Email Address
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={editedInvestor.email || ''}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {displayInvestor.email || 'N/A'}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Phone Number
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedInvestor.phone || ''}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {displayInvestor.phone || 'N/A'}
                </div>
              )}
            </div>
            {/*<div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Status
              </div>
              {isEditing ? (
                <select
                  value={editedInvestor.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white text-zinc-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Signed">Signed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {displayInvestor.status}
                </div>
              )}
            </div>*/}
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Amount of Money
              </div>
              <div className="mt-1 text-2xl font-bold dark:text-white">
                {formatCurrency(displayInvestor.amount_of_money)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Amount of Coins
              </div>
              <div className="mt-1 text-2xl font-bold dark:text-white">
                {formatCoins(displayInvestor.amount_of_coins)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Creation Date
              </div>
              <div className="mt-1 text-base dark:text-white">
                {displayInvestor.investment_date ? new Date(displayInvestor.investment_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Notes
              </div>
              {isEditing ? (
                <textarea
                  value={editedInvestor.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={4}
                  className="text-white w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white mt-1"
                  placeholder="Enter notes about this investor..."
                />
              ) : (
                <p className="text-zinc-700 dark:text-zinc-300 mt-1">
                  {displayInvestor.notes || "No notes available for this investor."}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Contracts Section */}
        <div className="mb-8 rounded-xl border border-zinc-200 p-6 shadow-sm dark:bg-zinc-800">
          <h2 className="mb-6 text-xl font-bold dark:text-white">
            Contracts ({contracts.length})
          </h2>
          {contracts.length > 0 ? (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <div key={contract.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold dark:text-white">Contract #{contract.id}</h3>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-zinc-600 dark:text-zinc-400">Amount</p>
                      <p className="dark:text-white font-medium">{formatCurrency(contract.amount_of_money)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-600 dark:text-zinc-400">Coins</p>
                      <p className="dark:text-white font-medium">{formatCoins(contract.amount_of_coins)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-600 dark:text-zinc-400">Rate</p>
                      <p className="dark:text-white font-medium">{formatCoinRate(contract.coin_rate)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-600 dark:text-zinc-400">Investment Date</p>
                      <p className="dark:text-white font-medium">{new Date(contract.investment_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Created: {new Date(contract.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/dashboard/contracts/${contract.id}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Details
                    </Link>
                  </div>

                  {/* Contract Documents */}
                  {contract.documents && contract.documents.length > 0 && (
                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
                      <h4 className="text-sm font-semibold dark:text-white mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Documents ({contract.documents.length})
                      </h4>
                      <div className="space-y-2">
                        {contract.documents.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded border border-zinc-200 dark:border-zinc-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-zinc-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <p className="dark:text-white text-xs font-medium">{doc.document_name}</p>
                                <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                                  {new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <a
                              href={getDocumentUrl(doc.document_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center text-xs px-2 py-1 bg-blue-500/10 rounded transition-colors"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          ) : (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">No contracts found for this investor.</p>
              <p className="text-xs">Click "Add Contract" to create the first contract.</p>
            </div>
          )}
        </div>
        
        {/* Investment Requests Section */}
        <InvestmentRequestsTable 
          title="Investment Requests" 
          investorId={parseInt(resolvedParams.id)}
          className="mb-8"
        />

        {/* Referrals Section */}
        <ReferralsTable 
          title="Referrals" 
          investorId={parseInt(resolvedParams.id)}
          className="mb-8"
        />

        {/* Account Settings */}
        <div className="mb-8 rounded-xl border border-zinc-200 p-6 shadow-sm dark:bg-zinc-800">
            <h2 className="mb-4 text-xl font-bold dark:text-white">
              Account Settings
            </h2>
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Change Password
                </button>
              </div>
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <strong>Login Email:</strong> {investor.email}
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  This investor can login to the investor portal using their email and password.
                </p>
              </div>
            </div>
          </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-zinc-900 p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-2xl font-bold dark:text-white">Change Password</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Set a new password for {investor?.full_name}
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="Re-enter new password"
                  />
                </div>

                {passwordError && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {passwordError}
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  disabled={changingPassword}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
              <div className="mb-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-zinc-900 dark:text-white">
                  Delete Investor & All Related Data
                </h3>
                <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  Are you sure you want to delete <strong>{investor?.full_name}</strong>? This action cannot be undone and will permanently remove:
                </p>
                <div className="mt-4 text-left text-sm text-zinc-600 dark:text-zinc-400">
                  <ul className="list-disc list-inside space-y-1">
                    <li>✗ Investor profile and account</li>
                    <li>✗ All contracts and related documents</li>
                    <li>✗ All referrals and referrer codes</li>
                    <li>✗ All investment requests</li>
                    <li>✗ All TCF form submissions</li>
                    <li>✗ All uploaded documents</li>
                    <li>✗ All newsletter history</li>
                    <li>✗ User login credentials</li>
                  </ul>
                </div>
                <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                  <p className="text-center text-sm font-medium text-red-800 dark:text-red-400">
                    ⚠️ This will completely remove all traces of this investor from the system
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
