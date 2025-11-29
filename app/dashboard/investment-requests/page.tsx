"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../components/AdminHeader";
import AdminInvestmentRequests from "../../components/AdminInvestmentRequests";
import { isAuthenticated } from "../../lib/auth";

export default function InvestmentRequestsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    // Check authentication using auth service
    if (!isAuthenticated()) {
      router.push("/login-admin");
      return;
    }
  }, [router]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold dark:text-white">
                Investment Requests Management
              </h2>
              <p className="mt-2 dark:text-zinc-400">
                Review and manage all investor investment requests
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Investment Requests Management Component */}
        <AdminInvestmentRequests />
      </main>
    </div>
  );
}