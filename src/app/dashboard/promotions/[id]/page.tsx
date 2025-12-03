'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Promotion } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

/**
 * Promotion Detail page
 * Displays detailed information about a specific promotion
 */
export default function PromotionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const promotionId = params.id;

  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch promotion details on mount
  useEffect(() => {
    fetchPromotion();
  }, [promotionId]);

  // Fetch promotion from API
  const fetchPromotion = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<Promotion>(`/promotions/${promotionId}`);
      setPromotion(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Promotion not found');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch promotion');
      }
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

  if (!user) return null;

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
              onClick={() => router.push('/dashboard/promotions')}
              className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
            >
              ← Back to Promotions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!promotion) {
    return null;
  }

  const status = getPromotionStatus(promotion);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/promotions')}
          className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Promotions
        </button>

        {/* Promotion Details Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            {/* Header with name and badges */}
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{promotion.name}</h1>
              <div className="flex space-x-2">
                <span className={`ml-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${status.color}`}>
                  {status.label}
                </span>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  promotion.type === 'automatic' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {promotion.type === 'automatic' ? 'Automatic' : 'One-Time'}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6">{promotion.description}</p>

            {/* Promotion Details Grid */}
            <div className="border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Type */}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {promotion.type === 'automatic' 
                      ? 'Automatic - Applied automatically when conditions are met' 
                      : 'One-Time - Can be applied once per user by cashier'}
                  </dd>
                </div>

                {/* Bonus Value */}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bonus Value</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {promotion.type === 'one-time' && promotion.points ? (
                      <span className="text-lg font-bold text-green-600">+{promotion.points} points</span>
                    ) : promotion.type === 'automatic' && promotion.rate ? (
                      <span className="text-lg font-bold text-green-600">
                        {(promotion.rate * 100).toFixed(1)}% bonus
                      </span>
                    ) : (
                      'Variable'
                    )}
                  </dd>
                </div>

                {/* Minimum Spending */}
                {promotion.minSpending !== null && promotion.minSpending !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Minimum Purchase</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ${promotion.minSpending.toFixed(2)}
                    </dd>
                  </div>
                )}

                {/* Valid Until Date */}
                {promotion.endTime && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Valid Until</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(promotion.endTime), 'EEEE, MMMM dd, yyyy h:mm a')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* How It Works Section */}
            <div className="border-t border-gray-200 mt-6 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">How It Works</h3>
              
              {promotion.type === 'automatic' ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        This promotion is automatically applied to all qualifying purchases. 
                        {promotion.minSpending && ` Make a purchase of $${promotion.minSpending.toFixed(2)} or more`} 
                        {promotion.rate && ` to earn an extra ${(promotion.rate * 100).toFixed(1)}% bonus points`}
                        {promotion.points && ` to earn ${promotion.points} bonus points`}.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-orange-800">
                        This is a one-time promotion. Ask the cashier to apply this promotion during your next purchase
                        {promotion.minSpending && ` of $${promotion.minSpending.toFixed(2)} or more`}
                        {promotion.points && ` to receive ${promotion.points} bonus points`}. 
                        Each user can only use this promotion once.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expired Status Warning */}
            {status.label === 'Expired' && (
              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-800">
                        This promotion has expired and is no longer available.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}