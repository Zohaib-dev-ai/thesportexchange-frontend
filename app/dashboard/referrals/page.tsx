import AdminHeader from '@/app/components/AdminHeader';
import AdminReferralManagement from '@/app/components/AdminReferralManagement';
import Link from 'next/link';

export default function ReferralsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminHeader />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Referral Management</h1>
          <p className="text-gray-400">
            Manage investor referrals and commission payments
          </p>
        </div>

        {/* Referral Management Component */}
        <AdminReferralManagement />
      </main>
    </div>
  );
}