'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Promotion, PaginatedResponse } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';

/**
 * Promotions List page
 * Displays all available promotions with filtering and pagination
 */
export default function PromotionsPage() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(10);

  // Filter state
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'automatic' | 'one-time' | ''>('');

  // Fetch promotions when page or filters change
  useEffect(() => {
    fetchPromotions();
  }, [currentPage, nameFilter, typeFilter]);

  // Fetch promotions from API with filters
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        page: currentPage,
        limit: limit,
      };

      if (nameFilter) {
        params.name = nameFilter;
      }

      if (typeFilter) {
        params.type = typeFilter;
      }

      const response = await api.get<PaginatedResponse<Promotion>>('/promotions', { params });

      setPromotions(response.data.results);
      setTotalCount(response.data.count);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  // Determine promotion status based on dates
  const getPromotionStatus = (promo: Promotion) => {
    if (!promo.endTime) {
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }

    const now = new Date();
    const end = new Date(promo.endTime);

    if (now > end) {
      return { label: 'Expired', color: 'bg-gray-100 text-gray-800' };
    } else {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    }
  };

  // Format promotion value display text
  const getPromotionValue = (promo: Promotion) => {
    if (promo.type === 'one-time' && promo.points) {
      return `+${promo.points} bonus points`;
    } else if (promo.type === 'automatic' && promo.rate) {
      const percentage = (promo.rate * 100).toFixed(1);
      return `${percentage}% bonus`;
    }
    return 'Special bonus';
  };

  const totalPages = Math.ceil(totalCount / limit);

  if (!user) return null;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Browse available promotions and bonus point opportunities
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name Search */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Promotion Name
            </label>
            <input
              type="text"
              id="name"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">All Types</option>
              <option value="automatic">Automatic</option>
              <option value="one-time">One-Time</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setNameFilter('');
                setTypeFilter('');
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
      ) : promotions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No promotions found</p>
        </div>
      ) : (
        <>
          {/* Promotions List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {promotions.map((promo) => {
                const status = getPromotionStatus(promo);

                return (
                  <Link
                    key={promo.id}
                    href={`/dashboard/promotions/${promo.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <li className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Promotion name and badges */}
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {promo.name}
                            </h3>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              promo.type === 'automatic' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {promo.type === 'automatic' ? 'Automatic' : 'One-Time'}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 mb-2">{promo.description}</p>

                          {/* Promotion details */}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {/* Value */}
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{getPromotionValue(promo)}</span>
                            </div>

                            {/* Minimum spending requirement */}
                            {promo.minSpending && (
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>Min spend: ${promo.minSpending.toFixed(2)}</span>
                              </div>
                            )}

                            {/* End date */}
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>
                                {promo.endTime ? (
                                  <>Ends: {format(new Date(promo.endTime), 'MMM dd, yyyy')}</>
                                ) : (
                                  'No end date'
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Arrow icon */}
                        <div className="ml-4 shrink-0">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </li>
                  </Link>
                );
              })}
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