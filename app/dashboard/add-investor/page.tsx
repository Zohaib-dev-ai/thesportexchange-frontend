"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "../../components/AdminHeader";
import { isAuthenticated, getUserEmail, getAuthToken } from "../../lib/auth";
import { getApiUrl } from "../../lib/api";

export default function AddInvestorPage() {
  const [userEmail, setUserEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    full_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    investment_date: new Date().toISOString().split('T')[0], // Auto-populate with current date
    status: "Pending",
    notes: "",
  });

  useEffect(() => {
    setIsMounted(true);
    
    if (!isAuthenticated()) {
      router.push("/login-admin");
      return;
    }

    const email = getUserEmail();
    setUserEmail(email || "User");
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage("");
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
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('/api/investors'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name: formData.full_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          amount_of_money: 0, // Will be calculated from contracts
          amount_of_coins: 0, // Will be calculated from contracts
          investment_date: formData.investment_date || null,
          status: formData.status,
          payment: "Unpaid", // Default payment status (must be 'Paid' or 'Unpaid')
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create investor');
      }

      const investorId = data.data.id;
      
      setSuccessMessage(`Investor ${formData.full_name} created successfully!`);
      
      // Reset form
      setFormData({
        full_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        investment_date: new Date().toISOString().split('T')[0], // Auto-populate with current date
        status: "Pending",
        notes: "",
      });

      // Redirect to investor detail page after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/investor/${investorId}`);
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
      <AdminHeader />

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
                    First Name <span className="text-red-500">*</span>
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
              <div className="grid">
                <div>
                  <label htmlFor="investment_date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Created Date
                  </label>
                  <input
                    type="date"
                    id="investment_date"
                    name="investment_date"
                    value={formData.investment_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Investment amounts will be calculated from contracts
                  </p>
                </div>

                {/*<div>
                  <label htmlFor="status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-zinc-200 px-4 py-3 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white text-zinc-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Signed">Signed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>*/}
              </div>
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
                className="flex-1 rounded-lg border border-zinc-200 px-6 py-3 text-center font-semibold transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}
