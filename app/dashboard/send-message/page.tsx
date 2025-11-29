"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../components/AdminHeader";
import { isAuthenticated } from "../../lib/auth";
import { getApiUrl } from "../../lib/api";

interface MessageAttachment {
  attachment_name: string;
  attachment_url: string;
  file_size?: number;
}

export default function SendMessagePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"send" | "history">("send");
  const [sendTab, setSendTab] = useState<"contracts" | "investors" | "tcf">("contracts");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [investors, setInvestors] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [tcfSubmissions, setTcfSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Contract-related states
  const [contractRecipientMode, setContractRecipientMode] = useState<"all" | "new" | "pending" | "signed" | "cancelled" | "manual">("all");
  const [selectedContracts, setSelectedContracts] = useState<number[]>([]);
  
  // Investor-related states  
  const [investorRecipientMode, setInvestorRecipientMode] = useState<"all" | "manual">("all");
  const [selectedInvestors, setSelectedInvestors] = useState<number[]>([]);
  
  // TCF-related states
  const [tcfRecipientMode, setTcfRecipientMode] = useState<"all" | "manual">("all");
  const [selectedTcfSubmissions, setSelectedTcfSubmissions] = useState<number[]>([]);
  
  const [showInvestorList, setShowInvestorList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [newInvestors, setNewInvestors] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    if (!isAuthenticated()) {
      router.push("/login-admin");
      return;
    }
    
    fetchInvestors();
    fetchContracts();
    fetchMessages();
    fetchNewInvestors();
    fetchTcfSubmissions();
  }, [router]);

  const fetchTcfSubmissions = async () => {
    try {
      const response = await fetch(getApiUrl('/api/tcf'));
      const data = await response.json();
      if (data.success) {
        setTcfSubmissions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch TCF submissions:', error);
      // Fallback to empty array
      setTcfSubmissions([]);
    }
  };

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
      // For now, we'll use the same investors data
      // TODO: Implement proper new investors endpoint on backend
      const response = await fetch(getApiUrl('/api/investors'));
      const data = await response.json();
      if (data.success) {
        // Filter investors who might be considered "new" (created recently)
        const recentInvestors = data.data.filter((inv: any) => {
          const createdDate = new Date(inv.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdDate >= thirtyDaysAgo;
        });
        setNewInvestors(recentInvestors);
      }
    } catch (error) {
      console.error('Failed to fetch new investors:', error);
      // Fallback to empty array
      setNewInvestors([]);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/newsletter/history'));
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch message history:', error);
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

    // Get recipient IDs and emails based on selected tab and mode
    let recipientIds: number[] = [];
    let recipientEmails: string[] = [];
    let filteredData: any[] = [];

    if (sendTab === "contracts") {
      // Contract-based recipients
      if (contractRecipientMode === "manual") {
        if (selectedContracts.length === 0) {
          setErrorMessage("Please select at least one contract");
          return;
        }
        const selectedContractData = contracts.filter(contract => selectedContracts.includes(contract.id));
        recipientIds = selectedContractData.map(contract => contract.investor_id);
        recipientEmails = selectedContractData.map(contract => contract.email);
        filteredData = selectedContractData;
      } else if (contractRecipientMode === "all") {
        recipientIds = contracts.map(contract => contract.investor_id);
        recipientEmails = contracts.map(contract => contract.email);
        filteredData = contracts;
      } else {
        // Filter by contract status
        const statusMap: { [key: string]: string } = {
          "pending": "pending",
          "signed": "signed",
          "cancelled": "cancelled"
        };
        
        if (contractRecipientMode === "new") {
          recipientIds = newInvestors.map(inv => inv.id);
          recipientEmails = newInvestors.map(inv => inv.email);
          filteredData = newInvestors;
        } else {
          const contractsWithStatus = contracts.filter(contract => contract.status === statusMap[contractRecipientMode]);
          recipientIds = contractsWithStatus.map(contract => contract.investor_id);
          recipientEmails = contractsWithStatus.map(contract => contract.email);
          filteredData = contractsWithStatus;
        }
        
        if (recipientIds.length === 0) {
          setErrorMessage(`No contracts found with "${contractRecipientMode}" status`);
          return;
        }
      }
    } else if (sendTab === "investors") {
      // Investor-based recipients
      if (investorRecipientMode === "manual") {
        if (selectedInvestors.length === 0) {
          setErrorMessage("Please select at least one investor");
          return;
        }
        recipientIds = selectedInvestors;
        filteredData = investors.filter(inv => selectedInvestors.includes(inv.id));
        recipientEmails = filteredData.map(inv => inv.email);
      } else {
        recipientIds = investors.map(inv => inv.id);
        recipientEmails = investors.map(inv => inv.email);
        filteredData = investors;
      }
    } else if (sendTab === "tcf") {
      // TCF submission-based recipients
      if (tcfRecipientMode === "manual") {
        if (selectedTcfSubmissions.length === 0) {
          setErrorMessage("Please select at least one TCF submission");
          return;
        }
        const selectedTcfData = tcfSubmissions.filter(tcf => selectedTcfSubmissions.includes(tcf.id));
        recipientEmails = selectedTcfData.map(tcf => tcf.email);
        // For TCF, we send directly to email addresses
        recipientIds = selectedTcfData.map(tcf => tcf.id);
        filteredData = selectedTcfData;
      } else {
        recipientEmails = tcfSubmissions.map(tcf => tcf.email);
        recipientIds = tcfSubmissions.map(tcf => tcf.id);
        filteredData = tcfSubmissions;
      }
    }

    setIsSending(true);

    try {
      // Upload attachments first if any
      const uploadedAttachments: MessageAttachment[] = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await fetch(getApiUrl('/api/upload'), {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok || !uploadData.success) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          uploadedAttachments.push({
            attachment_name: file.name,
            attachment_url: uploadData.data.url,
            file_size: file.size,
          });
        }
      }

      // Use appropriate endpoint based on tab
      let endpoint = '/api/newsletter/send';
      let requestBody: any = {
        subject,
        message,
        attachments: uploadedAttachments,
        sent_by: null, // No user system yet
      };

      if (sendTab === "tcf") {
        // For TCF submissions, send directly to email addresses
        requestBody.recipient_emails = recipientEmails;
      } else {
        // For contracts and investors, use recipient IDs
        requestBody.recipients = recipientIds;
      }

      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      const recipientCount = sendTab === "tcf" ? recipientEmails.length : recipientIds.length;
      const recipientType = sendTab === "contracts" ? "contract holder" : sendTab === "investors" ? "investor" : "TCF submission";
      
      setSuccessMessage(`Message sent successfully to ${recipientCount} ${recipientType}${recipientCount > 1 ? 's' : ''}!`);
      setSubject("");
      setMessage("");
      setAttachments([]);
      setSelectedInvestors([]);
      setSelectedContracts([]);
      setSelectedTcfSubmissions([]);
      setContractRecipientMode("all");
      setInvestorRecipientMode("all");
      setTcfRecipientMode("all");
      setShowInvestorList(false);
      
      // Refresh message history
      fetchMessages();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send message. Please try again.");
      console.error("Send message error:", error);
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

  const toggleContractSelection = (contractId: number) => {
    setSelectedContracts(prev =>
      prev.includes(contractId)
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const toggleTcfSelection = (tcfId: number) => {
    setSelectedTcfSubmissions(prev =>
      prev.includes(tcfId)
        ? prev.filter(id => id !== tcfId)
        : [...prev, tcfId]
    );
  };

  const getFilteredInvestors = () => {
    if (investorRecipientMode === "all" || investorRecipientMode === "manual") {
      return investors;
    }
    return investors;
  };

  const getFilteredContracts = () => {
    if (contractRecipientMode === "manual" || contractRecipientMode === "all") {
      return safeContracts;
    }
    if (contractRecipientMode === "new") {
      return newInvestors || [];
    }
    const statusMap: { [key: string]: string } = {
      "pending": "pending",
      "signed": "signed",
      "cancelled": "cancelled"
    };
    return safeContracts.filter(contract => contract.status === statusMap[contractRecipientMode]);
  };

  const getFilteredTcfSubmissions = () => {
    return safeTcfSubmissions;
  };

  const getRecipientCount = () => {
    if (sendTab === "contracts") {
      if (contractRecipientMode === "manual") {
        return selectedContracts.length;
      }
      return getFilteredContracts().length;
    } else if (sendTab === "investors") {
      if (investorRecipientMode === "manual") {
        return selectedInvestors.length;
      }
      return getFilteredInvestors().length;
    } else if (sendTab === "tcf") {
      if (tcfRecipientMode === "manual") {
        return selectedTcfSubmissions.length;
      }
      return getFilteredTcfSubmissions().length;
    }
    return 0;
  };

  // Add safety checks to prevent runtime errors
  const safeContracts = contracts || [];
  const safeInvestors = investors || [];
  const safeTcfSubmissions = tcfSubmissions || [];
  const safeMessages = messages || [];

  // Simple function to return all messages for history display
  const getHistoryMessages = () => {
    return safeMessages;
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
            Send Message
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Send direct messages to investors
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("send")}
              className={`pb-4 text-sm font-medium transition-colors ${
                activeTab === "send"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              Send Message
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-4 text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              History ({safeMessages.length})
            </button>
          </div>
        </div>

        {/* Send Tab */}
        {activeTab === "send" && (
        <div className="space-y-6">
          {/* Sub-tabs for Send */}
          <div className="border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex space-x-8">
              <button
                onClick={() => setSendTab("contracts")}
                className={`pb-4 text-sm font-medium transition-colors ${
                  sendTab === "contracts"
                    ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                📋 Contract Status ({safeContracts.length})
              </button>
              <button
                onClick={() => setSendTab("investors")}
                className={`pb-4 text-sm font-medium transition-colors ${
                  sendTab === "investors"
                    ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                👥 Investors ({safeInvestors.length})
              </button>
              <button
                onClick={() => setSendTab("tcf")}
                className={`pb-4 text-sm font-medium transition-colors ${
                  sendTab === "tcf"
                    ? "border-b-2 border-green-600 text-green-600 dark:text-green-400"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                }`}
              >
                📝 TCF Submissions ({safeTcfSubmissions.length})
              </button>
            </div>
          </div>

        <div className="rounded-xl border border-zinc-200 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Mode Selection - Changes based on active tab */}
            <div>
              <label className="block text-sm font-medium dark:text-zinc-300 mb-3">
                Select Recipients
              </label>
              
              {/* Contract Status Recipients */}
              {sendTab === "contracts" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setContractRecipientMode("all");
                      setShowInvestorList(false);
                      setSelectedContracts([]);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      contractRecipientMode === "all"
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    All Contracts
                    <span className="block text-xs mt-1 opacity-70">({safeContracts.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContractRecipientMode("pending");
                      setShowInvestorList(false);
                      setSelectedContracts([]);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      contractRecipientMode === "pending"
                        ? "border-yellow-600 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    Pending
                    <span className="block text-xs mt-1 opacity-70">
                      ({safeContracts.filter(c => c.status === 'pending').length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContractRecipientMode("signed");
                      setShowInvestorList(false);
                      setSelectedContracts([]);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      contractRecipientMode === "signed"
                        ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    Signed
                    <span className="block text-xs mt-1 opacity-70">
                      ({safeContracts.filter(c => c.status === 'signed').length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContractRecipientMode("cancelled");
                      setShowInvestorList(false);
                      setSelectedContracts([]);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      contractRecipientMode === "cancelled"
                        ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    Cancelled
                    <span className="block text-xs mt-1 opacity-70">
                      ({safeContracts.filter(c => c.status === 'cancelled').length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContractRecipientMode("manual");
                      setShowInvestorList(true);
                      setSelectedContracts([]);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      contractRecipientMode === "manual"
                        ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    Manual
                    <span className="block text-xs mt-1 opacity-70">Select</span>
                  </button>
                </div>
              )}

              {/* Investor Recipients */}
              {sendTab === "investors" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setInvestorRecipientMode("all");
                      setShowInvestorList(false);
                      setSelectedInvestors([]);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      investorRecipientMode === "all"
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    All Investors
                    <span className="block text-xs mt-1 opacity-70">({safeInvestors.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInvestorRecipientMode("manual");
                      setShowInvestorList(true);
                      setSelectedInvestors([]);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      investorRecipientMode === "manual"
                        ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    Manual Selection
                    <span className="block text-xs mt-1 opacity-70">Choose</span>
                  </button>
                </div>
              )}

              {/* TCF Recipients */}
              {sendTab === "tcf" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTcfRecipientMode("all");
                      setShowInvestorList(false);
                      setSelectedTcfSubmissions([]);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      tcfRecipientMode === "all"
                        ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    All TCF Submissions
                    <span className="block text-xs mt-1 opacity-70">({safeTcfSubmissions.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTcfRecipientMode("manual");
                      setShowInvestorList(true);
                      setSelectedTcfSubmissions([]);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      tcfRecipientMode === "manual"
                        ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    Manual Selection
                    <span className="block text-xs mt-1 opacity-70">Choose</span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual Selection Lists */}
            {showInvestorList && (
              <div className="border border-zinc-200 rounded-lg p-4 dark:border-zinc-700">
                {sendTab === "contracts" && contractRecipientMode === "manual" && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium dark:text-zinc-300">
                        Select Contracts ({selectedContracts.length} selected of {safeContracts.length} total)
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedContracts(safeContracts.map(contract => contract.id))}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Select All ({safeContracts.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedContracts([])}
                          className="text-xs px-3 py-1 bg-zinc-200 text-zinc-700 rounded hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {safeContracts.map(contract => (
                        <label
                          key={contract.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          <input
                            type="checkbox"
                            checked={selectedContracts.includes(contract.id)}
                            onChange={() => toggleContractSelection(contract.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium dark:text-white">
                              Contract #{contract.id} - {contract.full_name} {contract.last_name}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {contract.email} • ${contract.amount_of_money?.toLocaleString()}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            contract.status === 'signed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            contract.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                            contract.status === 'contract sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {contract.status}
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {sendTab === "investors" && investorRecipientMode === "manual" && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium dark:text-zinc-300">
                        Select Investors ({selectedInvestors.length} selected of {safeInvestors.length} total)
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvestors(safeInvestors.map(inv => inv.id))}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Select All ({safeInvestors.length})
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
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {safeInvestors.map(investor => (
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
                            <div className="text-sm font-medium dark:text-white">
                              {investor.full_name} {investor.last_name}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {investor.email} • Total: ${investor.amount_of_money?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {sendTab === "tcf" && tcfRecipientMode === "manual" && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium dark:text-zinc-300">
                        Select TCF Submissions ({selectedTcfSubmissions.length} selected of {safeTcfSubmissions.length} total)
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTcfSubmissions(safeTcfSubmissions.map(tcf => tcf.id))}
                          className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Select All ({safeTcfSubmissions.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTcfSubmissions([])}
                          className="text-xs px-3 py-1 bg-zinc-200 text-zinc-700 rounded hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {tcfSubmissions.map(tcf => (
                        <label
                          key={tcf.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTcfSubmissions.includes(tcf.id)}
                            onChange={() => toggleTcfSelection(tcf.id)}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium dark:text-white">
                              {tcf.full_name} {tcf.last_name}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {tcf.email} • Submitted: {new Date(tcf.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            TCF
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
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
                placeholder="Enter message subject"
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

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium dark:text-zinc-300 mb-2">
                Attachments (Optional)
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Choose Files
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                </label>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  PDF, DOC, XLS, Images (Max 10MB each)
                </span>
              </div>
              
              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2 dark:border-zinc-700"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm dark:text-white">{file.name}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              {isSending ? "Sending..." : `Send Message to ${getRecipientCount()} ${sendTab === 'contracts' ? 'Contract Holder' : sendTab === 'investors' ? 'Investor' : 'TCF Submission'}${getRecipientCount() !== 1 ? 's' : ''}`}
            </button>
          </form>
        </div>
        </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            {/* Message History */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Message History
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  View all sent messages and their details
                </p>
              </div>
              <button
                onClick={fetchMessages}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>🔄</span>
                Refresh
              </button>
            </div>

            {/* Messages List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading message history...</p>
              </div>
            ) : getHistoryMessages().length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500 dark:text-zinc-400">
                  No messages sent yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {getHistoryMessages().map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-xl border border-zinc-200 p-6 shadow-sm transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold dark:text-white">
                          {msg.subject}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {msg.message}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                          <span>
                            📅 {new Date(msg.sent_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>👥 {msg.recipient_count} recipients</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMessage(msg)}
                        className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message Details Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl p-6 bg-zinc-900">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-2xl font-bold dark:text-white">
                  {selectedMessage.subject}
                </h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Sent Date
                  </label>
                  <p className="mt-1 dark:text-white">
                    {new Date(selectedMessage.sent_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Recipients
                  </label>
                  <p className="mt-1 dark:text-white">
                    {selectedMessage.recipient_count} investor(s)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Message Content
                  </label>
                  <div className="mt-1 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                    <p className="whitespace-pre-wrap dark:text-white">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                {selectedMessage.attachment_count > 0 && selectedMessage.attachments && (
                  <div>
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Attachments ({selectedMessage.attachment_count})
                    </label>
                    <div className="mt-2 space-y-2">
                      {selectedMessage.attachments.map((attachment: MessageAttachment, idx: number) => (
                        <a
                          key={idx}
                          href={attachment.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="flex-1 text-sm dark:text-white">{attachment.attachment_name}</span>
                          {attachment.file_size && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              ({(attachment.file_size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                className="mt-6 w-full rounded-lg bg-zinc-200 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
