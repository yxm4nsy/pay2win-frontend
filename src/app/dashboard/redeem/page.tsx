'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Transaction, PaginatedResponse } from '@/types';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * Redeem Points page
 * Allows verified users to create redemption requests and display QR codes for cashiers
 * Users can only have one pending redemption at a time
 */
export default function RedeemPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingRedemption, setPendingRedemption] = useState<Transaction | null>(null);
  const [loadingRedemption, setLoadingRedemption] = useState(true);

  const [formData, setFormData] = useState({
    amount: '',
    remark: '',
  });

  // Check for pending redemption on mount
  useEffect(() => {
    fetchPendingRedemption();
  }, []);

  // Fetch any unprocessed redemption requests
  const fetchPendingRedemption = async () => {
    try {
      setLoadingRedemption(true);
      
      const response = await api.get<PaginatedResponse<Transaction>>('/users/me/transactions', {
        params: {
          type: 'redemption',
          limit: 50,
        },
      });

      // Find first unprocessed redemption (no processorUserId set)
      const unprocessed = response.data.results.find(t => !t.redeemed && !t.processedBy);
      
      setPendingRedemption(unprocessed || null);
    } catch (error) {
      // Silently fail - user just won't see pending redemption
    } finally {
      setLoadingRedemption(false);
    }
  };

  // Handle redemption request submission
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
      setMessage({ type: 'error', text: 'Insufficient points' });
      setLoading(false);
      return;
    }

    try {
      await api.post('/users/me/transactions', {
        type: 'redemption',
        amount: amount,
        remark: formData.remark,
      });

      setMessage({ type: 'success', text: 'Redemption request created! Show the QR code below to a cashier.' });
      setFormData({ amount: '', remark: '' });
      
      // Refresh to display the new redemption QR code
      await fetchPendingRedemption();

    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to create redemption request' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Block unverified users from redeeming
  if (!user.verified) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-yellow-800 mb-2">Account Not Verified</h2>
            <p className="text-sm text-yellow-700">
              You must be a verified user to redeem points. Please contact an administrator to verify your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Redeem Points</h1>
        <p className="text-sm text-gray-600 mb-6">
          Request to redeem your points. You currently have <span className="font-bold text-indigo-600">{user.points}</span> points available.
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

        {/* Pending Redemption QR Code Display */}
        {loadingRedemption ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : pendingRedemption ? (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Redemption</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  You have an unprocessed redemption request. Show this QR code to a cashier to complete the redemption.
                </p>
              </div>
              
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <QRCodeCanvas value={pendingRedemption.id.toString()} size={250} />
                <p className="mt-4 text-center text-sm text-gray-600">
                  Redemption ID: <span className="font-mono font-bold">{pendingRedemption.id}</span>
                </p>
                <p className="mt-2 text-center text-lg font-bold text-indigo-600">
                  Amount: {Math.abs(pendingRedemption.amount)} points
                </p>
                {pendingRedemption.remark && (
                  <p className="mt-2 text-center text-sm text-gray-500 italic">
                    "{pendingRedemption.remark}"
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Create Redemption Form (only show if no pending redemption) */}
        {!pendingRedemption && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Create Redemption Request</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Amount to Redeem
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g., 1000"
                    min="1"
                    max={user.points}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum: {user.points} points (Redemption rate: 1 cent per point)
                  </p>
                </div>

                {/* Optional Note */}
                <div>
                  <label htmlFor="remark" className="block text-sm font-medium text-gray-700">
                    Note (Optional)
                  </label>
                  <textarea
                    id="remark"
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="e.g., Redeeming for gift card"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Request...' : 'Create Redemption Request'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Redemption Information Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Redemption Information</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Points are redeemed at a rate of 1 cent per point</li>
            <li>You can only have one pending redemption at a time</li>
            <li>Show the QR code to a cashier to process your redemption</li>
            <li>Points will be deducted only after a cashier processes your request</li>
            <li>You must be a verified user to redeem points</li>
          </ul>
        </div>
      </div>
    </div>
  );
}