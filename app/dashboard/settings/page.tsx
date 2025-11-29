'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, History, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../../lib/api';

interface RateHistory {
  id: number;
  rate_value: string;
  effective_date: string;
  created_at: string;
  created_by_name?: string;
  notes?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [coinValue, setCoinValue] = useState('8.8 million');
  const [currentRate, setCurrentRate] = useState('0.0000');
  
  // Rate form state
  const [newRate, setNewRate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateNotes, setRateNotes] = useState('');
  
  // Rate history
  const [rateHistory, setRateHistory] = useState<RateHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchRateHistory();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(getApiUrl('/api/settings'));
      const data = await response.json();
      
      if (data.success) {
        setCoinValue(data.data.coin_value?.value || '8.8 million');
        setCurrentRate(data.data.current_rate?.value || '0.0000');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchRateHistory = async () => {
    try {
      const response = await fetch(getApiUrl('/api/settings/rate/history?limit=50'));
      const data = await response.json();
      
      if (data.success) {
        setRateHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rate history:', error);
    }
  };

  const handleSaveCoinValue = async () => {
    setSaving(true);
    try {
      const response = await fetch(getApiUrl('/api/settings/coin_value'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: coinValue, updated_by: 1 }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Coin value updated successfully!');
      } else {
        alert('Failed to update coin value');
      }
    } catch (error) {
      console.error('Error saving coin value:', error);
      alert('Failed to update coin value');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRate || !effectiveDate) {
      alert('Please enter rate value and effective date');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/settings/rate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate_value: parseFloat(newRate),
          effective_date: effectiveDate,
          created_by: 1,
          notes: rateNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Rate added successfully!');
        setNewRate('');
        setRateNotes('');
        setEffectiveDate(new Date().toISOString().split('T')[0]);
        fetchSettings();
        fetchRateHistory();
      } else {
        alert('Failed to add rate');
      }
    } catch (error) {
      console.error('Error adding rate:', error);
      alert('Failed to add rate');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rate entry?')) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/settings/rate/${id}`), {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('Rate entry deleted successfully!');
        fetchRateHistory();
      } else {
        alert('Failed to delete rate entry');
      }
    } catch (error) {
      console.error('Error deleting rate:', error);
      alert('Failed to delete rate entry');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coin Value Settings */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Coin Value</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Coin Value
                </label>
                <input
                  type="text"
                  value={coinValue}
                  onChange={(e) => setCoinValue(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 8.8 million"
                  readOnly
                />
              </div>
              {/*<button
                onClick={handleSaveCoinValue}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Coin Value'}
              </button>*/}
            </div>
          </div>

          {/* Current Rate Display */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Current Rate</h2>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-gray-400 mb-2">Active Rate</p>
                <p className="text-5xl font-bold text-white">{currentRate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Rate */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Rate
          </h2>
          <form onSubmit={handleAddRate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rate Value
              </label>
              <input
                type="number"
                step="0.0001"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.0000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={rateNotes}
                onChange={(e) => setRateNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Monthly update"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                {loading ? 'Adding...' : 'Add Rate'}
              </button>
            </div>
          </form>
        </div>

        {/* Rate History */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <History className="w-5 h-5" />
              Rate History
            </h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
            >
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>

          {showHistory && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Rate</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Notes</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Updated By</th>
                    {/*<th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>*/}
                  </tr>
                </thead>
                <tbody>
                  {rateHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">
                        No rate history available
                      </td>
                    </tr>
                  ) : (
                    rateHistory.map((rate) => (
                      <tr key={rate.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white">
                          {new Date(rate.effective_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-white font-semibold">
                          {rate.rate_value}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {rate.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {rate.created_by_name || 'Admin'}
                        </td>
                        {/*<td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteRate(rate.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>*/}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
