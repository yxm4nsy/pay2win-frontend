'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { useRouter, useParams } from 'next/navigation';

/**
 * Manager Transaction Detail page
 * Displays detailed information about a specific transaction
 * Allows managers to approve suspicious transactions or create adjustments
 */
export default function TransactionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Adjustment form state
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentRemark, setAdjustmentRemark] = useState('');

  // Fetch transaction on mount
  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  // Fetch transaction details from API
  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<Transaction>(`/transactions/${transactionId}`);
      setTransaction(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Transaction not found');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch transaction');
      }
    } finally {
      setLoading(false);
    }
  };

  // Approve suspicious transaction
  const handleApproveSuspicious = async () => {
    if (!transaction) return;

    if (!window.confirm('Are you sure you want to approve this suspicious transaction? This will award the points to the user.')) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await api.patch(`/transactions/${transaction.id}/suspicious`, {
        suspicious: false,
      });

      setMessage({
        type: 'success',
        text: `Transaction approved! ${transaction.amount} points awarded to ${transaction.utorid}.`,
      });

      // Refresh transaction data
      await fetchTransaction();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to approve transaction',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Create adjustment transaction
  const handleCreateAdjustment = async () => {
    if (!transaction) return;

    const amount = parseInt(adjustmentAmount);
    
    // Validate amount is non-zero
    if (isNaN(amount) || amount === 0) {
      setMessage({ type: 'error', text: 'Please enter a valid non-zero amount' });
      return;
    }

    // Validate remark is provided
    if (!adjustmentRemark.trim()) {
      setMessage({ type: 'error', text: 'Please provide a remark explaining the adjustment' });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await api.post('/transactions', {
        type: 'adjustment',
        utorid: transaction.utorid,
        amount: amount,
        remark: adjustmentRemark.trim(),
        relatedId: transaction.id,
      });

      setMessage({
        type: 'success',
        text: `Adjustment created successfully! ${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} points.`,
      });

      // Reset form
      setAdjustmentAmount('');
      setAdjustmentRemark('');
      setShowAdjustmentForm(false);

      // Refresh transaction data
      await fetchTransaction();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create adjustment',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Get badge color based on transaction type
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      case 'redemption':
        return 'bg-purple-100 text-purple-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      case 'event':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) return null;

  // Restrict access to manager and superuser roles
  if (user.role !== 'manager' && user.role !== 'superuser') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800 mb-2">Access Denied</h2>
            <p className="text-sm text-red-700">
              You must be a manager or higher to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800 mb-2">Error</h2>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => router.push('/dashboard/manager/transactions')}
              className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
            >
              ← Back to Transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/manager/transactions')}
          className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Transactions
        </button>

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

        {/* Suspicious Warning Banner */}
        {transaction.suspicious && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
            <div className="flex items-start">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Suspicious Transaction</h3>
                <p className="mt-1 text-sm text-red-700">
                  This transaction was flagged as suspicious. Points have not been awarded to the user. Review the details and approve if legitimate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 sm:p-6">
            {/* Header with ID and type badge */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transaction #{transaction.id}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Owner: {transaction.utorid}
                </p>
              </div>
              <div className="flex space-x-2">
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getTypeBadgeColor(transaction.type)}`}>
                  {transaction.type}
                </span>
                {transaction.suspicious && (
                  <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Suspicious
                  </span>
                )}
              </div>
            </div>

            {/* Transaction Details Grid */}
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
              {/* Amount */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                <dd className={`mt-1 text-lg font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount >= 0 ? '+' : ''}{transaction.amount} points
                </dd>
                {transaction.suspicious && (
                  <p className="mt-1 text-xs text-red-600">Points not awarded (suspicious)</p>
                )}
              </div>

              {/* Amount Spent (for purchases) */}
              {transaction.spent !== undefined && transaction.spent !== null && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Amount Spent</dt>
                  <dd className="mt-1 text-sm text-gray-900">${transaction.spent.toFixed(2)}</dd>
                </div>
              )}

              {/* Related Transaction ID */}
              {transaction.relatedId && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Related ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">#{transaction.relatedId}</dd>
                </div>
              )}

              {/* Creator */}
              {transaction.createdBy && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Creator</dt>
                  <dd className="mt-1 text-sm text-gray-900">{transaction.createdBy}</dd>
                </div>
              )}

              {/* Redemption Status */}
              {transaction.type === 'redemption' && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm">
                    {transaction.redeemed ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Redeemed
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </dd>
                </div>
              )}

              {/* Remark */}
              {transaction.remark && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Remark</dt>
                  <dd className="mt-1 text-sm text-gray-900">{transaction.remark}</dd>
                </div>
              )}
            </dl>

            {/* Approve Suspicious Button */}
            {transaction.suspicious && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleApproveSuspicious}
                  disabled={actionLoading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : `Approve Transaction & Award ${transaction.amount} Points`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Adjustment Section (not shown for adjustment transactions) */}
        {transaction.type !== 'adjustment' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Create Adjustment</h2>

              {!showAdjustmentForm ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Create an adjustment to correct or modify this transaction.
                  </p>
                  <button
                    onClick={() => setShowAdjustmentForm(true)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Create Adjustment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Adjustment Amount Input */}
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Adjustment Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      placeholder="e.g., 50 or -25"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Positive to add points, negative to deduct points
                    </p>
                  </div>

                  {/* Remark Input (Required) */}
                  <div>
                    <label htmlFor="remark" className="block text-sm font-medium text-gray-700">
                      Remark <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="remark"
                      value={adjustmentRemark}
                      onChange={(e) => setAdjustmentRemark(e.target.value)}
                      placeholder="Explain why this adjustment is being made..."
                      rows={3}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateAdjustment}
                      disabled={actionLoading}
                      className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    >
                      {actionLoading ? 'Creating...' : 'Create Adjustment'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAdjustmentForm(false);
                        setAdjustmentAmount('');
                        setAdjustmentRemark('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}