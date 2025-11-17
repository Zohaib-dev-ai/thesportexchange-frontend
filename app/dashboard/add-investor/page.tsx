"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated, getUserEmail, clearAuthData } from "../../lib/auth";
import { getApiUrl } from "../../lib/api";

export default function AddInvestorPage() {
  const [userEmail, setUserEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    full_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    amount_of_money: "",
    amount_of_coins: "",
    investment_date: "",
    status: "Pending",
    notes: "",
  });

  useEffect(() => {
    setIsMounted(true);
    
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const email = getUserEmail();
    setUserEmail(email || "User");
  }, [router]);

  const handleLogout = () => {
    clearAuthData();
    router.push("/login");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...newFiles]);
      setErrorMessage("");
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (!formData.full_name || !formData.email || !formData.password) {
      setErrorMessage("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create investor
      const response = await fetch(getApiUrl('/api/investors'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          amount_of_money: parseFloat(formData.amount_of_money) || 0,
          amount_of_coins: parseFloat(formData.amount_of_coins) || 0,
          investment_date: formData.investment_date || null,
          status: formData.status,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create investor');
      }

      const investorId = data.data.id;

      // Step 2: Upload documents if any
      if (documents.length > 0) {
        for (const file of documents) {
          try {
            // Upload file first
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadResponse = await fetch(getApiUrl('/api/upload'), {
              method: 'POST',
              body: uploadFormData,
            });

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadData.success) {
              console.error(`Failed to upload ${file.name}:`, uploadData.error);
              continue;
            }

            // Add document to investor
            const docResponse = await fetch(getApiUrl(`/api/investors/${investorId}/documents`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                document_name: file.name,
                document_url: uploadData.data.url,
                document_type: file.type,
                file_size: file.size,
              }),
            });

            const docData = await docResponse.json();

            if (!docResponse.ok || !docData.success) {
              console.error(`Failed to add document ${file.name}:`, docData.error);
            }
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
          }
        }
      }
      
      setSuccessMessage(`Investor ${formData.full_name} created successfully!${documents.length > 0 ? ` Uploaded ${documents.length} document(s).` : ''}`);
      
      // Reset form
      setFormData({
        full_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        amount_of_money: "",
        amount_of_coins: "",
        investment_date: "",
        status: "Pending",
        notes: "",
      });
      setDocuments([]);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create investor. Please try again.");
      console.error("Create investor error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Image 
                src="/images/logo.svg" 
                alt="The Sport Exchange" 
                width={180} 
                height={40}
                priority
                className="cursor-pointer"
              />
            </Link>
            
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-4">
              <Link
                href="/dashboard"
                className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/newsletter"
                className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
              >
                Newsletter
              </Link>
              <span className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
                Add Investor
              </span>
            </nav>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold dark:text-white">
            Add New Investor
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Create a new investor account with login credentials
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-zinc-200 border p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold dark:text-white">
                Personal Information
              </h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="Smith"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Login Credentials */}
            <div>
              <h3 className="mb-4 text-lg font-semibold dark:text-white">
                Login Credentials
              </h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div>
              <h3 className="mb-4 text-lg font-semibold dark:text-white">
                Investment Details
              </h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="amount_of_money" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Amount of Money
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="amount_of_money"
                    name="amount_of_money"
                    value={formData.amount_of_money}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="100000"
                  />
                </div>

                <div>
                  <label htmlFor="amount_of_coins" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Amount of Coins
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="amount_of_coins"
                    name="amount_of_coins"
                    value={formData.amount_of_coins}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label htmlFor="investment_date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Investment Date
                  </label>
                  <input
                    type="date"
                    id="investment_date"
                    name="investment_date"
                    value={formData.investment_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Signed">Signed</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documents Upload - Multiple Files */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Documents <span className="text-zinc-500 text-xs">(Multiple files supported)</span>
              </label>
              
              <div>
                <input
                  type="file"
                  id="documents-upload"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="documents-upload"
                  className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
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
                      Click to upload documents
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Contracts, Agreements, IDs, etc.
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      PDF, DOC, Images - Multiple files allowed
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploaded Files List */}
              {documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Uploaded Documents ({documents.length})
                  </p>
                  {documents.map((file, index) => (
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

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                placeholder="Additional notes about this investor..."
              />
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

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Investor"}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-center font-semibold transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <div className="flex gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold">Connected to Database</p>
              <p className="mt-1">
                New investors will be saved to the database with:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Encrypted password with bcrypt</li>
                <li>User account for investor login</li>
                <li>Investment details and status tracking</li>
                <li>Document upload (coming soon with cloud storage)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
