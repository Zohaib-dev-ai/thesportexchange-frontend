'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl, getDocumentUrl } from '@/app/lib/api';

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
}

const formatNewsletterDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function NewsletterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [isMounted, setIsMounted] = useState(false);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const { id } = use(params);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && id) {
      fetchNewsletter();
    }
  }, [isMounted, id]);

  const fetchNewsletter = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/newsletter/${id}`));
      const data = await response.json();
      if (data.success) {
        setNewsletter(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch newsletter:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="space-y-6">
        <div className="bg-[#111111] border border-gray-800 rounded-lg p-12 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading newsletter...</p>
        </div>
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/investor-portal/newsletters')}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Newsletters
        </button>

        <div className="bg-[#111111] border border-gray-800 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Newsletter Not Found</h3>
          <p className="text-gray-400">This newsletter may have been removed or the link is incorrect</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/investor-portal/newsletters')}
        className="flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Newsletters
      </button>

      {/* Newsletter Content */}
      <div className="bg-[#111111] border border-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-3">{newsletter.subject}</h1>
              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatNewsletterDate(newsletter.sent_date)}
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Admin
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Body */}
        <div className="p-8">
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {newsletter.message}
            </div>
          </div>
        </div>

        {/* Attachments */}
        {newsletter.attachments && newsletter.attachments.length > 0 && (
          <div className="p-8 pt-0">
            <h3 className="text-white font-semibold mb-4">
              Attachments ({newsletter.attachments.length})
            </h3>
            <div className="space-y-3">
              {newsletter.attachments.map((attachment, idx) => (
                <div key={idx} className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-600/20 rounded-lg p-3 mr-4">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-1">Document {idx + 1}</h4>
                        <p className="text-gray-400 text-sm">{attachment.attachment_name}</p>
                      </div>
                    </div>
                    <a
                      href={getDocumentUrl(attachment.attachment_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-gray-300 text-sm">
              Have questions about this newsletter? Contact our support team at{' '}
              <a href="mailto:support@thesportexchange.com" className="text-blue-400 hover:text-blue-300">
                support@thesportexchange.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
