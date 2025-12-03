'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

/**
 * Create Promotion page
 * Allows managers to create new automatic or one-time promotions
 */
export default function CreatePromotionPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [type, setType] = useState<'automatic' | 'one-time'>('automatic');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minSpending, setMinSpending] = useState('');
  const [rate, setRate] = useState('');
  const [points, setPoints] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!name.trim() || !description.trim() || !startTime || !endTime) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    // Validate type-specific fields
    if (type === 'automatic') {
      const bonusPercentage = parseFloat(rate);
      if (isNaN(bonusPercentage) || bonusPercentage <= 0) {
        setMessage({ type: 'error', text: 'Please enter a valid bonus percentage for automatic promotions' });
        return;
      }
    } else {
      const pointsValue = parseInt(points);
      if (isNaN(pointsValue) || pointsValue <= 0) {
        setMessage({ type: 'error', text: 'Please enter a valid points value for one-time promotions' });
        return;
      }
    }

    setLoading(true);
    setMessage(null);
    setError('');

    try {
      const body: any = {
        type,
        name: name.trim(),
        description: description.trim(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      };

      if (minSpending) {
        body.minSpending = parseFloat(minSpending);
      }

      if (type === 'automatic') {
        const bonusPercentage = parseFloat(rate);
        // Convert percentage to rate (rate field in DB)
        body.rate = bonusPercentage / 100;
      } else {
        body.points = parseInt(points);
      }

      await api.post('/promotions', body);

      setMessage({ type: 'success', text: 'Promotion created successfully!' });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/manager/promotions');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create promotion');
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create promotion' });
    } finally {
      setLoading(false);
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
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

        {/* Form Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Promotion</h1>
            <p className="text-sm text-gray-600 mb-6">
              Create a new promotion to reward customers with bonus points.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Promotion Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promotion Type <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="automatic"
                      checked={type === 'automatic'}
                      onChange={(e) => setType(e.target.value as 'automatic')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Automatic</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="one-time"
                      checked={type === 'one-time'}
                      onChange={(e) => setType(e.target.value as 'one-time')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">One-Time</span>
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Automatic: Applied automatically to qualifying purchases. One-Time: Must be manually selected by cashier.
                </p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Promotion Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Bonus"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the promotion..."
                  rows={3}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Minimum Spending (Optional) */}
              <div>
                <label htmlFor="minSpending" className="block text-sm font-medium text-gray-700">
                  Minimum Spending (Optional)
                </label>
                <input
                  type="number"
                  id="minSpending"
                  value={minSpending}
                  onChange={(e) => setMinSpending(e.target.value)}
                  placeholder="e.g., 50.00"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum purchase amount required to qualify for this promotion
                </p>
              </div>

              {/* Type-specific fields */}
              {type === 'automatic' ? (
                <div>
                  <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
                    Bonus Percentage <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      id="rate"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="e.g., 50 (for 50% bonus)"
                      step="1"
                      min="1"
                      required
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Percentage of bonus points on top of base earnings (e.g., 50% = 1.5x total, 100% = 2x total)
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                    Bonus Points <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="points"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="e.g., 100"
                    min="1"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Fixed number of bonus points awarded with this promotion
                  </p>
                </div>
              )}

              {/* Start Time */}
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
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
                  {loading ? 'Creating...' : 'Create Promotion'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/manager/promotions')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}