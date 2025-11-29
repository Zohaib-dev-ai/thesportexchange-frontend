"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../components/AdminHeader";
import { isAuthenticated, getUserEmail } from "../../lib/auth";
import { getApiUrl, getDocumentUrl } from "../../lib/api";

interface NewsletterAttachment {
  attachment_name: string;
  attachment_url: string;
  file_size?: number;
}

interface Newsletter {
  id: number;
  subject: string;
  message: string;
  sent_date: string;
  sent_by: number;
  recipient_count: number;
  attachment_count: number;
  attachments?: NewsletterAttachment[];
  recipient_emails?: string[];
  recipient_statuses?: { email: string; full_name: string; status: string }[];
}

export default function NewsletterPage() {
  const [userEmail, setUserEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"send" | "history">("send");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(false);
  const [investors, setInvestors] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [recipientMode, setRecipientMode] = useState<"all" | "new" | "pending" | "signed" | "cancelled" | "manual">("all");
  const [selectedInvestors, setSelectedInvestors] = useState<number[]>([]);
  const [showInvestorList, setShowInvestorList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const investorsPerPage = 10;
  const [historyFilter, setHistoryFilter] = useState<"all" | "new" | "pending" | "signed" | "cancelled">("all");
  const [newInvestors, setNewInvestors] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    if (!isAuthenticated()) {
      router.push("/login-admin");
      return;
    }

    const email = getUserEmail();
    setUserEmail(email || "User");
    
    // Fetch investors, contracts and newsletter history
    fetchInvestors();
    fetchContracts();
    fetchNewsletters();
    fetchNewInvestors();
  }, [router]);

  const fetchInvestors = async () => {
    try {
      const response = await fetch(getApiUrl('/api/investors'));
      const data = await response.json();
      if (data.success) {
        setInvestors(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch investors:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await fetch(getApiUrl('/api/contracts'));
      const data = await response.json();
      if (data.success) {
        setContracts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
  };

  const fetchNewInvestors = async () => {
    try {
      const response = await fetch(getApiUrl('/api/investors/new/recipients'));
      const data = await response.json();
      if (data.success) {
        setNewInvestors(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch new investors:', error);
    }
  };

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/newsletter/history'));
      const data = await response.json();
      if (data.success) {
        setNewsletters(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
      setErrorMessage("");
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!subject || !message) {
      setErrorMessage("Subject and message are required");
      return;
    }

    // Get recipient IDs based on selected mode
    let recipientIds: number[] = [];
    let filteredInvestors: any[] = [];

    if (recipientMode === "manual") {
      if (selectedInvestors.length === 0) {
        setErrorMessage("Please select at least one investor");
        return;
      }
      recipientIds = selectedInvestors;
      filteredInvestors = investors.filter(inv => selectedInvestors.includes(inv.id));
    } else if (recipientMode === "all") {
      recipientIds = investors.map(inv => inv.id);
      filteredInvestors = investors;
    } else {
      // Filter by contract status (not investor status)
      const statusMap: { [key: string]: string } = {
        "pending": "pending",
        "signed": "signed", 
        "cancelled": "cancelled"
      };
      
      if (recipientMode === "new") {
        filteredInvestors = newInvestors;
        recipientIds = filteredInvestors.map(inv => inv.id);
      } else {
        // Filter investors who have contracts with the specified status
        const contractsWithStatus = contracts.filter(contract => contract.status === statusMap[recipientMode]);
        const investorIds = contractsWithStatus.map(contract => contract.investor_id);
        filteredInvestors = investors.filter(inv => investorIds.includes(inv.id));
        recipientIds = filteredInvestors.map(inv => inv.id);
      }
      
      if (recipientIds.length === 0) {
        setErrorMessage(`No investors found with contracts having "${recipientMode}" status`);
        return;
      }
    }

    setIsSending(true);

    try {
      // Upload attachments first if any
      const uploadedAttachments: NewsletterAttachment[] = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await fetch(getApiUrl('/api/upload'), {
            method: 'POST',
            body: formData,
          });
          
          const uploadData = await uploadResponse.json();
          
          if (uploadData.success) {
            uploadedAttachments.push({
              attachment_name: uploadData.data.filename,
              attachment_url: uploadData.data.url,
              file_size: uploadData.data.size,
            });
          }
        }
      }
      
      const response = await fetch(getApiUrl('/api/newsletter/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
          recipients: recipientIds,
          attachments: uploadedAttachments,
          sent_by: null, // No user system yet
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send newsletter');
      }
      
      setSuccessMessage(`Newsletter sent successfully to ${recipientIds.length} investor${recipientIds.length > 1 ? 's' : ''}!${attachments.length > 0 ? ` (with ${attachments.length} attachment${attachments.length > 1 ? 's' : ''})` : ''}`);
      setSubject("");
      setMessage("");
      setAttachments([]);
      setSelectedInvestors([]);
      setRecipientMode("all");
      setShowInvestorList(false);
      
      // Refresh newsletter history
      fetchNewsletters();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send newsletter. Please try again.");
      console.error("Newsletter error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const toggleInvestorSelection = (investorId: number) => {
    setSelectedInvestors(prev =>
      prev.includes(investorId)
        ? prev.filter(id => id !== investorId)
        : [...prev, investorId]
    );
  };

  const getFilteredInvestors = () => {
    if (recipientMode === "all" || recipientMode === "manual") {
      return investors;
    }
    if (recipientMode === "new") {
      return newInvestors;
    }
    const statusMap: { [key: string]: string } = {
      "pending": "pending",
      "signed": "signed",
      "cancelled": "cancelled"
    };
    // Filter investors who have contracts with the specified status
    const contractsWithStatus = contracts.filter(contract => contract.status === statusMap[recipientMode]);
    const investorIds = contractsWithStatus.map(contract => contract.investor_id);
    return investors.filter(inv => investorIds.includes(inv.id));
  };

  const getRecipientCount = () => {
    if (recipientMode === "manual") {
      return selectedInvestors.length;
    }
    return getFilteredInvestors()?.length || 0;
  };

  const getSearchFilteredInvestors = () => {
    if (!searchQuery.trim()) return investors;
    
    const query = searchQuery.toLowerCase();
    // Optimized search - only searches visible fields
    return investors.filter(inv => {
      const fullName = `${inv.full_name || ''} ${inv.last_name || ''}`.toLowerCase();
      const email = (inv.email || '').toLowerCase();
      
      // Get contract status for this investor
      const investorContract = contracts.find(contract => contract.investor_id === inv.id);
      const contractStatus = (investorContract?.status || 'pending').toLowerCase();
      
      return fullName.includes(query) || email.includes(query) || contractStatus.includes(query);
    });
  };

  const getPaginatedInvestors = () => {
    const filtered = getSearchFilteredInvestors();
    const startIndex = (currentPage - 1) * investorsPerPage;
    const endIndex = startIndex + investorsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getSearchFilteredInvestors();
    return Math.ceil(filtered.length / investorsPerPage);
  };

  const getFilteredNewsletters = () => {
    if (historyFilter === "all") return newsletters;
    
    if (historyFilter === "new") {
      // Filter newsletters that were sent to new investors (investors who never received emails)
      const newInvestorEmails = newInvestors.map(inv => inv.email);
      return newsletters.filter(newsletter => {
        // Check if any recipient of this newsletter is a new investor
        return newsletter.recipient_emails?.some((email: string) => 
          newInvestorEmails.includes(email)
        );
      });
    }
    
    // For other history filters, show all newsletters
    // Future enhancement: filter based on recipient contract status if needed
    return newsletters;
  };

  const getStatusCount = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "Pending": "pending",
      "Signed": "signed",
      "Cancelled": "cancelled"
    };
    const contractsWithStatus = contracts.filter(contract => contract.status === statusMap[status]);
    const investorIds = contractsWithStatus.map(contract => contract.investor_id);
    return investors.filter(inv => investorIds.includes(inv.id)).length;
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

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold dark:text-white">
            Newsletter
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Send updates and view newsletter history
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("send")}
              className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                activeTab === "send"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <svg className="inline-block h-5 w-5 mr-2 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Newsletter
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <svg className="inline-block h-5 w-5 mr-2 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History ({newsletters.length})
            </button>
          </nav>
        </div>

        {/* Send Newsletter Tab */}
        {activeTab === "send" && (
        <div className="max-full">
        <div className="rounded-xl border border-zinc-200 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Mode Selection */}
            <div>
              <label className="block text-sm font-medium dark:text-zinc-300 mb-3">
                Select Recipients
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientMode("all");
                    setShowInvestorList(false);
                    setSelectedInvestors([]);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    recipientMode === "all"
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  All
                  <span className="block text-xs mt-1 opacity-70">({investors.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientMode("new");
                    setShowInvestorList(false);
                    setSelectedInvestors([]);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    recipientMode === "new"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  New
                  <span className="block text-xs mt-1 opacity-70">({newInvestors.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientMode("pending");
                    setShowInvestorList(false);
                    setSelectedInvestors([]);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    recipientMode === "pending"
                      ? "border-yellow-600 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  Pending Contracts
                  <span className="block text-xs mt-1 opacity-70">
                    ({getStatusCount("Pending")})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientMode("signed");
                    setShowInvestorList(false);
                    setSelectedInvestors([]);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    recipientMode === "signed"
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  Signed Contracts
                  <span className="block text-xs mt-1 opacity-70">
                    ({getStatusCount("Signed")})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientMode("cancelled");
                    setShowInvestorList(false);
                    setSelectedInvestors([]);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    recipientMode === "cancelled"
                      ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  Cancelled Contracts
                  <span className="block text-xs mt-1 opacity-70">
                    ({getStatusCount("Cancelled")})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientMode("manual");
                    setShowInvestorList(true);
                    setSelectedInvestors([]);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    recipientMode === "manual"
                      ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  Manual
                  <span className="block text-xs mt-1 opacity-70">Select</span>
                </button>
              </div>
            </div>

            {/* Manual Investor Selection */}
            {showInvestorList && recipientMode === "manual" && (
              <div className="border border-zinc-200 rounded-lg p-4 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium dark:text-zinc-300">
                    Select Investors ({selectedInvestors.length} selected of {investors.length} total)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedInvestors(getSearchFilteredInvestors().map(inv => inv.id))}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      title={searchQuery ? `Select all ${getSearchFilteredInvestors().length} filtered results` : `Select all ${investors.length} investors`}
                    >
                      Select All {searchQuery ? 'Filtered' : ''} ({searchQuery ? getSearchFilteredInvestors().length : investors.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedInvestors([])}
                      className="text-xs px-3 py-1 bg-zinc-200 text-zinc-700 rounded hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search by name, email, or contract status..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  />
                  {searchQuery && (
                    <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
                      Found {getSearchFilteredInvestors().length} investor(s) - Showing page {currentPage} of {getTotalPages()}
                    </p>
                  )}
                  {!searchQuery && investors.length > 100 && (
                    <p className="text-xs text-blue-600 mt-1 dark:text-blue-400">
                      💡 Tip: Use search to quickly find investors from {investors.length} total
                    </p>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 mb-3">
                  {getPaginatedInvestors().length > 0 ? (
                    getPaginatedInvestors().map(investor => {
                      // Get contract status for this investor
                      const investorContract = contracts.find(contract => contract.investor_id === investor.id);
                      const contractStatus = investorContract?.status || 'pending';
                      
                      return (
                    <label
                      key={investor.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedInvestors.includes(investor.id)}
                        onChange={() => toggleInvestorSelection(investor.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm dark:text-white">
                          {investor.email}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        contractStatus === 'signed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        contractStatus === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                        contractStatus === 'contract sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {contractStatus}
                      </span>
                    </label>
                    )})
                  ) : (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                      No investors found matching "{searchQuery}"
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {getTotalPages() > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="text-xs px-3 py-1 bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      Page {currentPage} of {getTotalPages()} ({getSearchFilteredInvestors().length} total)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                      disabled={currentPage === getTotalPages()}
                      className="text-xs px-3 py-1 bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subject */}
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium dark:text-zinc-300"
              >
                Subject
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                placeholder="Enter newsletter subject"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium dark:text-zinc-300"
              >
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                placeholder="Enter your message here..."
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium dark:text-zinc-300 mb-2">
                Attachments (Optional)
              </label>
              
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
                <label
                  htmlFor="file-upload"
                  className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 px-6 py-12 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                >
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Click to upload or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Multiple files supported - PDF, DOC, XLS, PNG, JPG (MAX. 10MB each)
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploaded Files List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Attached Files ({attachments.length}):
                  </p>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="h-8 w-8 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSending || getRecipientCount() === 0}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? "Sending..." : `Send Newsletter to ${getRecipientCount()} Investor${getRecipientCount() !== 1 ? 's' : ''}`}
            </button>
          </form>
        </div>
        </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
        <div>
          {/* Status Filter Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => setHistoryFilter("all")}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                historyFilter === "all"
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              All Newsletters
              <span className="ml-2 text-xs opacity-70">({newsletters.length})</span>
            </button>
            <button
              onClick={() => setHistoryFilter("new")}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                historyFilter === "new"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              New Recipients
              <span className="ml-2 text-xs opacity-70">({newInvestors.length} investors)</span>
            </button>
            <button
              onClick={() => setHistoryFilter("pending")}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                historyFilter === "pending"
                  ? "border-yellow-600 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              Pending Recipients
              <span className="ml-2 text-xs opacity-70">({getStatusCount("Pending")} investors)</span>
            </button>
            <button
              onClick={() => setHistoryFilter("signed")}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                historyFilter === "signed"
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              Signed Recipients
              <span className="ml-2 text-xs opacity-70">({getStatusCount("Signed")} investors)</span>
            </button>

            <button
              onClick={() => setHistoryFilter("cancelled")}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                historyFilter === "cancelled"
                  ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              Cancelled Recipients
              <span className="ml-2 text-xs opacity-70">({getStatusCount("Cancelled")} investors)</span>
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-zinc-200 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading newsletters...</p>
            </div>
          ) : getFilteredNewsletters().length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {getFilteredNewsletters().map((newsletter) => (
              <div
                key={newsletter.id}
                className="rounded-xl border border-zinc-200 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold dark:text-white">
                      {newsletter.subject}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatNewsletterDate(newsletter.sent_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {newsletter.recipient_count} recipient{newsletter.recipient_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Preview */}
                <p className="mb-4 line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">
                  {newsletter.message}
                </p>

                {/* Attachments */}
                {newsletter.attachment_count > 0 && newsletter.attachments && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
                      {newsletter.attachment_count} Attachment{newsletter.attachment_count > 1 ? 's' : ''}:
                    </p>
                    {newsletter.attachments.map((attachment: NewsletterAttachment, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 mb-1 dark:bg-blue-900/20">
                        <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="flex-1 text-sm text-blue-900 dark:text-blue-300">
                          {attachment.attachment_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedNewsletter(newsletter)}
                    className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    View Full Message
                  </button>
                  {newsletter.attachment_count > 0 && newsletter.attachments && newsletter.attachments.length === 1 && (
                    <a
                      href={getDocumentUrl(newsletter.attachments[0].attachment_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-zinc-200 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold dark:text-white">No newsletters sent yet</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Start sending newsletters to your investors.
              </p>
              <button
                onClick={() => setActiveTab("send")}
                className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Send Newsletter
              </button>
            </div>
          )}
        </div>
        )}

        {/* Newsletter Detail Modal */}
        {selectedNewsletter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
              <button
                onClick={() => setSelectedNewsletter(null)}
                className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="pr-8">
                <h2 className="text-2xl font-bold dark:text-white">
                  {selectedNewsletter.subject}
                </h2>
                
                <div className="mt-4 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatNewsletterDate(selectedNewsletter.sent_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {selectedNewsletter.recipient_count} recipient{selectedNewsletter.recipient_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {selectedNewsletter.attachments && selectedNewsletter.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Attachments ({selectedNewsletter.attachments.length}):
                    </p>
                    {selectedNewsletter.attachments.map((attachment: NewsletterAttachment, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="flex-1 text-sm font-medium text-blue-900 dark:text-blue-300">
                          {attachment.attachment_name}
                        </span>
                        <a
                          href={getDocumentUrl(attachment.attachment_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  {selectedNewsletter.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
