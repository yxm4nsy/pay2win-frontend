'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Transaction, PaginatedResponse } from '@/types';

/**
 * Transaction History page
 * Displays paginated list of user's transactions with filtering options
 */
export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);
  
  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [amountFilter, setAmountFilter] = useState<string>('');
  const [amountOperator, setAmountOperator] = useState<'gte' | 'lte'>('gte');

  // Fetch transactions when page or filters change
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, typeFilter, amountFilter, amountOperator]);

  // Fetch transactions from API with filters and pagination
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters
      const params: any = {
        page: currentPage,
        limit: limit,
      };

      if (typeFilter) {
        params.type = typeFilter;
      }

      if (amountFilter) {
        params.amount = parseInt(amountFilter);
        params.operator = amountOperator;
      }

      const response = await api.get<PaginatedResponse<Transaction>>('/users/me/transactions', {
        params,
      });

      setTransactions(response.data.results);
      setTotalCount(response.data.count);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Get color styling based on transaction type
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'redemption':
        return 'bg-red-100 text-red-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get additional details text for transaction
  const getTransactionDetails = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'purchase':
        return `Spent: $${transaction.spent?.toFixed(2) || '0.00'}`;
      case 'redemption':
        if (transaction.redeemed) {
          return 'Processed';
        }
        return 'Pending';
      default:
        return '';
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  if (!user) return null;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
        <p className="mt-2 text-sm text-gray-600">
          View all your past transactions and point changes
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="redemption">Redemption</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
              <option value="event">Event</option>
            </select>
          </div>

          {/* Amount Filter */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="flex space-x-2">
              <select
                value={amountOperator}
                onChange={(e) => {
                  setAmountOperator(e.target.value as 'gte' | 'lte');
                  if (amountFilter) setCurrentPage(1);
                }}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              >
                <option value="gte">≥</option>
                <option value="lte">≤</option>
              </select>
              <input
                type="number"
                id="amount"
                value={amountFilter}
                onChange={(e) => {
                  setAmountFilter(e.target.value);
                  if (e.target.value) setCurrentPage(1);
                }}
                placeholder="Points"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setTypeFilter('');
                setAmountFilter('');
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
          {/* Transactions List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Type badge and amount */}
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(
                            transaction.type
                          )}`}
                        >
                          {transaction.type}
                        </span>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.amount >= 0 ? '+' : ''}
                          {transaction.amount} points
                        </p>
                      </div>

                      {/* Transaction details */}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="truncate">{getTransactionDetails(transaction)}</span>
                      </div>

                      {/* Remark if present */}
                      {transaction.remark && (
                        <p className="mt-1 text-sm text-gray-500 italic">{transaction.remark}</p>
                      )}

                      {/* Creator info */}
                      <p className="mt-1 text-xs text-gray-400">
                        Created by: {transaction.createdBy}
                      </p>
                    </div>

                    {/* Amount display */}
                    <div className="ml-4 shrink-0">
                      <span
                        className={`text-2xl font-bold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.amount >= 0 ? '+' : ''}
                        {transaction.amount}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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