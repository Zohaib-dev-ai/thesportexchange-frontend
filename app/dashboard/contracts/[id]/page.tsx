"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated, getAuthToken } from "../../../lib/auth";
import { getApiUrl } from "../../../lib/api";

interface Contract {
  id: number;
  investor_id: number;
  amount_of_money: number;
  amount_of_coins: number;
  coin_rate: number;
  payment_status: string;
  contract_status: string;
  status: string;
  investment_date: string;
  notes?: string;
  created_at: string;
  full_name: string;
  last_name: string;
  documents?: Document[];
}

interface Document {
  id: number;
  contract_id: number;
  document_name: string;
  document_url: string;
  document_type: string;
  file_size: number;
  uploaded_at: string;
}

interface ContractForm {
  amount_of_money: string;
  amount_of_coins: string;
  coin_rate: string;
  payment_status: string;
  contract_status: string;
  status: string;
  investment_date: string;
  notes: string;
  document?: File | null;
}

export default function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ContractForm>({
    amount_of_money: '',
    amount_of_coins: '',
    coin_rate: '',
    payment_status: 'Unpaid',
    contract_status: 'Draft',
    status: 'pending',
    investment_date: '',
    notes: '',
    document: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [docError, setDocError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login-admin");
      return;
    }
    fetchContract();
  }, [resolvedParams.id, router]);

  const handleSendEmail = async () => {
    if (!contract) return;

    // Check if there are any documents attached
    if (!contract.documents || contract.documents.length === 0) {
      setError("📎 No documents attached! Please upload contract documents before sending email. Click 'Edit' to add documents.");
      setTimeout(() => setError(''), 8000);
      return;
    }

    try {
      setSendingEmail(true);
      setError('');

      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('/api/contracts/send-contract-email'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contractId: contract.id,
          investorName: `${contract.full_name} ${contract.last_name}`,
          contractDetails: {
            amount_of_money: contract.amount_of_money,
            amount_of_coins: contract.amount_of_coins,
            coin_rate: contract.coin_rate,
            investment_date: contract.investment_date,
            status: contract.status
          },
          documents: contract.documents
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSuccessMessage('Contract email sent successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send contract email');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSendingEmail(false);
    }
  };

  const fetchContract = async () => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl(`/api/contracts/${resolvedParams.id}`), { headers });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch contract");
      }

      setContract(data.data);
      // Initialize edit form with contract data
      setEditForm({
        amount_of_money: data.data.amount_of_money.toString(),
        amount_of_coins: data.data.amount_of_coins.toString(),
        coin_rate: data.data.coin_rate.toString(),
        payment_status: data.data.payment_status,
        contract_status: data.data.contract_status,
        status: data.data.status || 'pending',
        investment_date: data.data.investment_date,
        notes: data.data.notes || '',
        document: null
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contract");
      setTimeout(() => router.push("/dashboard"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ContractForm, value: string) => {
    if (field === 'amount_of_money' || field === 'amount_of_coins') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
      
      setEditForm(prev => {
        const newForm = { ...prev, [field]: formattedValue };
        
        // Auto-calculate coin rate when amount_of_money or amount_of_coins changes
        const money = parseFloat(field === 'amount_of_money' ? formattedValue : prev.amount_of_money);
        const coins = parseFloat(field === 'amount_of_coins' ? formattedValue : prev.amount_of_coins);
        
        if (money && coins && money > 0 && coins > 0) {
          const rate = money / coins;
          newForm.coin_rate = rate.toString();
        }
        
        return newForm;
      });
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setDocError('');
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setDocError('File size must be less than 10MB');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setDocError('Only PDF, Word documents, and images (JPG, PNG) are allowed');
        return;
      }
      
      setEditForm(prev => ({ ...prev, document: file }));
    } else {
      setEditForm(prev => ({ ...prev, document: null }));
    }
  };

  const formatCurrency = (value: string | number) => {
    if (!value && value !== 0) return '';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numericValue) ? value.toString() : numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const formatCoins = (value: string | number) => {
    if (!value && value !== 0) return '';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numericValue) ? value.toString() : numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatCoinRate = (value: string | number) => {
    if (!value && value !== 0) return '0.00';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) return '0.00';
    
    // Format to 2-5 decimal places, removing trailing zeros
    let formatted = numericValue.toFixed(5);
    // Remove trailing zeros after decimal point
    formatted = parseFloat(formatted).toString();
    
    // Ensure at least 2 decimal places for currency
    if (!formatted.includes('.')) {
      formatted += '.00';
    } else {
      const decimalParts = formatted.split('.');
      if (decimalParts[1].length < 2) {
        formatted = numericValue.toFixed(2);
      }
    }
    
    return formatted;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Update contract
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl(`/api/contracts/${resolvedParams.id}`), {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          amount_of_money: parseFloat(editForm.amount_of_money),
          amount_of_coins: parseFloat(editForm.amount_of_coins),
          coin_rate: parseFloat(editForm.coin_rate),
          payment_status: editForm.payment_status,
          contract_status: editForm.contract_status,
          status: editForm.status,
          investment_date: editForm.investment_date.split('T')[0], // Ensure YYYY-MM-DD format
          notes: editForm.notes
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update contract');
      }

      // Upload document if provided
      if (editForm.document) {
        console.log('📤 Starting document upload...', {
          name: editForm.document.name,
          size: editForm.document.size,
          type: editForm.document.type
        });

        const formData = new FormData();
        formData.append('file', editForm.document);

        const uploadResponse = await fetch(getApiUrl('/api/upload'), {
          method: 'POST',
          body: formData,
        });

        console.log('📥 Upload response status:', uploadResponse.status);
        const uploadData = await uploadResponse.json();
        console.log('📥 Upload response data:', uploadData);

        if (uploadResponse.ok && uploadData.success) {
          console.log('✅ File uploaded, now linking to contract...');
          
          const documentPayload = {
            document_name: editForm.document.name,
            document_url: uploadData.data.url,
            document_type: editForm.document.type,
            file_size: editForm.document.size,
            uploaded_by: null // Use null instead of hardcoded user ID
          };
          
          console.log('📎 Document payload:', documentPayload);

          const docHeaders: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            docHeaders['Authorization'] = `Bearer ${token}`;
          }
          const docResponse = await fetch(getApiUrl(`/api/contracts/${resolvedParams.id}/documents`), {
            method: 'POST',
            headers: docHeaders,
            body: JSON.stringify(documentPayload),
          });

          console.log('📥 Document link response status:', docResponse.status);
          const docData = await docResponse.json();
          console.log('📥 Document link response data:', docData);

          if (!docResponse.ok) {
            console.error('❌ Document linking failed:', docData.error);
            setError(`Contract updated but document upload failed: ${docData.error || 'Unknown error'}`);
            setTimeout(() => setError(''), 5000);
          } else {
            console.log('✅ Document linked successfully!');
            setSuccessMessage('Contract and document updated successfully!');
          }
        } else {
          console.error('❌ Document upload failed:', uploadData.error);
          setError(`Contract updated but document upload failed: ${uploadData.error || 'Unknown error'}`);
          setTimeout(() => setError(''), 5000);
        }
      } else {
        setSuccessMessage('Contract updated successfully!');
      }

      setIsEditing(false);
      fetchContract(); // Refresh data
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contract');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(''); // Clear any previous errors
      
      // Store investor_id before deletion
      const investorId = contract?.investor_id;
      
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl(`/api/contracts/${resolvedParams.id}`), {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete contract');
      }

      setShowDeleteModal(false);
      setSuccessMessage('Contract deleted successfully!');
      
      // Redirect after a brief delay to show success message
      setTimeout(() => {
        if (investorId) {
          router.push(`/dashboard/investor/${investorId}`);
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contract');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const deleteDocument = async (documentId: number) => {
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(getApiUrl(`/api/contracts/${resolvedParams.id}/documents/${documentId}`), {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        fetchContract(); // Refresh to update documents list
        setSuccessMessage('Document deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "Contract not found"}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Redirecting to dashboard...</p>
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
              href={`/dashboard/investor/${contract.investor_id}`}
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

        {/* Contract Header */}
        <div className="mb-8 rounded-xl border border-zinc-200 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold dark:text-white">
                Contract #{contract.id}
              </h1>
              <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                Investor: {contract.full_name} {contract.last_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  contract.status === 'contract sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  contract.status === 'signed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  contract.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {contract.status}
              </span>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  contract.payment_status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {contract.payment_status}
              </span>

              {!isEditing ? (
                <>
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !contract.documents || contract.documents.length === 0}
                    title={!contract.documents || contract.documents.length === 0 ? "Upload documents first to send email" : "Send contract email with documents"}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed ${
                      !contract.documents || contract.documents.length === 0
                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-purple-600 hover:bg-purple-700 disabled:opacity-50'
                    }`}
                  >
                    {sendingEmail ? 'Sending...' : contract.documents && contract.documents.length > 0 ? 'Send Email' : 'No Documents'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
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
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        amount_of_money: contract.amount_of_money.toString(),
                        amount_of_coins: contract.amount_of_coins.toString(),
                        coin_rate: contract.coin_rate.toString(),
                        payment_status: contract.payment_status,
                        contract_status: contract.contract_status,
                        status: contract.status || 'pending',
                        investment_date: contract.investment_date,
                        notes: contract.notes || '',
                        document: null
                      });
                    }}
                    disabled={saving}
                    className="rounded-lg bg-zinc-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contract Details */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Amount of Money
              </div>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrency(editForm.amount_of_money)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, '');
                      handleInputChange("amount_of_money", rawValue);
                    }}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 pl-8 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-zinc-500 text-sm">$</span>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-2xl font-bold dark:text-white">
                  ${formatCurrency(contract.amount_of_money)}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Amount of Coins
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formatCoins(editForm.amount_of_coins)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/,/g, '');
                    handleInputChange("amount_of_coins", rawValue);
                  }}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              ) : (
                <div className="mt-1 text-2xl font-bold dark:text-white">
                  {formatCoins(contract.amount_of_coins)}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Coin Rate
              </div>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={`$${formatCoinRate(editForm.coin_rate)}`}
                    readOnly
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 cursor-not-allowed"
                    title="Coin rate is automatically calculated as: Amount of Money ÷ Amount of Coins"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Auto-calculated: Amount of Money ÷ Amount of Coins
                  </p>
                </div>
              ) : (
                <div className="mt-1 text-2xl font-bold dark:text-white">
                  ${formatCoinRate(contract.coin_rate)}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Payment Status
              </div>
              {isEditing ? (
                <select
                  value={editForm.payment_status}
                  onChange={(e) => handleInputChange("payment_status", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-400"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {contract.payment_status}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Status
              </div>
              {isEditing ? (
                <select
                  value={editForm.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 text-zinc-400"
                >
                  <option value="pending">Pending</option>
                  <option value="contract sent">Contract Sent</option>
                  <option value="signed">Signed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    contract.status === 'contract sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    contract.status === 'signed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    contract.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {contract.status}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Investment Date
              </div>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.investment_date}
                  onChange={(e) => handleInputChange("investment_date", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {new Date(contract.investment_date).toLocaleDateString()}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Created Date
              </div>
              <div className="mt-1 text-base dark:text-white">
                {new Date(contract.created_at).toLocaleDateString()}
              </div>
            </div>

            {isEditing && (
              <div className="col-span-full">
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Notes
                </div>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  placeholder="Enter notes about this contract..."
                />
              </div>
            )}

            {isEditing && (
              <div className="col-span-full">
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Add Document
                </div>
                <div className="mt-1">
                  <input
                    type="file"
                    onChange={handleDocumentChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 dark:hover:file:bg-blue-900/30"
                  />
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Upload contract document (PDF, Word, or Image). Maximum 10MB.
                  </p>
                  {editForm.document && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {editForm.document.name}
                    </div>
                  )}
                  {docError && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {docError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isEditing && contract.notes && (
            <div className="mt-6">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Notes
              </div>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                {contract.notes}
              </p>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="mb-8 rounded-xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
          <h2 className="mb-6 text-xl font-bold dark:text-white">
            Documents ({contract.documents?.length || 0})
          </h2>
          {contract.documents && contract.documents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contract.documents.map((document) => (
                <div key={document.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {document.document_name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {(document.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(document.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={document.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    >
                      View
                    </a>
                    <button
                      onClick={() => deleteDocument(document.id)}
                      className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">No documents found for this contract.</p>
              <p className="text-xs">Click "Edit" to add documents to this contract.</p>
            </div>
          )}
        </div>

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
                  Delete Contract
                </h3>
                <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  Are you sure you want to delete Contract #{contract.id}? This action cannot be undone and will permanently remove all contract data and documents.
                </p>
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