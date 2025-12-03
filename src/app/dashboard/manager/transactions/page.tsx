'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Transaction, PaginatedResponse } from '@/types';
import Link from 'next/link';

/**
 * Manager All Transactions page
 * Displays system-wide transactions with filtering and pagination
 * Allows managers to view all transactions across all users
 */
export default function ManagerTransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(20);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [utoridFilter, setUtoridFilter] = useState('');
  const [suspiciousFilter, setSuspiciousFilter] = useState<string>('');

  // Fetch transactions when page or filters change
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, typeFilter, utoridFilter, suspiciousFilter]);

  // Fetch all transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        page: currentPage,
        limit: limit,
      };

      if (typeFilter) {
        params.type = typeFilter;
      }

      if (utoridFilter) {
        params.name = utoridFilter;
      }

      if (suspiciousFilter) {
        params.suspicious = suspiciousFilter;
      }

      const response = await api.get<PaginatedResponse<Transaction>>('/transactions', { params });

      setTransactions(response.data.results);
      setTotalCount(response.data.count);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
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

  // Get description text for transaction
  const getTransactionDescription = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'purchase':
        return transaction.spent ? `Spent: $${transaction.spent.toFixed(2)}` : 'Purchase';
      case 'transfer':
        return `Transfer ${transaction.amount > 0 ? 'from' : 'to'} User #${transaction.relatedId || 'Unknown'}`;
      case 'redemption':
        return transaction.redeemed ? 'Redeemed' : 'Pending';
      case 'adjustment':
        return `Adjustment by User #${transaction.createdBy || 'System'}`;
      case 'event':
        return `Event points`;
      default:
        return transaction.type;
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage all transactions in the system
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/manager"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            ← Back to Manager Dashboard
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">All Types</option>
              <option value="purchase">Purchase</option>
              <option value="transfer">Transfer</option>
              <option value="redemption">Redemption</option>
              <option value="adjustment">Adjustment</option>
              <option value="event">Event</option>
            </select>
          </div>

          {/* UTORid Search */}
          <div>
            <label htmlFor="utorid" className="block text-sm font-medium text-gray-700 mb-1">
              User UTORid or Name
            </label>
            <input
              type="text"
              id="utorid"
              value={utoridFilter}
              onChange={(e) => {
                setUtoridFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by UTORid or name"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Suspicious Filter */}
          <div>
            <label htmlFor="suspicious" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="suspicious"
              value={suspiciousFilter}
              onChange={(e) => {
                setSuspiciousFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">All Transactions</option>
              <option value="true">Suspicious</option>
              <option value="false">Normal</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setTypeFilter('');
                setUtoridFilter('');
                setSuspiciousFilter('');
                setCurrentPage(1);
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <>
          {/* Transactions Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      {/* Transaction ID */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{t.id}
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(t.type)}`}>
                          {t.type}
                        </span>
                      </td>

                      {/* User UTORid */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t.utorid}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={t.amount >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {t.amount >= 0 ? '+' : ''}{t.amount}
                        </span>
                      </td>

                      {/* Suspicious Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {t.suspicious ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Suspicious
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Details and Remark */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {getTransactionDescription(t)}
                          {t.remark && <div className="text-xs text-gray-400 truncate">{t.remark}</div>}
                        </div>
                      </td>

                      {/* View Link */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/manager/transactions/${t.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t.suspicious ? 'Review' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * limit, totalCount)}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}