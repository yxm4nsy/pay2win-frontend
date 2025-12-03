'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Promotion {
  id: number;
  name: string;
  minSpending: number | null;
  rate: number | null;
  points: number | null;
}

/**
 * Cashier Purchase page
 * Allows cashiers to create purchase transactions and award points to customers
 * Supports applying one-time promotions for bonus points
 */
export default function CashierPurchasePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    utorid: '',
    spent: '',
    promotionIds: [] as number[],
    remark: '',
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const spent = parseFloat(formData.spent);
    if (spent <= 0) {
      setMessage({ type: 'error', text: 'Amount must be greater than 0' });
      setLoading(false);
      return;
    }

    try {
      // Create the purchase transaction
      const response = await api.post('/transactions', {
        utorid: formData.utorid,
        type: 'purchase',
        spent: spent,
        promotionIds: formData.promotionIds,
        remark: formData.remark,
      });

      setMessage({ 
        type: 'success', 
        text: `Purchase successful!` 
      });
      
      // Reset form
      setFormData({ utorid: '', spent: '', promotionIds: [], remark: '' });
      setAvailablePromotions([]);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/cashier');
      }, 2000);

    } catch (error: any) {
      if (error.response?.status === 404) {
        setMessage({ type: 'error', text: 'User not found. Please check the UTORid.' });
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || error.message || 'Failed to create purchase transaction' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Lookup available promotions for customer
  const handleLookupPromotions = async () => {
    if (!formData.utorid) {
      setMessage({ type: 'error', text: 'Please enter a UTORid first' });
      return;
    }

    try {
      // Lookup user to get their ID
      const lookupResponse = await api.get(`/users/lookup/${formData.utorid}`);
      const userId = lookupResponse.data.id;
      
      // Fetch user's available promotions
      const response = await api.get(`/users/${userId}`);
      setAvailablePromotions(response.data.promotions || []);
      
      if (response.data.promotions && response.data.promotions.length > 0) {
        setMessage({ 
          type: 'success', 
          text: `Found ${response.data.promotions.length} available promotion(s) for ${formData.utorid}` 
        });
      } else {
        setMessage({ 
          type: 'success', 
          text: `No promotions available for ${formData.utorid}` 
        });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setMessage({ type: 'error', text: 'User not found. Please check the UTORid.' });
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Failed to lookup user promotions' 
        });
      }
    }
  };

  // Toggle promotion selection
  const togglePromotion = (promotionId: number) => {
    setFormData(prev => ({
      ...prev,
      promotionIds: prev.promotionIds.includes(promotionId)
        ? prev.promotionIds.filter(id => id !== promotionId)
        : [...prev.promotionIds, promotionId]
    }));
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Purchase Transaction</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter customer information and purchase details to award points
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

        {/* Purchase Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer UTORid with Promotion Lookup */}
              <div>
                <label htmlFor="utorid" className="block text-sm font-medium text-gray-700">
                  Customer UTORid
                </label>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="text"
                    id="utorid"
                    value={formData.utorid}
                    onChange={(e) => {
                      setFormData({ ...formData, utorid: e.target.value });
                      setAvailablePromotions([]);
                    }}
                    placeholder="e.g., jdoe"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleLookupPromotions}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
                  >
                    Check Promotions
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Click "Check Promotions" to see available one-time promotions
                </p>
              </div>

              {/* Purchase Amount */}
              <div>
                <label htmlFor="spent" className="block text-sm font-medium text-gray-700">
                  Purchase Amount ($)
                </label>
                <input
                  type="number"
                  id="spent"
                  value={formData.spent}
                  onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                  placeholder="e.g., 25.50"
                  step="0.01"
                  min="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Base rate: 1 point per $0.25
                </p>
              </div>

              {/* Available Promotions Selection */}
              {availablePromotions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Promotions (One-Time)
                  </label>
                  <div className="space-y-2">
                    {availablePromotions.map((promo) => (
                      <div
                        key={promo.id}
                        className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          id={`promo-${promo.id}`}
                          checked={formData.promotionIds.includes(promo.id)}
                          onChange={() => togglePromotion(promo.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`promo-${promo.id}`} className="ml-3 flex-1 cursor-pointer">
                          <span className="block text-sm font-medium text-gray-900">
                            {promo.name}
                          </span>
                          <span className="block text-xs text-gray-500">
                            +{promo.points} bonus points
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Note */}
              <div>
                <label htmlFor="remark" className="block text-sm font-medium text-gray-700">
                  Note (Optional)
                </label>
                <textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="e.g., Store location, transaction details"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Complete Purchase'}
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
      </div>
    </div>
  );
}