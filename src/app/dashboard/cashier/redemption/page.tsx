'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

/**
 * Cashier Redemption page
 * Allows cashiers to process customer redemption requests by transaction ID
 */
export default function CashierRedemptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transactionId, setTransactionId] = useState('');

  // Process redemption transaction
  const handleProcess = async () => {
    if (!transactionId) {
      setMessage({ type: 'error', text: 'Please enter a transaction ID' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.patch(`/transactions/${transactionId}/processed`, {
        processed: true,
      });

      // Calculate redeemed amount
      const redeemed = response.data.redeemed || Math.abs(response.data.amount);
      
      setMessage({ 
        type: 'success', 
        text: `Redemption processed successfully! ${redeemed} points redeemed.` 
      });

      // Reset form
      setTransactionId('');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/cashier');
      }, 2000);

    } catch (error: any) {
      if (error.response?.status === 400) {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Invalid redemption transaction' 
        });
      } else if (error.response?.status === 404) {
        setMessage({ type: 'error', text: 'Transaction not found. Please check the ID.' });
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Failed to process redemption' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Restrict access to cashier, manager, and superuser roles
  if (user.role !== 'cashier' && user.role !== 'manager' && user.role !== 'superuser') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800 mb-2">Access Denied</h2>
            <p className="text-sm text-red-700">
              You must be a cashier or higher to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Process Redemption</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter the redemption transaction ID from the customer's QR code
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

        {/* Process Redemption Form */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleProcess(); }} className="space-y-4">
              {/* Transaction ID Input */}
              <div>
                <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700">
                  Redemption Transaction ID
                </label>
                <input
                  type="number"
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g., 124"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Scan or manually enter the transaction ID from the customer's QR code
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading || !transactionId}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Process Redemption'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/cashier')}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Instructions Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Processing Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Ask the customer to show their redemption QR code</li>
            <li>Scan or manually enter the transaction ID</li>
            <li>Click "Process Redemption" to complete</li>
            <li>Points will be deducted immediately upon processing</li>
            <li>If the transaction is invalid or already processed, you'll see an error</li>
          </ul>
        </div>
      </div>
    </div>
  );
}