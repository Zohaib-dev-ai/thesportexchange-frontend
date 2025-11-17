"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated } from "../../../lib/auth";
import { getApiUrl, getDocumentUrl } from "../../../lib/api";

interface Document {
  id: number;
  document_name: string;
  document_url: string;
  document_type: string;
  file_size: number;
  uploaded_at: string;
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
  notes: string;
  documents?: Document[];
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
  const [documents, setDocuments] = useState<File[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [newDocumentUrl, setNewDocumentUrl] = useState("");
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [addingDocument, setAddingDocument] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    // Check authentication using auth service
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchInvestor();
  }, [resolvedParams.id, router]);

  const fetchInvestor = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/investors/${resolvedParams.id}`));
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedInvestor(investor);
    setDocuments([]);
  };

  const handleSave = async () => {
    if (!editedInvestor) return;

    try {
      setSaving(true);
      setError("");
      
      const response = await fetch(getApiUrl(`/api/investors/${resolvedParams.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: editedInvestor.full_name,
          last_name: editedInvestor.last_name,
          email: editedInvestor.email,
          phone: editedInvestor.phone,
          amount_of_money: editedInvestor.amount_of_money,
          amount_of_coins: editedInvestor.amount_of_coins,
          investment_date: editedInvestor.investment_date,
          status: editedInvestor.status,
          notes: editedInvestor.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update investor');
      }

      setInvestor(editedInvestor);
      setIsEditing(false);
      setDocuments([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...newFiles]);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetch(getApiUrl(`/api/investors/${resolvedParams.id}/documents?documentId=${docId}`), {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete document');
      }

      // Refresh investor data to update documents list
      fetchInvestor();
      setSuccessMessage('Document deleted successfully');
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleAddDocument = async () => {
    // Validation
    if (uploadMethod === 'file') {
      if (!selectedFile) {
        setError('Please select a file to upload');
        return;
      }
    } else {
      if (!newDocumentUrl) {
        setError('Please provide a document URL');
        return;
      }
      if (!newDocumentName) {
        setError('Please provide a document name');
        return;
      }
    }

    try {
      setAddingDocument(true);
      let documentUrl = newDocumentUrl;
      let documentName = newDocumentName;

      // If uploading a file, upload it first
      if (uploadMethod === 'file' && selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await fetch(getApiUrl('/api/upload'), {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload file');
        }

        documentUrl = uploadData.data.url;
        documentName = uploadData.data.filename; // Use the original filename
        setUploading(false);
      }

      // Now save the document record
      const response = await fetch(getApiUrl(`/api/investors/${resolvedParams.id}/documents`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_name: documentName || 'Untitled Document',
          document_url: documentUrl,
          document_type: uploadMethod === 'file' ? selectedFile?.type : 'external_url',
          file_size: uploadMethod === 'file' ? selectedFile?.size : null,
          uploaded_by: 1, // Admin user ID
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add document');
      }

      setSuccessMessage('Document added successfully!');
      setShowAddDocumentModal(false);
      setNewDocumentName('');
      setNewDocumentUrl('');
      setSelectedFile(null);
      setUploadMethod('file');
      fetchInvestor();
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document');
    } finally {
      setAddingDocument(false);
      setUploading(false);
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
      const response = await fetch(getApiUrl(`/api/investors/${resolvedParams.id}/change-password`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(getApiUrl(`/api/investors/${investor.id}`), {
        method: 'DELETE',
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading investor details...</p>
        </div>
      </div>
    );
  }

  if (error || !investor || !editedInvestor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
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
      case "Paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold dark:text-white">
                {displayInvestor.full_name}
              </h1>
              <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                Investor ID: #{displayInvestor.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(
                  displayInvestor.status
                )}`}
              >
                {displayInvestor.status}
              </span>
              {!isEditing ? (
                <>
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
                Full Name
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
              <div className="mt-1 text-base dark:text-white">
                <div className="px-3 py-2 rounded-lg border border-zinc-200">{displayInvestor.email}</div>
              </div>
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
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Amount of Money
              </div>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={editedInvestor.amount_of_money}
                  onChange={(e) => handleInputChange("amount_of_money", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              ) : (
                <div className="mt-1 text-2xl font-bold dark:text-white">
                  ${displayInvestor.amount_of_money.toLocaleString()}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Amount of Coins
              </div>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={editedInvestor.amount_of_coins}
                  onChange={(e) => handleInputChange("amount_of_coins", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {displayInvestor.amount_of_coins.toLocaleString()}
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
                  value={editedInvestor.investment_date ? new Date(editedInvestor.investment_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange("investment_date", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {displayInvestor.investment_date ? new Date(displayInvestor.investment_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : 'N/A'}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Status
              </div>
              {isEditing ? (
                <select
                  value={editedInvestor.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Signed">Signed</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              ) : (
                <div className="mt-1 text-base dark:text-white">
                  {displayInvestor.status}
                </div>
              )}
            </div>
            <div className="sm:col-span-3">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Documents
              </div>
              {isEditing ? (
                <div className="mt-1 space-y-3">
                  {/* Add Document Button */}
                  <button
                    type="button"
                    onClick={() => setShowAddDocumentModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-6 transition-colors hover:border-blue-400 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:bg-blue-900/30"
                  >
                    <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium text-blue-700 dark:text-blue-300">Add Document</span>
                  </button>

                  {/* Existing Documents */}
                  {investor.documents && investor.documents.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">Existing Documents:</p>
                      {investor.documents.map((doc) => (
                        <div
                          key={`existing-${doc.id}`}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 mb-2 dark:border-zinc-700 dark:bg-zinc-800"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                              <p className="text-xs font-medium text-zinc-900 dark:text-white">{doc.document_name}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <a href={getDocumentUrl(doc.document_url)} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                            <button type="button" onClick={() => handleRemoveExistingDocument(doc.id)} className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-1">
                  {investor.documents && investor.documents.length > 0 ? (
                    <div className="space-y-2">
                      {investor.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={getDocumentUrl(doc.document_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {doc.document_name}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">No documents uploaded</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Investment Details */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Notes Section */}
          <div className="rounded-xl border border-zinc-200 p-6 shadow-sm dark:bg-zinc-800">
            <h2 className="mb-4 text-xl font-bold dark:text-white">
              Investment Notes
            </h2>
            {isEditing ? (
              <textarea
                value={editedInvestor.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
                className="text-white w-full rounded-lg border border-zinc-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                placeholder="Enter notes about this investor..."
              />
            ) : (
              <p className="text-zinc-700 dark:text-zinc-300">
                {displayInvestor.notes || "No notes available for this investor."}
              </p>
            )}
          </div>

          {/* Account Settings */}
          <div className="rounded-xl border border-zinc-200 p-6 shadow-sm dark:bg-zinc-800">
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
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-2xl font-bold dark:text-white">Change Password</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Set a new password for {investor.full_name}
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
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Document Modal */}
        {showAddDocumentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-2xl font-bold dark:text-white">Add Document</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Add a document for {investor.full_name}
              </p>

              {/* Upload Method Tabs */}
              <div className="mt-6 flex rounded-lg border border-zinc-300 dark:border-zinc-700">
                <button
                  onClick={() => setUploadMethod('file')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    uploadMethod === 'file'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  } rounded-l-lg`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setUploadMethod('url')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    uploadMethod === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  } rounded-r-lg`}
                >
                  Enter URL
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {uploadMethod === 'file' ? (
                  <div>
                    <label htmlFor="fileUpload" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Select File
                    </label>
                    <div className="mt-1">
                      <input
                        type="file"
                        id="fileUpload"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-zinc-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-zinc-300 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      />
                      {selectedFile && (
                        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="documentName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Document Name
                      </label>
                      <input
                        type="text"
                        id="documentName"
                        value={newDocumentName}
                        onChange={(e) => setNewDocumentName(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                        placeholder="e.g., Investment Contract"
                      />
                    </div>
                    <div>
                      <label htmlFor="documentUrl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Document URL
                      </label>
                      <input
                        type="url"
                        id="documentUrl"
                        value={newDocumentUrl}
                        onChange={(e) => setNewDocumentUrl(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                        placeholder="https://example.com/document.pdf"
                      />
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Enter the URL where the document is hosted (Google Drive, Dropbox, etc.)
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleAddDocument}
                  disabled={addingDocument || uploading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : addingDocument ? 'Adding...' : 'Add Document'}
                </button>
                <button
                  onClick={() => {
                    setShowAddDocumentModal(false);
                    setNewDocumentName('');
                    setNewDocumentUrl('');
                    setSelectedFile(null);
                    setUploadMethod('file');
                  }}
                  disabled={addingDocument || uploading}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 font-semibold transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
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
                  Delete Investor
                </h3>
                <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  Are you sure you want to delete {investor?.full_name}? This action cannot be undone and will permanently remove all investor data and documents.
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
