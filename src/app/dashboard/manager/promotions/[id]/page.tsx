'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Promotion } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

/**
 * Manager Promotion Detail page
 * Allows managers to view, edit, and delete specific promotions
 */
export default function PromotionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const promotionId = params.id;

  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    minSpending: '',
    rate: '',
    points: '',
    startTime: '',
    endTime: '',
  });

  // Store original data for comparison
  const [originalData, setOriginalData] = useState({
    name: '',
    description: '',
    minSpending: '',
    rate: '',
    points: '',
    startTime: '',
    endTime: '',
  });

  // Helper function to format date for datetime-local input (preserves local timezone)
  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Fetch promotion on mount
  useEffect(() => {
    fetchPromotion();
  }, [promotionId]);

  // Fetch promotion details from API
  const fetchPromotion = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<Promotion>(`/promotions/${promotionId}`);
      setPromotion(response.data);
      
      // Convert rate to percentage for display
      const bonusPercentage = response.data.rate ? (response.data.rate * 100).toFixed(1) : '';

      // Format dates for datetime-local input (preserves local timezone)
      const startTimeFormatted = response.data.startTime 
        ? formatDateTimeLocal(response.data.startTime)
        : '';
      const endTimeFormatted = response.data.endTime
        ? formatDateTimeLocal(response.data.endTime)
        : '';

      const data = {
        name: response.data.name,
        description: response.data.description || '',
        minSpending: response.data.minSpending?.toString() || '',
        rate: bonusPercentage,
        points: response.data.points?.toString() || '',
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
      };

      setEditData(data);
      setOriginalData(data); // Store original data for comparison
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

  // Update promotion - only send changed fields
  const handleUpdatePromotion = async () => {
    if (!promotion) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const body: any = {};

      // Only include changed fields
      if (editData.name !== originalData.name) {
        body.name = editData.name;
      }

      if (editData.description !== originalData.description) {
        body.description = editData.description;
      }

      if (editData.startTime !== originalData.startTime) {
        body.startTime = new Date(editData.startTime).toISOString();
      }

      if (editData.endTime !== originalData.endTime) {
        body.endTime = new Date(editData.endTime).toISOString();
      }

      if (editData.minSpending !== originalData.minSpending) {
        body.minSpending = editData.minSpending ? parseFloat(editData.minSpending) : null;
      }

      if (promotion.type === 'automatic' && editData.rate !== originalData.rate) {
        if (editData.rate) {
          const bonusPercentage = parseFloat(editData.rate);
          body.rate = bonusPercentage / 100;
        }
      } else if (promotion.type === 'one-time' && editData.points !== originalData.points) {
        if (editData.points) {
          body.points = parseInt(editData.points);
        }
      }

      // Only send request if there are changes
      if (Object.keys(body).length === 0) {
        setMessage({ type: 'error', text: 'No changes detected' });
        setActionLoading(false);
        return;
      }

      await api.patch(`/promotions/${promotion.id}`, body);

      setMessage({ type: 'success', text: 'Promotion updated successfully!' });
      setEditMode(false);
      await fetchPromotion();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update promotion',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete promotion
  const handleDeletePromotion = async () => {
    if (!promotion) return;

    if (!window.confirm(`Are you sure you want to delete the promotion "${promotion.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await api.delete(`/promotions/${promotion.id}`);
      setMessage({ type: 'success', text: 'Promotion deleted successfully!' });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/manager/promotions');
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to delete promotion',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Determine promotion status based on end time
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
              onClick={() => router.push('/dashboard/manager/promotions')}
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
          onClick={() => router.push('/dashboard/manager/promotions')}
          className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Promotions
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

        {/* Promotion Details Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 sm:p-6">
            {/* Header with name and badges */}
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{promotion.name}</h1>
              <div className="flex space-x-2">
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${status.color}`}>
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

            {/* Edit Mode or View Mode */}
            {editMode ? (
              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Min Spending Input */}
                <div>
                  <label htmlFor="minSpending" className="block text-sm font-medium text-gray-700">
                    Minimum Spending
                  </label>
                  <input
                    type="number"
                    id="minSpending"
                    value={editData.minSpending}
                    onChange={(e) => setEditData({ ...editData, minSpending: e.target.value })}
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Type-specific value input */}
                {promotion.type === 'automatic' ? (
                  <div>
                    <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
                      Bonus Percentage
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="rate"
                        value={editData.rate}
                        onChange={(e) => setEditData({ ...editData, rate: e.target.value })}
                        step="1"
                        min="1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border pr-12"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Percentage of bonus points on top of base earnings
                    </p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                      Bonus Points
                    </label>
                    <input
                      type="number"
                      id="points"
                      value={editData.points}
                      onChange={(e) => setEditData({ ...editData, points: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                )}

                {/* Start Time Input */}
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    value={editData.startTime}
                    onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* End Time Input */}
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    value={editData.endTime}
                    onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdatePromotion}
                    disabled={actionLoading}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      fetchPromotion();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Description */}
                <p className="text-gray-700 mb-6">{promotion.description}</p>

                {/* Promotion Details Grid */}
                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {promotion.type === 'automatic' 
                        ? 'Automatic - Applied automatically when conditions are met' 
                        : 'One-Time - Can be applied once per user by cashier'}
                    </dd>
                  </div>

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

                  {promotion.minSpending !== null && promotion.minSpending !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Minimum Purchase</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        ${promotion.minSpending.toFixed(2)}
                      </dd>
                    </div>
                  )}

                  {promotion.startTime && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Start Time</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(new Date(promotion.startTime), 'EEEE, MMMM dd, yyyy h:mm a')}
                      </dd>
                    </div>
                  )}

                  {promotion.endTime && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">End Time</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(new Date(promotion.endTime), 'EEEE, MMMM dd, yyyy h:mm a')}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit Promotion
                  </button>
                  <button
                    onClick={handleDeletePromotion}
                    disabled={actionLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Delete Promotion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}