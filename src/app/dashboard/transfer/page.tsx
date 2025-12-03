'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface UserLookup {
  id: number;
  utorid: string;
  name: string;
  verified: boolean;
}

/**
 * Transfer Points page
 * Allows verified users to transfer points to other users
 */
export default function TransferPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    utorid: '',
    amount: '',
    remark: '',
  });

  // Handle transfer form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const amount = parseInt(formData.amount);
    
    // Validate amount is positive
    if (amount <= 0) {
      setMessage({ type: 'error', text: 'Amount must be greater than 0' });
      setLoading(false);
      return;
    }

    // Validate user has enough points
    if (amount > (user?.points || 0)) {
      setMessage({ type: 'error', text: `Insufficient points. You only have ${user?.points} points available.` });
      setLoading(false);
      return;
    }

    // Prevent self-transfer
    if (formData.utorid === user?.utorid) {
      setMessage({ type: 'error', text: 'Cannot transfer to yourself' });
      setLoading(false);
      return;
    }

    try {
      // Look up recipient by UTORid
      const lookupResponse = await api.get<UserLookup>(`/users/lookup/${formData.utorid}`);
      const recipientUser = lookupResponse.data;

      // Create transfer transaction
      await api.post(`/users/${recipientUser.id}/transactions`, {
        type: 'transfer',
        amount: amount,
        remark: formData.remark,
      });

      setMessage({ 
        type: 'success', 
        text: `Successfully transferred ${amount} points to ${recipientUser.name} (${recipientUser.utorid})!` 
      });
      setFormData({ utorid: '', amount: '', remark: '' });
      
      // Refresh user data to show updated points
      await refreshUser();

      // Redirect to transactions page after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/transactions');
      }, 2000);

    } catch (error: any) {
      if (error.response?.status === 404) {
        setMessage({ type: 'error', text: 'User not found. Please check the UTORid.' });
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || error.message || 'Failed to transfer points' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Block unverified users from transferring
  if (!user.verified) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-yellow-800 mb-2">Account Not Verified</h2>
            <p className="text-sm text-yellow-700">
              You must be a verified user to transfer points. Please contact an administrator to verify your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer Points</h1>
        <p className="text-sm text-gray-600 mb-6">
          Send points to another user. You currently have <span className="font-bold text-indigo-600">{user.points}</span> points available.
        </p>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 rounded-md p-4 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Transfer Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recipient UTORid */}
              <div>
                <label htmlFor="utorid" className="block text-sm font-medium text-gray-700">
                  Recipient UTORid
                </label>
                <input
                  type="text"
                  id="utorid"
                  value={formData.utorid}
                  onChange={(e) => setFormData({ ...formData, utorid: e.target.value })}
                  placeholder="e.g., jdoe"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the UTORid of the person you want to send points to
                </p>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g., 100"
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum: {user.points} points
                </p>
              </div>

              {/* Optional Message */}
              <div>
                <label htmlFor="remark" className="block text-sm font-medium text-gray-700">
                  Message (Optional)
                </label>
                <textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="e.g., Thanks for lunch!"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Transferring...' : 'Transfer Points'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Transfer Information Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Transfer Information</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Transfers are instant and cannot be reversed</li>
            <li>Both you and the recipient will see the transaction in your history</li>
            <li>You must be a verified user to transfer points</li>
            <li>You cannot transfer points to yourself</li>
          </ul>
        </div>
      </div>
    </div>
  );
}